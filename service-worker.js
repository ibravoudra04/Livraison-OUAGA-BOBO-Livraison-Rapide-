const CACHE_NAME = 'livraison-rapide-v4';
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
  './vecteezy_google-chrome-icon-logo-symbol_22484495.png',
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
  // We only cache GET requests, internal domain assets, and critical CDNs (Leaflet, Supabase, Fonts, Map tiles)
  const isGet = event.request.method === 'GET';
  const isCdn = event.request.url.includes('unpkg.com') || event.request.url.includes('jsdelivr.net');
  const isInternal = event.request.url.startsWith(self.location.origin) || isCdn;
  const isMapTile = event.request.url.includes('basemaps.cartocdn.com');
  const isFont = event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com');

  if (isGet && (isInternal || isMapTile || isFont)) {
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
