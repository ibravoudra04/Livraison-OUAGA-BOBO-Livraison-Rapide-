import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { createClient } from '@/utils/supabase/client';

interface ClientDashboardProps {
  clientData: any;
  onLogout: () => void;
  onSimulatePremium: () => void;
  onSearch: () => void;
  onChatRider: (riderId: string, riderName: string) => void;
}

export default function ClientDashboard({ clientData, onLogout, onSimulatePremium, onSearch, onChatRider }: ClientDashboardProps) {
  const { logout, user } = useSupabaseAuth();
  const supabase = createClient();
  
  const [consultedRiders, setConsultedRiders] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  
  // Safe fallback if clientData is somehow missing
  const safeClientData = clientData || {};
  const isPremium = safeClientData.subscription_paid;

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      // Fetch Consulted Riders (from deblocages)
      const { data: deblocs } = await supabase
        .from('deblocages')
        .select('rider_id, livreurs(name, first_name, vehicle, transport_type)')
        .eq('client_id', user.id);

      if (deblocs) {
        const uniqueConsulted = Array.from(new Set(deblocs.map(d => d.rider_id))).map(id => {
          return deblocs.find(d => d.rider_id === id)?.livreurs;
        });
        setConsultedRiders(uniqueConsulted.filter(Boolean));
      }

      // Fetch Recent Chats
      const { data: chats } = await supabase
        .from('chats_livraison')
        .select('rider_id, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (chats) {
        // Group by rider_id to get distinct recent chats
        const distinctRiderIds = Array.from(new Set(chats.map(c => c.rider_id))).slice(0, 3);
        
        if (distinctRiderIds.length > 0) {
          const { data: riders } = await supabase
            .from('livreurs_view')
            .select('id, name, selfie')
            .in('id', distinctRiderIds);
          
          if (riders) {
            // Sort to match the order of recent chats
            const sortedRiders = distinctRiderIds.map(id => riders.find(r => r.id === id)).filter(Boolean);
            setRecentChats(sortedRiders);
          }
        }
      }
    };

    fetchDashboardData();
  }, [user, supabase]);

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
          <button type="button" onClick={onSearch} className="btn-unlock" id="btn-client-premium-search" style={{ width: '100%', padding: '12px', fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, var(--color-primary-green), var(--color-primary-green-hover))', boxShadow: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'white' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Lancer la recherche automatique
          </button>
        </div>
      )}

      {!isPremium && (
        <div id="client-premium-upgrade-box" style={{ marginBottom: '15px', background: 'rgba(246, 205, 86, 0.15)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(246, 205, 86, 0.4)' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            👑 Devenir Premium
          </h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.4 }}>
            Naviguez sur la carte en accès illimité. Plus besoin de payer 500F à chaque recherche !
          </p>
          <button type="button" onClick={onSimulatePremium} style={{ width: '100%', padding: '10px', fontSize: '0.9rem', borderRadius: '10px', fontWeight: 700, background: 'var(--color-primary-yellow)', color: 'var(--color-primary-brown)', border: 'none', boxShadow: '0 4px 10px rgba(246, 205, 86, 0.4)', cursor: 'pointer' }}>
            Passer Premium (5000 FCFA / mois)
          </button>
        </div>
      )}

      {/* Historique de Consultation */}
      <div className="driver-terms-info" style={{ marginTop: '15px', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', padding: '12px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary-brown)' }}><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          Livreurs Consultés
        </h4>
        <div id="client-viewed-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {consultedRiders.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Aucun livreur consulté pour le moment.</p>
          ) : (
            consultedRiders.map((r, i) => (
              <div key={i} style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{r.first_name || r.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-muted)' }}>({r.transport_type || r.vehicle || 'Moto'})</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Discussions Récentes (Chat) */}
      <div className="driver-terms-info" style={{ marginTop: '15px', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', padding: '12px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary-brown)' }}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          Discussions Récentes
        </h4>
        <div id="client-chat-list" style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
          {recentChats.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Aucune discussion récente.</p>
          ) : (
            recentChats.map((r, i) => (
              <div 
                key={i} 
                onClick={() => onChatRider(r.id, r.first_name || r.name)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--color-primary-brown)', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                  {r.selfie ? (
                    <img src={r.selfie} alt={r.first_name || r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (r.first_name || r.name || 'L').charAt(0).toUpperCase()
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-charcoal)', fontWeight: 'bold', maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.first_name || r.name}
                </span>
              </div>
            ))
          )}
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
