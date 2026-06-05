import React from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface ClientDashboardProps {
  clientData: any;
  onLogout: () => void;
  onSimulatePremium: () => void;
}

export default function ClientDashboard({ clientData, onLogout, onSimulatePremium }: ClientDashboardProps) {
  const { logout } = useSupabaseAuth();
  
  if (!clientData) return <div>Chargement...</div>;

  const isPremium = clientData.subscription_paid;

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div id="client-dashboard-panel">
      <div className="driver-dashboard-welcome" style={{ marginBottom: '20px' }}>
        <h3 id="client-dash-phone" style={{ fontWeight: 800, fontSize: '1.15rem' }}>Mon Compte Client</h3>
        <span className={`badge-status ${isPremium ? 'premium' : 'active'}`} id="client-dash-badge" style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', backgroundColor: isPremium ? 'var(--color-primary-yellow)' : 'var(--color-green-light)', color: isPremium ? 'var(--color-primary-brown)' : 'var(--color-green-soft)' }}>
          {isPremium ? 'Client Premium ⭐' : 'Compte Gratuit'}
        </span>
      </div>

      {isPremium && (
        <div id="client-premium-search-box" style={{ marginBottom: '15px' }}>
          <button type="button" className="btn-unlock" id="btn-client-premium-search" style={{ width: '100%', padding: '12px', fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, var(--color-primary-green), var(--color-primary-green-hover))', boxShadow: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'white' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Lancer la recherche automatique
          </button>
        </div>
      )}

      <div id="client-premium-upgrade-box" style={{ display: 'none' }}></div>

      {/* Historique de Consultation */}
      <div className="driver-terms-info" style={{ marginTop: '15px', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', padding: '12px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary-brown)' }}><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          Livreurs Consultés
        </h4>
        <div id="client-viewed-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Aucun livreur consulté pour le moment.</p>
        </div>
      </div>

      {/* Historique de Contact */}
      <div className="driver-terms-info" style={{ marginTop: '15px', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', padding: '12px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary-brown)' }}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
          Contacts Débloqués
        </h4>
        <div id="client-contacted-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Aucun contact débloqué.</p>
        </div>
      </div>

      <button 
        onClick={handleLogout} 
        style={{ 
          width: '100%', marginTop: '20px', padding: '14px', borderRadius: '16px', fontWeight: 'bold',
          background: 'var(--color-primary-red)', color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        Se déconnecter
      </button>
    </div>
  );
}
