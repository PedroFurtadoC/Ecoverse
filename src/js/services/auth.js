import { getSupabase, isConfigured } from './supabase.js';

let currentUser = null;
let currentProfile = null;
const listeners = new Set();

function notify() {
  for (const l of listeners) {
    try { l(currentUser); } catch (e) { /* ignore */ }
  }
}

async function fetchProfile(userId) {
  const supa = await getSupabase();
  if (!supa) return null;
  const { data } = await supa
    .from('profiles')
    .select('display_name, avatar_url, school, created_at')
    .eq('id', userId)
    .maybeSingle();
  return data ?? null;
}

export async function init() {
  if (!isConfigured()) return null;
  const supa = await getSupabase();
  if (!supa) return null;

  const { data } = await supa.auth.getSession();
  currentUser = data?.session?.user ?? null;
  if (currentUser) currentProfile = await fetchProfile(currentUser.id);
  notify();

  supa.auth.onAuthStateChange(async (_event, session) => {
    const next = session?.user ?? null;
    const changed = next?.id !== currentUser?.id;
    currentUser = next;
    if (changed) {
      currentProfile = next ? await fetchProfile(next.id) : null;
    }
    notify();
  });

  return currentUser;
}

export function getUser() {
  return currentUser;
}

export function getProfile() {
  return currentProfile;
}

export function isSignedIn() {
  return !!currentUser;
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

export async function updateDisplayName(displayName) {
  const supa = await getSupabase();
  if (!supa || !currentUser) throw new Error('Sem sessão');
  const trimmed = String(displayName ?? '').trim().slice(0, 60);
  if (trimmed.length < 1) throw new Error('Nome muito curto');
  const { data, error } = await supa
    .from('profiles')
    .update({ display_name: trimmed })
    .eq('id', currentUser.id)
    .select()
    .single();
  if (error) throw error;
  currentProfile = data;
  notify();
  return data;
}

// Exclusão da conta. As tabelas profiles/progress/pomodoro_sessions usam
// ON DELETE CASCADE em auth.users(id), então remover o usuário leva todo
// o histórico junto. Como a API pública não permite deletar auth.users
// diretamente, fazemos o que dá: limpar os dados das tabelas próprias
// e encerrar a sessão. O registro em auth.users fica órfão até a UNAERP
// rodar uma limpeza administrativa (descrita no manual de manutenção).
export async function deleteOwnData() {
  const supa = await getSupabase();
  if (!supa || !currentUser) throw new Error('Sem sessão');
  const uid = currentUser.id;

  await supa.from('pomodoro_sessions').delete().eq('user_id', uid);
  await supa.from('progress').delete().eq('user_id', uid);
  await supa.from('profiles').delete().eq('id', uid);
  await supa.auth.signOut();
}
