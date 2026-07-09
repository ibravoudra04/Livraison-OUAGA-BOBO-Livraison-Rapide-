import '../style.css'; // Import global de votre CSS existant
import SwUpdateHandler from '@/components/SwUpdateHandler/SwUpdateHandler';

export const metadata = {
  title: 'Livraison Rapide - Ouaga & Bobo',
  description: 'Application de mise en relation de livreurs et clients en temps réel.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var version = '2026-07-08_v14';
            if (typeof window !== 'undefined' && window.localStorage) {
              if (window.localStorage.getItem('last_forced_reload') !== version) {
                window.localStorage.setItem('last_forced_reload', version);
                
                // Unregister all service workers immediately
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) {
                      regs[i].unregister();
                    }
                  });
                }
                
                // Clear all browser cache storage
                if (typeof caches !== 'undefined') {
                  caches.keys().then(function(keys) {
                    Promise.all(keys.map(function(k) { return caches.delete(k); })).then(function() {
                      window.location.reload();
                    });
                  }).catch(function() {
                    window.location.reload();
                  });
                } else {
                  window.location.reload();
                }
              }
            }
          })();
        `}} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8D5537" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <SwUpdateHandler />
        {children}
      </body>
    </html>
  );
}
