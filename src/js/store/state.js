import { GAME_CONFIG } from '../config/data.js';

export const state = {
  energy: GAME_CONFIG.initialEnergy,
  coins: GAME_CONFIG.initialCoins,
  impact: GAME_CONFIG.initialImpact,
  completed: [],
  currentMission: null,
  pomodorosCompleted: 0,
  bestStreak: 0,
  perfectMinigames: 0,
  achievements: [],
  plantedTrees: [],
  // Progresso dos quizzes ODS por id: { "1": { score, perfect, attempts }, ... }
  // Vive aqui no estado principal pra ir junto com o save e o sync na nuvem.
  quizzes: {},
  eggCompleted: false,
  lastSavedAt: null
};

export function saveState() {
  try {
    state.lastSavedAt = new Date().toISOString();
    localStorage.setItem(GAME_CONFIG.storageKey, JSON.stringify({
      energy: state.energy, coins: state.coins,
      impact: state.impact, completed: state.completed,
      pomodorosCompleted: state.pomodorosCompleted,
      bestStreak: state.bestStreak,
      perfectMinigames: state.perfectMinigames,
      achievements: state.achievements,
      plantedTrees: state.plantedTrees,
      quizzes: state.quizzes,
      eggCompleted: state.eggCompleted,
      lastSavedAt: state.lastSavedAt
    }));
  } catch (e) { /* silent */ }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(GAME_CONFIG.storageKey);
    if (raw) {
      const s = JSON.parse(raw);
      state.energy              = s.energy ?? GAME_CONFIG.initialEnergy;
      state.coins               = s.coins ?? GAME_CONFIG.initialCoins;
      state.impact              = s.impact ?? GAME_CONFIG.initialImpact;
      state.completed           = s.completed ?? [];
      state.pomodorosCompleted  = s.pomodorosCompleted ?? 0;
      state.bestStreak          = s.bestStreak ?? 0;
      state.perfectMinigames    = s.perfectMinigames ?? 0;
      state.achievements        = s.achievements ?? [];
      state.plantedTrees        = s.plantedTrees ?? [];
      state.quizzes             = s.quizzes ?? {};
      state.eggCompleted        = s.eggCompleted === true;
      state.lastSavedAt         = s.lastSavedAt ?? null;
    }
  } catch (e) { /* start fresh */ }
}

// Score determinístico e monotonicamente crescente — uma vez que o
// jogador avança numa dimensão, ela nunca regride. Usado como tie-breaker
// pra decidir qual save é o "mais avançado" sem depender de timestamp
// (parser de data falha em alguns formatos do Postgres, clock drift,
// race condition de lastSavedAt em boot). Pesos privilegiam o que é
// difícil de obter: missão completa vale mais que moeda solta.
export function progressScore(s) {
  if (!s) return -1;
  const completed = (s.completed?.length ?? 0);
  const coins     = (s.coins ?? 0);
  const pomodoros = (s.pomodoros_completed ?? s.pomodorosCompleted ?? 0);
  const achiev    = (s.achievements?.length ?? 0);
  const quizzes   = Object.keys(s.quizzes ?? {}).length;
  const trees     = (s.planted_trees?.length ?? s.plantedTrees?.length ?? 0);
  return completed * 100 + pomodoros * 25 + quizzes * 20 + achiev * 10 + coins + trees;
}

// Indica se o save tem qualquer sinal de progresso real. Usado pra
// decidir o lado "vazio" do merge — quando um save está zerado, o outro
// vence sem comparação.
export function hasMeaningfulProgress(s) {
  if (!s) return false;
  return (s.coins ?? 0) > 0
      || (s.completed?.length ?? 0) > 0
      || (s.pomodoros_completed ?? s.pomodorosCompleted ?? 0) > 0
      || (s.achievements?.length ?? 0) > 0
      || Object.keys(s.quizzes ?? {}).length > 0;
}

// Aplica os campos da nuvem no state local fazendo merge inteligente:
// - arrays (completed, achievements): UNION — preserva itens dos dois lados
// - contadores monotônicos (coins, pomodoros, impact): MAX
// - energia (oscila por gasto): adota o lado com maior progressScore
// - plantedTrees: lado com mais árvores vence (não dá pra unir bem porque
//   coordenadas são aleatórias e podem duplicar visualmente)
// - quizzes: por ID, mantém o melhor score
//
// Retorna true se alguma coisa mudou em state — útil pra decidir se
// dispara HUD update / refresh de globo / toast pro usuário.
export function applyCloudState(cloudState) {
  if (!cloudState) return false;

  const before = JSON.stringify({
    c: state.coins, cm: state.completed.length, p: state.pomodorosCompleted,
    a: state.achievements.length, q: Object.keys(state.quizzes ?? {}).length,
    t: state.plantedTrees.length, i: state.impact
  });

  const cloudIsAhead = progressScore(cloudState) > progressScore(state);
  const union = (a = [], b = []) => Array.from(new Set([...(a ?? []), ...(b ?? [])]));

  // Energia segue o save vencedor. Se a nuvem está à frente, foi gasta lá.
  if (cloudIsAhead && Number.isFinite(cloudState.energy)) {
    state.energy = cloudState.energy;
  }

  state.coins              = Math.max(state.coins ?? 0,              cloudState.coins ?? 0);
  state.impact             = Math.max(Number(state.impact ?? 0),     Number(cloudState.impact ?? 0));
  state.pomodorosCompleted = Math.max(state.pomodorosCompleted ?? 0, cloudState.pomodoros_completed ?? 0);
  state.bestStreak         = Math.max(state.bestStreak ?? 0,         cloudState.best_streak ?? 0);
  state.perfectMinigames   = Math.max(state.perfectMinigames ?? 0,   cloudState.perfect_minigames ?? 0);

  state.completed    = union(state.completed,    cloudState.completed);
  state.achievements = union(state.achievements, cloudState.achievements);

  // Árvores: lado com mais. Coordenadas aleatórias não unem bem.
  const cloudTrees = cloudState.planted_trees ?? [];
  if (cloudTrees.length > (state.plantedTrees?.length ?? 0)) {
    state.plantedTrees = cloudTrees;
  }

  // Quizzes: por ODS id, mantém o melhor score.
  const localQ = state.quizzes ?? {};
  const cloudQ = cloudState.quizzes ?? {};
  const merged = { ...localQ };
  for (const [id, c] of Object.entries(cloudQ)) {
    const l = merged[id];
    const lScore = l?.score ?? -1;
    const cScore = c?.score ?? -1;
    if (cScore > lScore) merged[id] = c;
    else if (cScore === lScore && c?.perfect && !l?.perfect) merged[id] = c;
  }
  state.quizzes = merged;

  const after = JSON.stringify({
    c: state.coins, cm: state.completed.length, p: state.pomodorosCompleted,
    a: state.achievements.length, q: Object.keys(state.quizzes ?? {}).length,
    t: state.plantedTrees.length, i: state.impact
  });
  return before !== after;
}
