import React, { useEffect, useState } from 'react';

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_DAYS = 7;

type IosBrowser = 'safari' | 'other' | 'in-app';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosBrowser, setIosBrowser] = useState<IosBrowser>('safari');
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Enregistrement du service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch((err) => {
          console.error('ServiceWorker registration failed: ', err);
        });
      });
    }

    const ua = navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Déjà installé : on n'affiche rien.
    if (isStandalone) return;

    // « Plus tard » récent : on respecte le silence pendant DISMISS_DAYS jours.
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400000) return;
    } catch {}

    if (isIosDevice) {
      setIsIOS(true);

      // Navigateur intégré (Facebook, Instagram, etc.) : l'ajout à l'écran
      // d'accueil n'y est PAS disponible -> il faut d'abord ouvrir dans Safari.
      const isInApp = /FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger|LinkedIn|Pinterest/i.test(ua);
      // Navigateurs iOS tiers : le bouton Partager n'est pas au même endroit.
      const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua);

      setIosBrowser(isInApp ? 'in-app' : isOtherBrowser ? 'other' : 'safari');
      const t = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Chrome : installation native via beforeinstallprompt.
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setShowPrompt(false);
    setShowIosInstructions(false);
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    setShowPrompt(false);
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  const ShareIcon = ({ size = 18 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ verticalAlign: 'middle', margin: '0 2px' }}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
      <polyline points="16 6 12 2 8 6"></polyline>
      <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
  );

  const PlusSquareIcon = ({ size = 18 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ verticalAlign: 'middle', margin: '0 2px' }}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  );

  const card: React.CSSProperties = {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '400px',
    background: 'rgba(255, 255, 255, 0.97)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 10px 30px rgba(54, 42, 33, 0.18)',
    borderRadius: '24px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 9999,
    animation: 'slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  };

  const step: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.92rem',
    color: 'var(--color-charcoal-muted)',
    lineHeight: 1.35,
    textAlign: 'left',
  };
  const num: React.CSSProperties = {
    flex: '0 0 auto',
    width: 24, height: 24,
    borderRadius: '50%',
    background: 'var(--color-primary-brown)',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const primaryBtn: React.CSSProperties = {
    background: 'var(--color-primary-brown)',
    color: 'white', border: 'none', borderRadius: '16px',
    padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer', width: '100%',
  };

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translate(-50%, 0); opacity: 1; }
          50% { transform: translate(-50%, 12px); opacity: 0.6; }
        }
      `}</style>

      <div style={card}>
        {!showIosInstructions ? (
          /* ---------- Bannière initiale (Android + iOS) ---------- */
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <img src="/icons/icon-192.png" alt="Logo"
              style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1rem', fontWeight: 800 }}>
                Installer l'App
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', lineHeight: '1.2' }}>
                Accès plus rapide et complet
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={dismiss}
                style={{ background: 'transparent', border: 'none', fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', cursor: 'pointer', padding: '8px' }}>
                Plus tard
              </button>
              <button onClick={handleInstallClick}
                style={{ background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: '16px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(39, 174, 96, 0.3)' }}>
                Installer
              </button>
            </div>
          </div>
        ) : iosBrowser === 'in-app' ? (
          /* ---------- iOS : navigateur intégré -> ouvrir dans Safari ---------- */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
            <h4 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1rem', fontWeight: 800 }}>
              Ouvrez d'abord dans Safari
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.4 }}>
              L'installation n'est pas possible depuis ce navigateur intégré.
              Touchez le menu <strong>•••</strong> en haut, puis <strong>« Ouvrir dans Safari »</strong>,
              et relancez l'installation.
            </p>
            <button onClick={dismiss} style={primaryBtn}>J'ai compris</button>
          </div>
        ) : (
          /* ---------- iOS : Safari / autres navigateurs ---------- */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <h4 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1rem', fontWeight: 800, textAlign: 'center' }}>
              Ajouter à l'écran d'accueil
            </h4>
            <div style={step}>
              <span style={num}>1</span>
              <span>
                Touchez l'icône <strong>Partager</strong> <ShareIcon />
                {iosBrowser === 'safari' ? ' en bas de Safari' : ' de votre navigateur'}
              </span>
            </div>
            <div style={step}>
              <span style={num}>2</span>
              <span>Faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong> <PlusSquareIcon /></span>
            </div>
            <div style={step}>
              <span style={num}>3</span>
              <span>Touchez <strong>« Ajouter »</strong> en haut à droite. C'est fait ! 🎉</span>
            </div>
            {iosBrowser === 'other' && (
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-charcoal-muted)', textAlign: 'center' }}>
                Astuce : l'opération est plus simple depuis <strong>Safari</strong>.
              </p>
            )}
            <button onClick={dismiss} style={primaryBtn}>J'ai compris</button>
          </div>
        )}
      </div>

      {/* Flèche animée vers la barre d'outils Safari (le bouton Partager y est) */}
      {showIosInstructions && iosBrowser === 'safari' && (
        <div style={{ position: 'fixed', bottom: '6px', left: '50%', zIndex: 9999, animation: 'bounceDown 1.2s ease-in-out infinite', pointerEvents: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
            fill="none" stroke="var(--color-primary-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>
      )}
    </>
  );
}
