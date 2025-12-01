const CACHE_NAME = 'mandarin-app-v1';

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Install: cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Audio files: Cache First
  if (/\.(?:mp3|wav|ogg)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open('audio-cache').then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // API requests: Network First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open('api-cache').then((cache) =>
        fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  // Static assets: Cache First
  if (/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open('static-cache').then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Pages/navigation: Network First with cache fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.open('pages-cache').then((cache) =>
        fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
