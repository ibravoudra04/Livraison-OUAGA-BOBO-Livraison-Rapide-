// Ce script est injecté dans le nouveau Service Worker.
// Gère deux cas :
// 1. Migration depuis l'ancienne app Vanilla JS → nettoie les anciens caches
// 2. Mise à jour de l'app Next.js → nettoie les caches de pages/chunks périmés
//    pour éviter "This page couldn't load" après chaque déploiement.

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = [];
      let needsReload = false;

      for (const cacheName of cacheNames) {
        const isNewCache = cacheName.startsWith('workbox-') ||
                           cacheName.startsWith('next-') ||
                           cacheName.startsWith('start-url') ||
                           cacheName.startsWith('google-fonts') ||
                           cacheName.startsWith('static-') ||
                           cacheName.startsWith('apis') ||
                           cacheName.startsWith('pages') ||
                           cacheName.startsWith('cross-origin');

        if (!isNewCache) {
          // Ancien cache Vanilla JS → migration
          console.log('[SW] Ancien cache supprimé (migration):', cacheName);
          needsReload = true;
          deletePromises.push(caches.delete(cacheName));
        } else if (
          // Caches de pages et chunks JS : toujours vider à l'activation
          // pour éviter que d'anciens chunks cassent la page après un redéploiement
          cacheName.startsWith('pages') ||
          cacheName.startsWith('next-static-js') ||
          cacheName.startsWith('start-url')
        ) {
          console.log('[SW] Cache de pages/chunks périmé vidé:', cacheName);
          needsReload = true;
          deletePromises.push(caches.delete(cacheName));
        }
      }

      return Promise.all(deletePromises).then(() => {
        if (needsReload) {
          console.log('[SW] Caches nettoyés. Rechargement des clients...');
          return self.clients.claim().then(() => {
            return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          }).then((windowClients) => {
            windowClients.forEach((client) => {
              client.navigate(client.url);
            });
          });
        }
      });
    })
  );
});

// ==========================================
// GESTION DES NOTIFICATIONS PUSH
// ==========================================

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Vous avez une nouvelle notification',
        icon: '/delivery_logo_premium.jpg',
        badge: '/delivery_logo_premium.jpg',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: { url: data.url || '/' },
        requireInteraction: true
      };
      event.waitUntil(self.registration.showNotification(data.title || 'Livraison Rapide', options));
    } catch (e) {
      console.error('Erreur parsing notification push', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Chercher si l'app est déjà ouverte
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
