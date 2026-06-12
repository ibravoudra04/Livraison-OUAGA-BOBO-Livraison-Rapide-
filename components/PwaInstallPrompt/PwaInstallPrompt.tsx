import React, { useEffect, useState } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch((err) => {
          console.error('ServiceWorker registration failed: ', err);
        });
      });
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
      alignItems: 'center',
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
  );
}
