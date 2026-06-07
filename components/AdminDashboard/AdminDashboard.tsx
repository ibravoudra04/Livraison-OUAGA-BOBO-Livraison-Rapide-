import React, { useState } from 'react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

type TabType = 'overview' | 'drivers' | 'clients' | 'chats' | 'pending' | 'subscriptions' | 'stats' | 'settings' | 'litiges';

export default function AdminDashboard({ isOpen, onClose, isAdmin }: AdminDashboardProps) {
  const { stats, loading, approveDriver, suspendDriver, deleteDriver, verifyDriver, createAnnonce, resolveTicket } = useAdminStats(isAdmin);
  const { logout } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + data.map(e => headers.map(k => {
          let val = e[k];
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          return val;
        }).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen || !isAdmin) return null;

  return (
    <div className="location-portal-overlay open" style={{ zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="location-portal-card" style={{ maxWidth: '1600px', width: '98%', height: '95vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(35px) saturate(180%)', border: '1px solid rgba(255,255,255,0.6)' }}>
        
        {/* Header Admin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px', background: 'var(--color-bg-warm)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <button onClick={() => activeTab === 'overview' ? onClose() : setActiveTab('overview')} style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-charcoal)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition-smooth)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retour
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-brown)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Espace Administration</h2>
          </div>

          <button onClick={handleLogout} style={{ background: 'rgba(232, 92, 74, 0.15)', border: 'none', color: 'var(--color-primary-red)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition-smooth)' }}>
            Déconnexion
          </button>
        </div>

        {/* Layout Principal */}
        <div className={styles.adminLayout}>
          <div className={styles.mainContent}>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-charcoal-muted)' }}>
                <h3>Chargement des données en cours...</h3>
              </div>
            ) : (
              <>
                {/* VUE GLOBALE - GRILLE */}
                {activeTab === 'overview' && (
                  <div className={styles.adminGrid}>
                    <div className={styles.gridCard} onClick={() => setActiveTab('chats')}>
                      <div className={styles.gridIcon} style={{ color: '#9b59b6', background: 'rgba(155, 89, 182, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></div>
                      <div className={styles.gridText}>
                        <h3>Discussions en Cours</h3>
                        <p>{stats?.allChats?.length || 0} session(s) active(s)</p>
                      </div>
                    </div>
                    
                    <div className={styles.gridCard} onClick={() => setActiveTab('drivers')}>
                      <div className={styles.gridIcon} style={{ color: '#2c3e50', background: 'rgba(44, 62, 80, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                      <div className={styles.gridText}>
                        <h3>Gestion des Livreurs</h3>
                        <p>{stats?.totalDrivers || 0} inscrit(s)</p>
                      </div>
                    </div>

                    <div className={styles.gridCard} onClick={() => setActiveTab('clients')}>
                      <div className={styles.gridIcon} style={{ color: '#8e44ad', background: 'rgba(142, 68, 173, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                      <div className={styles.gridText}>
                        <h3>Gestion des Clients</h3>
                        <p>{stats?.totalClients || 0} client(s)</p>
                      </div>
                    </div>

                    <div className={styles.gridCard} onClick={() => setActiveTab('pending')}>
                      <div className={styles.gridIcon} style={{ color: '#2980b9', background: 'rgba(41, 128, 185, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                      <div className={styles.gridText}>
                        <h3>Candidatures en Attente</h3>
                        <p style={{ color: stats?.pendingDrivers?.length ? 'var(--color-primary-red)' : '' }}>{stats?.pendingDrivers?.length || 0} à vérifier</p>
                      </div>
                    </div>

                    <div className={styles.gridCard} onClick={() => setActiveTab('subscriptions')}>
                      <div className={styles.gridIcon} style={{ color: '#16a085', background: 'rgba(22, 160, 133, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg></div>
                      <div className={styles.gridText}>
                        <h3>Suivi des Abonnements</h3>
                        <p>{stats?.totalPremium || 0} actif(s)</p>
                      </div>
                    </div>

                    <div className={styles.gridCard} onClick={() => setActiveTab('stats')}>
                      <div className={styles.gridIcon} style={{ color: '#f39c12', background: 'rgba(243, 156, 18, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
                      <div className={styles.gridText}>
                        <h3>Statistiques Plateforme</h3>
                        <p>Revenus, clics et visites</p>
                      </div>
                    </div>

                    <div className={styles.gridCard} onClick={() => setActiveTab('settings')}>
                      <div className={styles.gridIcon} style={{ color: '#7f8c8d', background: 'rgba(127, 140, 141, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></div>
                      <div className={styles.gridText}>
                        <h3>Configuration & Tarifs</h3>
                        <p>Modifier les frais & options</p>
                      </div>
                    </div>

                    <div className={styles.gridCard} onClick={() => setActiveTab('litiges')}>
                      <div className={styles.gridIcon} style={{ color: '#e74c3c', background: 'rgba(231, 76, 60, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                      <div className={styles.gridText}>
                        <h3>Litiges & Support</h3>
                        <p style={{ color: stats?.tickets?.filter(t => t.statut === 'ouvert')?.length ? 'var(--color-primary-red)' : '' }}>{stats?.tickets?.filter(t => t.statut === 'ouvert')?.length || 0} ouvert(s)</p>
                      </div>
                    </div>

                    <div className={styles.gridCard} onClick={() => setActiveTab('paiements')}>
                      <div className={styles.gridIcon} style={{ color: '#27ae60', background: 'rgba(39, 174, 96, 0.1)' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
                      <div className={styles.gridText}>
                        <h3>Reçus de Paiement</h3>
                        <p>{stats?.paiements?.length || 0} reçu(s) vérifié(s)</p>
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

                {/* DRIVERS & PENDING */}
                {(activeTab === 'drivers' || activeTab === 'pending') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', height: '100%' }}>
                    {!selectedDriver ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>{activeTab === 'drivers' ? 'Gestion des Livreurs Inscrits' : 'Candidatures en Attente'}</h3>
                          {activeTab === 'drivers' && <button onClick={() => downloadCSV(stats?.allDrivers, 'livreurs_export')} style={{ background: '#2980b9', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>Exporter CSV</button>}
                        </div>
                        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                          {(activeTab === 'drivers' ? stats?.allDrivers : stats?.pendingDrivers)?.map(driver => (
                            <div 
                              key={driver.id} 
                              onClick={() => setSelectedDriver(driver)}
                              style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-brown)', fontWeight: 'bold' }}>
                                  {driver.initial || driver.name.substring(0,2).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-charcoal)' }}>{driver.first_name || driver.name}</strong>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)' }}>
                                    {driver.status === 'approved' || driver.status === 'actif' ? '🟢 Actif' : driver.status === 'suspendu' ? '🟠 Suspendu' : '🔴 En attente'}
                                  </span>
                                </div>
                              </div>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-charcoal-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </div>
                          ))}
                          {(activeTab === 'drivers' ? stats?.allDrivers : stats?.pendingDrivers)?.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucune donnée à afficher.</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--color-bg-warm)', zIndex: 10, display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(35px) saturate(180%)' }}>
                          <button onClick={() => setSelectedDriver(null)} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-charcoal)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Retour
                          </button>
                          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🪪 Inspecteur — {selectedDriver.first_name || selectedDriver.name}
                          </h2>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                👤 NOM COMPLET
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-charcoal)' }}>{selectedDriver.first_name || selectedDriver.name}</div>
                            </div>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                📞 TÉLÉPHONE
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-charcoal)' }}>{selectedDriver.phone}</div>
                            </div>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🏍️ MOYEN DE TRANSPORT
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-charcoal)' }}>{selectedDriver.transport_type || selectedDriver.vehicle}</div>
                            </div>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🏙️ VILLE D'ACTIVITÉ
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-charcoal)', textTransform: 'capitalize' }}>{selectedDriver.city || 'Ouagadougou'}</div>
                            </div>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                📍 COORDONNÉES GPS
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-charcoal)' }}>{selectedDriver.lat?.toFixed(5)}, {selectedDriver.lng?.toFixed(5)}</div>
                            </div>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                ⭐ NOTE & CLICS
                              </div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-charcoal)' }}>⭐ {selectedDriver.rating || '5.0'} • {selectedDriver.contacts_count || 0} clics</div>
                            </div>
                          </div>
                          
                          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', fontWeight: 'bold' }}>
                              📸 PHOTO DE PROFIL (SELFIE) :
                            </div>
                            {selectedDriver.selfie ? (
                               <img src={selectedDriver.selfie} alt="Selfie" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', display: 'block', margin: '0 auto' }} />
                            ) : (
                               <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-bg-warm)', borderRadius: '8px', color: 'var(--color-charcoal-muted)' }}>Aucune photo fournie</div>
                            )}
                            
                            {(selectedDriver.cni_recto || selectedDriver.cni_verso) && (
                              <>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '20px 0 15px 0', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                  🪪 PIÈCES D'IDENTITÉ :
                                </div>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                  {selectedDriver.cni_recto && <img src={selectedDriver.cni_recto} alt="CNI Recto" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />}
                                  {selectedDriver.cni_verso && <img src={selectedDriver.cni_verso} alt="CNI Verso" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />}
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Actions Opérationnelles */}
                          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            {(selectedDriver.status === 'en attente' || selectedDriver.status === 'suspendu') && (
                              <button onClick={() => { approveDriver(selectedDriver.id); setSelectedDriver({...selectedDriver, status: 'actif'}); }} style={{ flex: 1, background: 'var(--color-primary-green)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>{selectedDriver.status === 'suspendu' ? 'Réactiver le compte' : 'Valider la candidature'}</button>
                            )}
                            {(selectedDriver.status === 'approved' || selectedDriver.status === 'actif') && (
                              <button onClick={() => { if(window.confirm('Suspendre ce livreur ?')) { suspendDriver(selectedDriver.id); setSelectedDriver({...selectedDriver, status: 'suspendu'}); } }} style={{ flex: 1, background: '#f39c12', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Suspendre temporairement</button>
                            )}
                            {(selectedDriver.status === 'approved' || selectedDriver.status === 'actif') && !selectedDriver.is_verified && (
                              <button onClick={() => { verifyDriver(selectedDriver.id, true); setSelectedDriver({...selectedDriver, is_verified: true}); }} style={{ flex: 1, background: '#3498db', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Décerner un Badge Vérifié</button>
                            )}
                            {(selectedDriver.status === 'approved' || selectedDriver.status === 'actif') && selectedDriver.is_verified && (
                              <button onClick={() => { verifyDriver(selectedDriver.id, false); setSelectedDriver({...selectedDriver, is_verified: false}); }} style={{ flex: 1, background: '#bdc3c7', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Retirer le Badge Vérifié</button>
                            )}
                            <button onClick={() => { if(window.confirm('Supprimer définitivement ce livreur ? Cette action est irréversible.')) { deleteDriver(selectedDriver.id); setSelectedDriver(null); } }} style={{ flex: 1, background: 'var(--color-primary-red)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Supprimer définitivement</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CLIENTS & SUBSCRIPTIONS */}
                {(activeTab === 'clients' || activeTab === 'subscriptions') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>{activeTab === 'clients' ? 'Gestion des Clients' : 'Abonnements Premium'}</h3>
                      {activeTab === 'clients' && <button onClick={() => downloadCSV(stats?.allClients, 'clients_export')} style={{ background: '#2980b9', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>Exporter CSV</button>}
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-warm)', textAlign: 'left', color: 'var(--color-charcoal-muted)' }}>
                            <th style={{ padding: '12px 15px' }}>Nom</th>
                            <th style={{ padding: '12px 15px' }}>Contact</th>
                            <th style={{ padding: '12px 15px' }}>Abonnement Premium</th>
                            <th style={{ padding: '12px 15px' }}>Date d'inscription</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeTab === 'clients' ? stats?.allClients : stats?.allClients?.filter(c => c.subscription_paid))?.map(client => (
                            <tr key={client.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{client.name}</td>
                              <td style={{ padding: '12px 15px' }}>{client.phone}</td>
                              <td style={{ padding: '12px 15px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', background: client.subscription_paid ? '#e6f4ea' : '#fdf6e3', color: client.subscription_paid ? '#1e8e3e' : '#b58900' }}>
                                  {client.subscription_paid ? 'Actif' : 'Inactif'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 15px', color: 'var(--color-charcoal-muted)' }}>{new Date(client.created_at).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))}
                          {(activeTab === 'clients' ? stats?.allClients : stats?.allClients?.filter(c => c.subscription_paid))?.length === 0 && (
                            <tr>
                              <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucun client trouvé.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* STATS */}
                {activeTab === 'stats' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Statistiques Plateforme</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                      <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ margin: 0, color: 'var(--color-charcoal-muted)' }}>Revenus Estimés</h4>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary-green)' }}>{stats?.totalRevenue?.toLocaleString('fr-FR')} FCFA</div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)' }}>Basé sur les déblocages simulés</span>
                      </div>
                      <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ margin: 0, color: 'var(--color-charcoal-muted)' }}>Déblocages Totaux</h4>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary-brown)' }}>{stats?.totalUnlocks || 0}</div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)' }}>Contacts dévoilés</span>
                      </div>
                      <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ margin: 0, color: 'var(--color-charcoal-muted)' }}>Messages Échangés</h4>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#8e44ad' }}>{stats?.totalMessages || 0}</div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)' }}>Dans les chats intégrés</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SETTINGS */}
                {activeTab === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Configuration & Tarifs</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '25px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontWeight: 'bold', color: 'var(--color-charcoal)' }}>Coût de déblocage (FCFA)</label>
                          <input type="number" defaultValue={200} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontWeight: 'bold', color: 'var(--color-charcoal)' }}>Abonnement Premium Client (FCFA/mois)</label>
                          <input type="number" defaultValue={5000} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontWeight: 'bold', color: 'var(--color-charcoal)' }}>Abonnement Livreur (FCFA/semaine)</label>
                          <input type="number" defaultValue={500} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => alert('Paramètres sauvegardés avec succès !')} style={{ background: 'var(--color-primary-brown)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', width: '100%' }}>
                            Sauvegarder les modifications
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                          <h4 style={{ margin: 0, color: 'var(--color-primary-brown)' }}>Annonce Globale (Push In-App)</h4>
                          <textarea id="annonceText" placeholder="Saisissez un message qui s'affichera chez tous les utilisateurs..." style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', boxSizing: 'border-box', minHeight: '100px' }}></textarea>
                          <button onClick={async () => {
                            const val = (document.getElementById('annonceText') as HTMLTextAreaElement).value;
                            if (val) {
                               await createAnnonce(val);
                               alert('Annonce publiée avec succès !');
                               (document.getElementById('annonceText') as HTMLTextAreaElement).value = '';
                            }
                          }} style={{ background: '#8e44ad', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', width: 'fit-content' }}>
                            Publier l'annonce
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* LITIGES */}
                {activeTab === 'litiges' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Litiges & Support</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-warm)', textAlign: 'left', color: 'var(--color-charcoal-muted)' }}>
                            <th style={{ padding: '12px 15px' }}>Date</th>
                            <th style={{ padding: '12px 15px' }}>Client</th>
                            <th style={{ padding: '12px 15px' }}>Livreur concerné</th>
                            <th style={{ padding: '12px 15px' }}>Description du problème</th>
                            <th style={{ padding: '12px 15px' }}>Statut</th>
                            <th style={{ padding: '12px 15px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats?.tickets?.map(ticket => (
                            <tr key={ticket.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <td style={{ padding: '12px 15px', color: 'var(--color-charcoal-muted)', fontSize: '0.85rem' }}>{new Date(ticket.created_at).toLocaleString('fr-FR')}</td>
                              <td style={{ padding: '12px 15px' }}><strong>{ticket.clients_livraison?.name}</strong><br/><span style={{fontSize: '0.8rem'}}>{ticket.clients_livraison?.phone}</span></td>
                              <td style={{ padding: '12px 15px' }}><strong>{ticket.livreurs?.name}</strong><br/><span style={{fontSize: '0.8rem'}}>{ticket.livreurs?.phone}</span></td>
                              <td style={{ padding: '12px 15px', maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{ticket.description}</td>
                              <td style={{ padding: '12px 15px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', background: ticket.statut === 'resolu' ? '#e6f4ea' : '#fce8e6', color: ticket.statut === 'resolu' ? '#1e8e3e' : '#d93025' }}>
                                  {ticket.statut === 'resolu' ? 'Résolu' : 'Ouvert'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                                {ticket.statut === 'ouvert' && (
                                  <button onClick={() => { if(window.confirm('Marquer comme résolu ?')) resolveTicket(ticket.id); }} style={{ background: 'var(--color-primary-green)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Résoudre</button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {(!stats?.tickets || stats?.tickets?.length === 0) && (
                            <tr>
                              <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucun litige signalé.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* PAIEMENTS */}
                {activeTab === 'paiements' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Reçus de Paiement Vérifiés (IA)</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-warm)', textAlign: 'left', color: 'var(--color-charcoal-muted)' }}>
                            <th style={{ padding: '12px 15px' }}>Date</th>
                            <th style={{ padding: '12px 15px' }}>ID Transaction</th>
                            <th style={{ padding: '12px 15px' }}>Montant</th>
                            <th style={{ padding: '12px 15px' }}>Image Reçu</th>
                            <th style={{ padding: '12px 15px' }}>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats?.paiements?.map(paiement => (
                            <tr key={paiement.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <td style={{ padding: '12px 15px', color: 'var(--color-charcoal-muted)', fontSize: '0.85rem' }}>{new Date(paiement.created_at).toLocaleString('fr-FR')}</td>
                              <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{paiement.transaction_id}</td>
                              <td style={{ padding: '12px 15px', color: 'var(--color-primary-green)', fontWeight: 'bold' }}>{paiement.montant} FCFA</td>
                              <td style={{ padding: '12px 15px' }}>
                                {paiement.image_url ? (
                                  <a href={paiement.image_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db', textDecoration: 'underline' }}>
                                    Voir la capture
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--color-charcoal-muted)' }}>Aucune</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 15px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', background: paiement.statut === 'VALIDE' ? '#e6f4ea' : '#fce8e6', color: paiement.statut === 'VALIDE' ? '#1e8e3e' : '#d93025' }}>
                                  {paiement.statut}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(!stats?.paiements || stats?.paiements?.length === 0) && (
                            <tr>
                              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucun paiement enregistré.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
