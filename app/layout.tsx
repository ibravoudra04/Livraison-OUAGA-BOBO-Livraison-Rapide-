import type { Metadata, Viewport } from 'next';
import '../style.css'; // Import global de votre CSS existant
import SwUpdateHandler from '@/components/SwUpdateHandler/SwUpdateHandler';

const siteUrl = 'https://livraisonrapide.app';
const siteTitle = 'Livraison Rapide — Ouaga & Bobo';
const siteDescription =
  'Mettez-vous en contact instantanément avec des livreurs indépendants à Ouagadougou et Bobo-Dioulasso en temps réel.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s | Livraison Rapide',
  },
  description: siteDescription,
  applicationName: 'Livraison Rapide',
  keywords: [
    'Livraison Rapide',
    'Ouaga',
    'Bobo',
    'Ouagadougou',
    'Bobo-Dioulasso',
    'Livreur',
    'Burkina Faso',
    'Livraison moto',
    'Colis',
  ],
  authors: [{ name: 'Livraison Rapide' }],
  creator: 'Livraison Rapide',
  publisher: 'Livraison Rapide',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'Livraison Rapide',
    locale: 'fr_BF',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 600,
        height: 600,
        alt: 'Livraison Rapide Logo',
        type: 'image/jpeg',
      },
      {
        url: `${siteUrl}/og-image.png`,
        width: 600,
        height: 600,
        alt: 'Livraison Rapide Logo',
        type: 'image/png',
      },
      {
        url: `${siteUrl}/icon.png`,
        width: 512,
        height: 512,
        alt: 'Livraison Rapide Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/og-image.jpg`],
  },
  other: {
    image: `${siteUrl}/og-image.jpg`,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#8D5537',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            var version = '2026-07-11_v18';
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
        `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="image_src" href={`${siteUrl}/og-image.jpg`} />
        <meta name="image" content={`${siteUrl}/og-image.jpg`} />
      </head>
      <body>
        <SwUpdateHandler />
        {children}
      </body>
    </html>
  );
}

