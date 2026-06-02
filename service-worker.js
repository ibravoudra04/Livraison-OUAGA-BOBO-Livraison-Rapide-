const CACHE_NAME = 'livraison-rapide-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './delivery_logo_premium.jpg',
  './delivery_logo.png',
  './burkina_map.png',
  './ouaga_monument.png',
  './bobo_mosque.png',
  './lib/leaflet.css',
  './lib/leaflet.js',
  './lib/supabase.js',
  './lib/images/marker-icon.png',
  './lib/images/marker-shadow.png',
  './lib/images/marker-icon-2x.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only cache GET requests, internal domain assets, and critical CDNs (Leaflet, Supabase)
  const isGet = event.request.method === 'GET';
  const isCdn = event.request.url.includes('unpkg.com') || event.request.url.includes('jsdelivr.net');
  const isInternal = event.request.url.startsWith(self.location.origin) || isCdn;

  if (isGet && isInternal) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch fresh copy in the background and update cache
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});
