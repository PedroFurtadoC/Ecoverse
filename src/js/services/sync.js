import { getSupabase } from './supabase.js';
import { getUser } from './auth.js';
import { state } from '../store/state.js';

const DEBOUNCE_MS = 2000;
let pendingTimer = null;

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
    perfect_minigames: state.perfectMinigames
  };
}

async function flush() {
  pendingTimer = null;
  const user = getUser();
  if (!user) return;
  const supa = await getSupabase();
  if (!supa) return;

  const payload = { user_id: user.id, ...snapshot() };
  const { error } = await supa.from('progress').upsert(payload, { onConflict: 'user_id' });
  if (error) console.warn('[sync] upsert falhou:', error.message);
}

export function scheduleSync() {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(flush, DEBOUNCE_MS);
}

export async function pullState() {
  const user = getUser();
  if (!user) return null;
  const supa = await getSupabase();
  if (!supa) return null;

  const { data, error } = await supa
    .from('progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[sync] leitura falhou:', error.message);
    return null;
  }
  return data;
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
