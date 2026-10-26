// Service worker do Ecoverse: cache mínimo para a segunda visita abrir rápido.
// JS e CSS do build têm hash no nome, então podem sair direto do cache.
// Imagens, ícones e manifesto não têm hash: saem do cache e são atualizados em
// segundo plano, assim uma imagem trocada aparece já na visita seguinte.
// Páginas, Supabase e outras origens passam direto pela rede.

const CACHE_VERSION = 'ecoverse-v2';
const BUILD_PATTERN = /^\/assets\/[^/]+\.(js|css)$/;
const STATIC_PATTERNS = [
  /^\/assets\/.*\.(svg|png|jpg|jpeg|webp)$/,
  /^\/(favicon|apple-touch-icon|icon-maskable)\.(png|svg)$/,
  /^\/manifest\.webmanifest$/
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

  // Sem cache pra origens externas (Supabase, fontes do Google), deixa o browser cuidar.
  if (url.origin !== self.location.origin) return;

  if (BUILD_PATTERN.test(url.pathname)) {
    event.respondWith(fromCacheFirst(request));
  } else if (STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(fromCacheThenUpdate(event, request));
  }
});

function fromCacheFirst(request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request).then((cached) => cached || fetchAndStore(cache, request))
  );
}

function fromCacheThenUpdate(event, request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request).then((cached) => {
      const fresh = fetchAndStore(cache, request);
      if (!cached) return fresh;
      // Offline, a atualização falha e quem está jogando continua com a cópia.
      event.waitUntil(fresh.catch(() => {}));
      return cached;
    })
  );
}

function fetchAndStore(cache, request) {
  return fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
}
