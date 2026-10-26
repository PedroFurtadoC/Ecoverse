// Service worker do Ecoverse: cache mínimo para a segunda visita abrir rápido.
// JS e CSS do build têm hash no nome, então podem sair direto do cache.
// Imagens, ícones e manifesto não têm hash: saem do cache e são atualizados em
// segundo plano, assim uma imagem trocada aparece já na visita seguinte.
// A página sempre vem da rede; sem internet, abre a última cópia que deu certo.
// Supabase e outras origens passam direto, sem cache.

const CACHE_VERSION = 'ecoverse-v2';
const PAGE_KEY = '/';
const BUILD_PATTERN = /^\/assets\/[^/]+\.(js|css)$/;
const STATIC_PATTERNS = [
  /^\/assets\/.*\.(svg|png|jpg|jpeg|webp)$/,
  /^\/(favicon|apple-touch-icon|icon-maskable)\.(png|svg)$/,
  /^\/manifest\.webmanifest$/
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(savePageAndBuild().catch(() => {}));
});

// Na primeira visita a página carrega antes de o service worker existir, então
// nada passa por ele. Para o site abrir sem internet já depois dessa visita, a
// instalação guarda a página, os arquivos que ela pede e os pedaços de JS que
// esses arquivos carregam depois (o globo vem num arquivo separado).
async function savePageAndBuild() {
  const cache = await caches.open(CACHE_VERSION);
  const page = await fetch(PAGE_KEY);
  if (!page.ok) return;
  const html = await page.clone().text();
  await cache.put(PAGE_KEY, page);

  const files = new Set([...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+)"/g)].map((m) => '/' + m[1]));
  for (const file of [...files].filter((f) => f.endsWith('.js'))) {
    const js = await fetch(file).then((r) => r.text());
    for (const m of js.matchAll(/["'`]\.\/([\w-]+\.js)["'`]/g)) files.add('/assets/' + m[1]);
  }
  await Promise.all([...files].map((file) => cache.add(file).catch(() => {})));
}

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

  if (request.mode === 'navigate') {
    event.respondWith(fromNetworkOrLastCopy(request));
  } else if (BUILD_PATTERN.test(url.pathname)) {
    event.respondWith(fromCacheFirst(request));
  } else if (STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(fromCacheThenUpdate(event, request));
  }
});

// O site tem uma página só, então qualquer endereço guarda e reaproveita a
// mesma cópia, inclusive com ?dev=free na URL.
function fromNetworkOrLastCopy(request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    fetch(request)
      .then((response) => {
        if (response.ok) cache.put(PAGE_KEY, response.clone());
        return response;
      })
      .catch(() => cache.match(PAGE_KEY).then((cached) => cached || Response.error()))
  );
}

function fromCacheFirst(request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request, { ignoreVary: true }).then((cached) => cached || fetchAndStore(cache, request))
  );
}

function fromCacheThenUpdate(event, request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request, { ignoreVary: true }).then((cached) => {
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
