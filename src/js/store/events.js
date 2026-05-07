const listeners = new Map();

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  for (const handler of set) {
    try { handler(payload); }
    catch (err) { console.error(`[events] ${event} handler falhou:`, err); }
  }
}

export const EVENTS = Object.freeze({
  REWARD: 'reward',
  TOAST: 'toast',
  POMODORO_COMPLETE: 'pomodoro:complete',
  ACHIEVEMENT_CHECK: 'achievement:check'
});
