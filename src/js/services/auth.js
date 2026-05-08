import { getSupabase, isConfigured } from './supabase.js';

let currentUser = null;
const listeners = new Set();

function notify() {
  for (const l of listeners) {
    try { l(currentUser); } catch (e) { /* ignore */ }
  }
}

export async function init() {
  if (!isConfigured()) return null;
  const supa = await getSupabase();
  if (!supa) return null;

  const { data } = await supa.auth.getSession();
  currentUser = data?.session?.user ?? null;
  notify();

  supa.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    notify();
  });

  return currentUser;
}

export function getUser() {
  return currentUser;
}

export function onAuthChange(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export async function signInWithMagicLink(email) {
  const supa = await getSupabase();
  if (!supa) throw new Error('Supabase não configurado');
  const { error } = await supa.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const supa = await getSupabase();
  if (!supa) throw new Error('Supabase não configurado');
  const { error } = await supa.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function signOut() {
  const supa = await getSupabase();
  if (!supa) return;
  await supa.auth.signOut();
}
