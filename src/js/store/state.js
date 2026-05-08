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
      state.lastSavedAt         = s.lastSavedAt ?? null;
    }
  } catch (e) { /* start fresh */ }
}
