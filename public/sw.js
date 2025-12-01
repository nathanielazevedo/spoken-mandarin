const CACHE_NAME = 'mandarin-app-v1';

// Install: skip precaching, let runtime caching handle it
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME && !key.startsWith('mandarin-app')).map((key) => caches.delete(key))
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
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached || new Response('Audio not available offline', { status: 503 }));
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
          .catch(() => cache.match(request).then((cached) => 
            cached || new Response(JSON.stringify({ error: 'Offline' }), { 
              status: 503, 
              headers: { 'Content-Type': 'application/json' } 
            })
          ))
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
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => new Response('', { status: 503 }));
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
          .catch(() => cache.match(request).then((cached) =>
            cached || caches.match('/') || new Response('Offline', { status: 503 })
          ))
      )
    );
    return;
  }

  // Default: Network First with fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
      .then((response) => response || new Response('', { status: 503 }))
  );
});
