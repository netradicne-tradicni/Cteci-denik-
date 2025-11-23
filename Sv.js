const CACHE_NAME = 'ctenarsky-denik-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalace – uložíme si základní soubory do cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Aktivace – čistíme staré cache (když změníš verzi)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch – nejdřív zkusíme síť, když nefunguje, sáhneme do cache
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // jen GET požadavky
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // kopii uložíme do cache pro příště
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // když jsme offline → zkusíme cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // fallback: když nenajdeme nic, zkusíme vrátit homepage
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
