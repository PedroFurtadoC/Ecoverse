// Service worker do Ecoverse — cache mínimo para suporte offline básico.
// Estratégia: cache-first para os ativos do build (carimbados com hash pelo Vite),
// network-first para tudo que vai pra Supabase ou APIs externas.

const CACHE_VERSION = 'ecoverse-v1';
const STATIC_PATTERNS = [
  /\/assets\/.*-[A-Za-z0-9]+\.(js|css|woff2?)$/,
  /\/assets\/.*\.(svg|png|jpg|jpeg|webp)$/,
  /\/favicon\.png$/,
  /\/manifest\.webmanifest$/
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Sem cache pra origens externas (Supabase, fontes do Google) — deixa o browser cuidar.
  if (url.origin !== self.location.origin) return;

  const isStatic = STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (!isStatic) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
