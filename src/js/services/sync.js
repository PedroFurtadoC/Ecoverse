import { getSupabase } from './supabase.js';
import { getUser } from './auth.js';
import { state } from '../store/state.js';

const DEBOUNCE_MS = 2000;
let pendingTimer = null;

// =============================================================
// Status pra UI (idle | syncing | online | offline | error).
// =============================================================
// Pequena máquina de eventos pra o menu/HUD mostrarem "Sincronizado",
// "Sincronizando…" ou "Offline" sem precisar saber dos internos do sync.
// listeners recebem (status, syncedAt) e o estado atual é replayed na
// inscrição pra evitar UI vazia no primeiro frame.

const statusListeners = new Set();
let currentStatus = 'idle';
let lastSyncedAt = null;

function setStatus(next) {
  if (next === currentStatus) return;
  currentStatus = next;
  if (next === 'online') lastSyncedAt = new Date();
  for (const fn of statusListeners) {
    try { fn(currentStatus, lastSyncedAt); } catch (e) { /* ignore */ }
  }
}

export function getStatus() {
  return { status: currentStatus, syncedAt: lastSyncedAt };
}

export function onStatusChange(fn) {
  statusListeners.add(fn);
  try { fn(currentStatus, lastSyncedAt); } catch (e) { /* ignore */ }
  return () => statusListeners.delete(fn);
}

// =============================================================
// Snapshot — formato que sobe pra tabela progress.
// =============================================================
function snapshot() {
  return {
    energy: state.energy,
    coins: state.coins,
    impact: state.impact,
    completed: state.completed,
    achievements: state.achievements,
    planted_trees: state.plantedTrees,
    pomodoros_completed: state.pomodorosCompleted,
    best_streak: state.bestStreak,
    perfect_minigames: state.perfectMinigames,
    quizzes: state.quizzes ?? {}
  };
}

async function flush() {
  pendingTimer = null;
  const user = getUser();
  if (!user) { setStatus('idle'); return; }

  setStatus('syncing');
  const supa = await getSupabase();
  if (!supa) { setStatus('offline'); return; }

  try {
    const payload = { user_id: user.id, ...snapshot() };
    const { error } = await supa.from('progress').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      setStatus('error');
      console.warn('[sync] upsert falhou:', error.message);
    } else {
      setStatus('online');
    }
  } catch (err) {
    setStatus('error');
    console.warn('[sync] upsert exceção:', err?.message ?? err);
  }
}

// Agendamento normal: agrupa mutações próximas em uma única gravação.
export function scheduleSync() {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(flush, DEBOUNCE_MS);
}

// Versão imediata: dispara o flush agora, sem esperar o debounce.
// Usado pelo botão "Sincronizar agora" no menu, e em pontos críticos
// onde queremos garantia de durabilidade antes de continuar (ex.: o
// usuário gravar progresso significativo e fechar a aba).
export async function pushNow() {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  await flush();
}

// =============================================================
// Leitura
// =============================================================
export async function pullState() {
  const user = getUser();
  if (!user) return null;
  const supa = await getSupabase();
  if (!supa) { setStatus('offline'); return null; }

  const { data, error } = await supa
    .from('progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[sync] leitura falhou:', error.message);
    setStatus('error');
    return null;
  }
  // Sucesso de leitura conta como "online" pra UI — confirma que o cliente
  // conseguiu falar com o backend, mesmo que ainda não tenha gravado nada.
  setStatus('online');
  return data;
}

export async function pullPomodoroHistory() {
  const user = getUser();
  if (!user) return [];
  const supa = await getSupabase();
  if (!supa) return [];

  const { data, error } = await supa
    .from('pomodoro_sessions')
    .select('started_at, duration_seconds, task_name, was_break')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  if (error) {
    console.warn('[sync] histórico de pomodoros falhou:', error.message);
    return [];
  }
  return data ?? [];
}

export async function recordPomodoro({ durationSeconds, taskName, wasBreak = false }) {
  const user = getUser();
  if (!user) return;
  const supa = await getSupabase();
  if (!supa) return;
  await supa.from('pomodoro_sessions').insert({
    user_id: user.id,
    duration_seconds: durationSeconds,
    task_name: taskName ?? null,
    was_break: wasBreak
  });
}

// =============================================================
// Realtime — recebe push quando outro device atualizar nosso progress.
// =============================================================
// Mantém um único canal aberto por sessão. Resubscribe automático em
// caso de troca de usuário (sign-in/out). O onUpdate recebe a linha
// nova da tabela progress (mesmo formato do pullState).

let realtimeChannel = null;
let realtimeUserId = null;

export async function subscribeProgress(onUpdate) {
  const user = getUser();
  if (!user) return;
  // Se já está inscrito no mesmo user, ignora; se mudou, refaz.
  if (realtimeChannel && realtimeUserId === user.id) return;
  await unsubscribeProgress();

  const supa = await getSupabase();
  if (!supa) return;

  realtimeUserId = user.id;
  realtimeChannel = supa
    .channel(`progress:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'progress',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        const row = payload.new ?? payload.record;
        if (row) {
          try { onUpdate(row); } catch (e) { console.warn('[sync] realtime handler:', e); }
        }
      }
    )
    .subscribe((status) => {
      // Eventos: SUBSCRIBED | CHANNEL_ERROR | CLOSED | TIMED_OUT.
      // Não derruba currentStatus do sync push — Realtime é canal paralelo.
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[sync] realtime channel:', status);
      }
    });
}

export async function unsubscribeProgress() {
  if (!realtimeChannel) return;
  try {
    const supa = await getSupabase();
    if (supa) await supa.removeChannel(realtimeChannel);
  } catch (e) { /* ignore */ }
  realtimeChannel = null;
  realtimeUserId = null;
}

// =============================================================
// Leaderboard via função pública get_leaderboard(period, max_rows).
// SECURITY DEFINER no banco filtra colunas seguras (sem email) e
// respeita o período. Pode ser chamada por anon ou authenticated.
// period: 'total' (todos os tempos) ou 'month' (ativos no mês corrente).
// =============================================================
export async function getLeaderboard({ period = 'total', limit = 50 } = {}) {
  const supa = await getSupabase();
  if (!supa) return [];

  const { data, error } = await supa.rpc('get_leaderboard', {
    period,
    max_rows: limit
  });

  if (error) {
    console.warn('[sync] leaderboard falhou:', error.message);
    return [];
  }
  return data ?? [];
}
