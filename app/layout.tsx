import '../style.css'; // Import global de votre CSS existant

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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8D5537" />
        <link rel="apple-touch-icon" href="/delivery_logo_premium.jpg" />
      </head>
      <body>
        {children}

      </body>
    </html>
  );
}
