import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { createClient } from '@/utils/supabase/client';

interface DriverDashboardProps {
  driverData: any;
  onLogout: () => void;
  onSimulatePayment: () => void;
  onChatClient: (clientId: string, clientName: string) => void;
}

interface ChatConversation {
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
}

export default function DriverDashboard({ driverData, onLogout, onSimulatePayment, onChatClient }: DriverDashboardProps) {
  const { logout } = useSupabaseAuth();
  const supabase = createClient();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  
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
    if (v?.toLowerCase().includes('moto')) return <img src="/icons/moto.png" alt="Moto" width="20" height="20" style={{ objectFit: 'contain' }} />;
    if (v?.toLowerCase().includes('tricycle')) return <img src="/icons/tricycle.png" alt="Tricycle" width="20" height="20" style={{ objectFit: 'contain' }} />;
    if (v?.toLowerCase().includes('voiture')) return <img src="/icons/voiture.png" alt="Voiture" width="20" height="20" style={{ objectFit: 'contain' }} />;
    return <span style={{fontSize: '16px'}}>🚚</span>;
  }

  // Charger les conversations du livreur
  useEffect(() => {
    if (!driverData?.id) return;

    const loadConversations = async () => {
      setLoadingChats(true);
      try {
        // Récupérer tous les messages du livreur, ordonnés par date décroissante
        const { data: allMessages, error } = await supabase
          .from('chats_livraison')
          .select('client_id, text, time, created_at, sender')
          .eq('rider_id', driverData.id)
          .order('created_at', { ascending: false });

        if (error || !allMessages) {
          setLoadingChats(false);
          return;
        }

        // Regrouper par client_id, garder le dernier message
        const clientMap = new Map<string, { text: string; time: string; sender: string }>();
        for (const msg of allMessages) {
          if (!clientMap.has(msg.client_id)) {
            clientMap.set(msg.client_id, { text: msg.text || '📎 Fichier', time: msg.time, sender: msg.sender });
          }
        }

        if (clientMap.size === 0) {
          setConversations([]);
          setLoadingChats(false);
          return;
        }

        // Récupérer les noms des clients
        const clientIds = Array.from(clientMap.keys());
        const { data: clients } = await supabase
          .from('clients_livraison')
          .select('id, name')
          .in('id', clientIds);

        const convos: ChatConversation[] = clientIds.map(cid => {
          const lastMsg = clientMap.get(cid)!;
          const clientInfo = clients?.find(c => c.id === cid);
          return {
            clientId: cid,
            clientName: clientInfo?.name || 'Client',
            lastMessage: lastMsg.text,
            lastTime: lastMsg.time,
            unread: lastMsg.sender === 'client'
          };
        });

        setConversations(convos);
      } catch (e) {
        console.error("Erreur chargement conversations:", e);
      }
      setLoadingChats(false);
    };

    loadConversations();

    // S'abonner aux nouveaux messages en temps réel
    const channel = supabase
      .channel(`driver_chats_${driverData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats_livraison',
          filter: `rider_id=eq.${driverData.id}`,
        },
        () => {
          // Recharger les conversations quand un nouveau message arrive
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverData?.id, supabase]);

  return (
    <div id="driver-dashboard-panel">
      <div className="driver-dashboard-welcome">
        <h3 id="driver-dash-name">Bonjour, {driverData.name.split(' ')[0]} !</h3>
        <p id="driver-dash-vehicle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{getVehicleEmoji(driverData.vehicle)} {driverData.vehicle}</p>
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

      {/* Messagerie interactive pour Livreur */}
      <div className="driver-terms-info" style={{ marginTop: '15px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          Messages Clients
        </h4>
        <div id="driver-dash-chats-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {loadingChats ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic' }}>Chargement des discussions...</p>
          ) : conversations.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic' }}>Aucun message reçu pour le moment.</p>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.clientId}
                type="button"
                onClick={() => onChatClient(convo.clientId, convo.clientName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: convo.unread ? 'rgba(39, 174, 96, 0.08)' : 'rgba(0,0,0,0.03)',
                  border: convo.unread ? '1.5px solid rgba(39, 174, 96, 0.3)' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-brown)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  flexShrink: 0
                }}>
                  {convo.clientName.charAt(0).toUpperCase()}
                </div>
                {/* Texte */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: convo.unread ? 800 : 600, fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>
                      {convo.clientName}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-charcoal-muted)', flexShrink: 0 }}>
                      {convo.lastTime}
                    </span>
                  </div>
                  <p style={{
                    margin: '2px 0 0 0',
                    fontSize: '0.78rem',
                    color: convo.unread ? 'var(--color-charcoal)' : 'var(--color-charcoal-muted)',
                    fontWeight: convo.unread ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {convo.lastMessage}
                  </p>
                </div>
                {/* Indicateur nouveau message */}
                {convo.unread && (
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-green)',
                    flexShrink: 0,
                    boxShadow: '0 0 6px rgba(39, 174, 96, 0.5)'
                  }} />
                )}
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* Option de paiement d'abonnement */}
      <div className="driver-terms-info" id="driver-dash-sub-box" style={{ marginTop: '15px' }}>
        <h4>ℹ️ Suivi de votre abonnement</h4>
        <p id="driver-dash-sub-text" style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-light)', lineHeight: 1.4, marginBottom: 0 }}>
          {subTextHTML}
        </p>
        {showPayBtn && (
          <button className="btn-unlock" id="btn-driver-pay-sub" style={{ width: '100%', marginTop: '12px', padding: '10px', fontSize: '0.9rem' }}>
            Régler mon abonnement (500 FCFA)
          </button>
        )}
        <button className="btn btn-secondary" id="btn-driver-simulate-contact" onClick={onSimulatePayment} style={{ width: '100%', marginTop: '10px', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '8px' }}>
          ⚡ Simuler 2 nouveaux contacts clients
        </button>
      </div>

      <button className="btn btn-secondary" id="btn-driver-logout" onClick={handleLogout} style={{ width: '100%', padding: '12px', borderRadius: '16px', marginTop: '15px' }}>
        Se déconnecter
      </button>
    </div>
  );
}

