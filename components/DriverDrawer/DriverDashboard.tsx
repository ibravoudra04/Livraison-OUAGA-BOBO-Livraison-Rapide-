import React from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface DriverDashboardProps {
  driverData: any;
  onLogout: () => void;
  onSimulatePayment: () => void;
}

export default function DriverDashboard({ driverData, onLogout, onSimulatePayment }: DriverDashboardProps) {
  const { logout } = useSupabaseAuth();
  
  if (!driverData) return <div>Chargement...</div>;

  const contacts = driverData.contacts_count || 0;
  const views = driverData.views_count || 0;
  const isPaid = driverData.subscription_paid || false;
  const status = driverData.status;

  let statusBadgeText = "";
  let visibilityText = "";
  let visibilityColor = "";
  let subTextHTML = "";
  let showPayBtn = false;
  let remainingDays = "6 jours"; // Simulées pour l'UI comme avant
  
  if (status === 'en attente') {
    statusBadgeText = "En attente";
    visibilityText = "🔴 Hors ligne";
    visibilityColor = "var(--color-primary-red)";
    subTextHTML = "Votre compte est en cours de validation par notre équipe d'administration.";
  } else if (contacts < 5) {
    statusBadgeText = "Disponible";
    visibilityText = "🟢 En ligne";
    visibilityColor = "var(--color-green-soft)";
    subTextHTML = `Vous bénéficiez de 4 mises en relation offertes. (Vous êtes à ${contacts}/4).`;
  } else if (isPaid) {
    statusBadgeText = "Disponible";
    visibilityText = "🟢 En ligne";
    visibilityColor = "var(--color-green-soft)";
    subTextHTML = "Votre abonnement hebdomadaire de 500 FCFA est actif. Vous êtes visible par tous les clients.";
  } else {
    statusBadgeText = "Suspendu";
    visibilityText = "🔴 Hors ligne";
    visibilityColor = "var(--color-primary-red)";
    subTextHTML = `Vous avez atteint 4 contacts (${contacts}). Veuillez payer votre abonnement de 500 FCFA pour la semaine afin de rester visible.`;
    showPayBtn = true;
    remainingDays = "Expiré";
  }

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const getVehicleEmoji = (v: string) => {
    if (v?.toLowerCase().includes('moto')) return '🏍️';
    if (v?.toLowerCase().includes('tricycle')) return '🛺';
    if (v?.toLowerCase().includes('voiture')) return '🚗';
    return '🚚';
  }

  return (
    <div id="driver-dashboard-panel">
      <div className="driver-dashboard-welcome">
        <h3 id="driver-dash-name">Bonjour, {driverData.name.split(' ')[0]} !</h3>
        <p id="driver-dash-vehicle">{getVehicleEmoji(driverData.vehicle)} {driverData.vehicle}</p>
      </div>

      <div className="driver-status-card">
        <div className="driver-status-row">
          <span className="form-label" style={{ marginBottom: 0 }}>Statut de votre compte :</span>
          <span className="rider-status" id="driver-dash-status">{statusBadgeText}</span>
        </div>
        <div className="driver-status-row">
          <span className="form-label" style={{ marginBottom: 0 }}>Visibilité sur la carte :</span>
          <span id="driver-dash-visibility" style={{ color: visibilityColor, fontWeight: 700 }}>{visibilityText}</span>
        </div>
      </div>

      {/* Widget de mise à jour GPS en direct du livreur */}
      <div className="driver-status-card" style={{ marginTop: '15px', border: '1.5px solid var(--color-primary-green)', backgroundColor: 'var(--color-primary-green-light)', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-green-hover)' }}>📍 Position GPS en Direct</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: 'var(--color-charcoal-light)', lineHeight: 1.3 }}>Actualisez votre position pour que vos clients vous localisent en temps réel.</p>
          </div>
          <button type="button" className="btn btn-primary" id="btn-driver-update-location" style={{ width: 'auto', margin: 0, padding: '8px 12px', fontSize: '0.75rem', borderRadius: '10px', backgroundColor: 'var(--color-primary-green)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⚡ Actualiser
          </button>
        </div>
        <div id="driver-location-update-status" style={{ marginTop: '10px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-green-soft)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🟢</span>
          <span>Position active : Prête à être mise à jour...</span>
        </div>
      </div>

      <div className="driver-dashboard-stats">
        <div className="driver-stat-box">
          <div className="info-label">Mises en Relation</div>
          <div className="driver-stat-val" id="driver-dash-contacts">{contacts} / 4</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>offertes</div>
        </div>
        <div className="driver-stat-box">
          <div className="info-label">Clics Profil</div>
          <div className="driver-stat-val" id="driver-dash-views">{views}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>visites</div>
        </div>
        <div className="driver-stat-box">
          <div className="info-label">Temps restant</div>
          <div className="driver-stat-val" id="driver-dash-days">{remainingDays}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>avant facturation</div>
        </div>
      </div>
      
      {/* Notes et Avis */}
      <div className="driver-terms-info" style={{ marginTop: '15px' }}>
        <h4>⭐ Notes & Avis Clients</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-yellow)' }} id="driver-dash-rating-val">
            {(driverData.rating || 5).toFixed(1)}
          </span>
          <div>
            <div style={{ color: 'var(--color-primary-yellow)', fontSize: '0.85rem' }} id="driver-dash-stars">★★★★★</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-charcoal-muted)' }} id="driver-dash-reviews-count">Basé sur 0 avis</div>
          </div>
        </div>
        <div id="driver-reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic' }}>Aucun avis reçu pour le moment.</p>
        </div>
      </div>

      {/* Messagerie locale intégrée pour Livreur */}
      <div className="driver-terms-info" style={{ marginTop: '15px' }}>
        <h4>💬 Messages Clients (Messagerie Locale)</h4>
        <div id="driver-dash-chats-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic' }}>Aucun message reçu pour le moment.</p>
        </div>
      </div>
      


      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={handleLogout} 
          style={{ 
            width: '100%', padding: '14px', borderRadius: '16px', fontWeight: 'bold',
            background: 'var(--color-primary-red)', color: 'white', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
