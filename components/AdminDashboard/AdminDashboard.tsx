import React, { useState } from 'react';
import { useAdminStats } from '@/hooks/useAdminStats';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

type TabType = 'overview' | 'drivers' | 'clients' | 'chats' | 'pending';

export default function AdminDashboard({ isOpen, onClose, isAdmin }: AdminDashboardProps) {
  const { stats, loading, approveDriver, deleteDriver } = useAdminStats(isAdmin);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen || !isAdmin) return null;

  return (
    <div className="location-portal-overlay open" style={{ zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="location-portal-card" style={{ maxWidth: '1000px', width: '95%', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(35px) saturate(180%)', border: '1px solid rgba(255,255,255,0.6)' }}>
        
        {/* Header Admin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'var(--color-primary-brown)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Administration Centrale</h2>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Livraison Rapide - Ouagadougou & Bobo</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition-smooth)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retour
          </button>
        </div>

        {/* Layout avec Sidebar et Contenu */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Sidebar */}
          <div style={{ width: '220px', background: 'rgba(255,255,255,0.5)', borderRight: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', padding: '15px 10px', gap: '5px' }}>
            {[
              { id: 'overview', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>, label: 'Vue Globale' },
              { id: 'drivers', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>, label: 'Livreurs' },
              { id: 'pending', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>, label: 'Candidatures' },
              { id: 'chats', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>, label: 'Discussions' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', borderRadius: '12px', 
                  background: activeTab === tab.id ? 'white' : 'transparent', 
                  color: activeTab === tab.id ? 'var(--color-primary-brown)' : 'var(--color-charcoal)', 
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition-smooth)',
                  boxShadow: activeTab === tab.id ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
                {tab.label}
                {tab.id === 'pending' && (stats?.pendingDrivers?.length || 0) > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--color-primary-red)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {stats?.pendingDrivers?.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '25px', background: 'rgba(250,246,242,0.4)' }}>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-charcoal-muted)' }}>
                <h3>Chargement des données en cours...</h3>
              </div>
            ) : (
              <>
                {/* VUE GLOBALE */}
                {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Vue Globale de l'Activité</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Livreurs Inscrits</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary-green)', marginTop: '10px' }}>{stats?.totalDrivers || 0}</div>
                      </div>
                      
                      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Candidatures Attente</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary-red)', marginTop: '10px' }}>{stats?.pendingDrivers?.length || 0}</div>
                      </div>

                      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Déblocages (Gratuits)</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary-yellow)', marginTop: '10px' }}>{stats?.totalUnlocks || 0}</div>
                      </div>

                      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Messages Échangés</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary-brown)', marginTop: '10px' }}>{stats?.totalMessages || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DISCUSSIONS */}
                {activeTab === 'chats' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Discussions en direct</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                      {stats?.allChats?.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucun message échangé pour l'instant.</div>
                      ) : (
                        stats?.allChats?.map(chat => (
                          <div key={chat.id} style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: chat.sender === 'client' ? 'var(--color-primary-brown)' : 'var(--color-primary-green)' }}>
                                {chat.sender === 'client' ? 'Client' : 'Livreur'}
                              </strong>
                              <small style={{ color: 'var(--color-charcoal-muted)' }}>{new Date(chat.created_at).toLocaleString()}</small>
                            </div>
                            <div style={{ color: 'var(--color-charcoal)', background: 'var(--color-bg-warm)', padding: '10px', borderRadius: '8px' }}>
                              {chat.text}
                              {chat.image_url && <img src={chat.image_url} alt="PJ" style={{ height: '50px', marginLeft: '10px', borderRadius: '4px' }} />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* AUTRES SECTIONS SIMILAIRES POUR DRIVERS & PENDING (Simplifiées pour l'instant) */}
                {(activeTab === 'drivers' || activeTab === 'pending') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>{activeTab === 'drivers' ? 'Livreurs Inscrits' : 'Candidatures'}</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '20px' }}>
                      <p style={{ color: 'var(--color-charcoal-muted)' }}>Affichage de la liste des livreurs (Fonctionnalité en intégration détaillée via table dédiée).</p>
                      {activeTab === 'pending' && (stats?.pendingDrivers?.length || 0) === 0 && (
                        <p style={{ color: 'var(--color-primary-green)', fontWeight: 'bold' }}>Aucune candidature en attente.</p>
                      )}
                    </div>
                  </div>
                )}
                
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
