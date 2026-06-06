// Ce script est injecté dans le nouveau Service Worker.
// Il détecte les anciens caches de l'application Vanille JS.
// S'il trouve un ancien cache, cela signifie que c'est un ancien utilisateur coincé sur l'ancienne version.
// Il supprime alors le cache et FORCE le rechargement de la page pour afficher la nouvelle application Next.js.

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      let isMigration = false;
      const deletePromises = cacheNames.map((cacheName) => {
        // Les nouveaux caches de next-pwa/workbox commencent par ces préfixes.
        // Tout autre cache est considéré comme appartenant à l'ancienne application.
        const isNewCache = cacheName.startsWith('workbox-') || 
                           cacheName.startsWith('next-') || 
                           cacheName.startsWith('start-url') ||
                           cacheName.startsWith('google-fonts') ||
                           cacheName.startsWith('static-') ||
                           cacheName.startsWith('apis') ||
                           cacheName.startsWith('pages') ||
                           cacheName.startsWith('cross-origin');
                           
        if (!isNewCache) {
          console.log('[Migration SW] Ancien cache détecté et supprimé :', cacheName);
          isMigration = true;
          return caches.delete(cacheName);
        }
      });
      
      return Promise.all(deletePromises).then(() => {
        if (isMigration) {
          console.log('[Migration SW] Migration détectée. Forçage du rechargement des clients...');
          return self.clients.claim().then(() => {
            return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          }).then((windowClients) => {
            windowClients.forEach((windowClient) => {
              console.log('[Migration SW] Rechargement du client :', windowClient.url);
              windowClient.navigate(windowClient.url);
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
