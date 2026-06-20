import React, { useEffect, useState } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch((err) => {
          console.error('ServiceWorker registration failed: ', err);
        });
      });
    }

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (isIosDevice) {
      setIsIOS(true);
      if (!isStandalone) {
        // Wait a bit before showing the custom iOS prompt
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a moment before showing the prompt so it's not too aggressive
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;
    
    setShowPrompt(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px', // Just above the footer
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '400px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      boxShadow: '0 10px 30px rgba(54, 42, 33, 0.15)',
      borderRadius: '24px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 9999,
      animation: 'slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {!showIosInstructions ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <img 
            src="/delivery_logo_premium.jpg" 
            alt="Logo" 
            style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }}
          />
          
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1rem', fontWeight: 800 }}>Installer l'App</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', lineHeight: '1.2' }}>Accès plus rapide et complet</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setShowPrompt(false)}
              style={{ background: 'transparent', border: 'none', fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', cursor: 'pointer', padding: '8px' }}
            >
              Plus tard
            </button>
            <button 
              onClick={handleInstallClick}
              style={{ 
                background: 'var(--color-primary-green)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '16px', 
                padding: '8px 16px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(39, 174, 96, 0.3)'
              }}
            >
              Installer
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center', gap: '10px' }}>
          <h4 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1rem', fontWeight: 800 }}>Installation sur iPhone</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-charcoal-muted)', lineHeight: '1.4' }}>
            Appuyez sur l'icône Partager <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', margin: '0 2px' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> dans Safari,<br/>
            puis sélectionnez <strong>"Sur l'écran d'accueil"</strong> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', margin: '0 2px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </p>
          <button 
            onClick={() => setShowPrompt(false)}
            style={{ 
              background: 'var(--color-primary-brown)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '16px', 
              padding: '8px 24px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '5px',
              width: '100%'
            }}
          >
            J'ai compris
          </button>
        </div>
      )}
    </div>
  );
}
