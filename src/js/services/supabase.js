// Cliente Supabase único, lazy. Falha silenciosa se as variáveis não estiverem
// configuradas — o app continua jogável só com localStorage.

let clientPromise = null;

export function isConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getSupabase() {
  if (!isConfigured()) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )
    ).catch((err) => {
      console.warn('[supabase] não foi possível carregar cliente:', err);
      clientPromise = null;
      return null;
    });
  }
  return clientPromise;
}
