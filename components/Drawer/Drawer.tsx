import React from 'react';

interface DrawerProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Drawer({ id, isOpen, onClose, title, children }: DrawerProps) {
  return (
    <div id={id} className={`location-portal-overlay ${isOpen ? 'open' : ''}`} style={{ zIndex: 2000 }}>
      <div className="location-portal-card" style={{ maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', width: '100%' }}>
          <button className="btn-back-modal" onClick={onClose} aria-label="Fermer le formulaire">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retour
          </button>
        </div>
        <div className="loc-header" style={{ marginTop: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-brown)' }}>
            {title}
          </h2>
        </div>
        <div className="drawer-body" style={{ textAlign: 'left' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
