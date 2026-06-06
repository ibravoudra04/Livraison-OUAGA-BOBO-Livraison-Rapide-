import React, { useState } from 'react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

type TabType = 'overview' | 'drivers' | 'clients' | 'chats' | 'pending' | 'subscriptions' | 'stats' | 'settings';

export default function AdminDashboard({ isOpen, onClose, isAdmin }: AdminDashboardProps) {
  const { stats, loading, approveDriver, suspendDriver, deleteDriver } = useAdminStats(isAdmin);
  const { logout } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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
                        <p>0 client(s)</p>
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
                        <p>0 actif(s)</p>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>{activeTab === 'drivers' ? 'Gestion des Livreurs Inscrits' : 'Candidatures en Attente'}</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-warm)', textAlign: 'left', color: 'var(--color-charcoal-muted)' }}>
                            <th style={{ padding: '12px 15px' }}>Nom</th>
                            <th style={{ padding: '12px 15px' }}>Contact</th>
                            <th style={{ padding: '12px 15px' }}>Véhicule</th>
                            <th style={{ padding: '12px 15px' }}>Localisation</th>
                            <th style={{ padding: '12px 15px' }}>Photos</th>
                            <th style={{ padding: '12px 15px' }}>Statut</th>
                            <th style={{ padding: '12px 15px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeTab === 'drivers' ? stats?.allDrivers : stats?.pendingDrivers)?.map(driver => (
                            <tr key={driver.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{driver.first_name || driver.name}</td>
                              <td style={{ padding: '12px 15px' }}>{driver.phone}</td>
                              <td style={{ padding: '12px 15px' }}>{driver.transport_type || driver.vehicle}</td>
                              <td style={{ padding: '12px 15px', fontSize: '0.85rem' }}>
                                <span style={{ textTransform: 'capitalize' }}>{driver.city || 'Ouaga'}</span><br/>
                                <span style={{ color: 'var(--color-charcoal-muted)' }}>{driver.lat?.toFixed(4)}, {driver.lng?.toFixed(4)}</span>
                              </td>
                              <td style={{ padding: '12px 15px' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {driver.cni_recto && <a href={driver.cni_recto} target="_blank" rel="noreferrer" style={{ color: '#2980b9', textDecoration: 'underline', fontSize: '0.85rem' }}>CNI Recto</a>}
                                  {driver.cni_verso && <a href={driver.cni_verso} target="_blank" rel="noreferrer" style={{ color: '#2980b9', textDecoration: 'underline', fontSize: '0.85rem' }}>CNI Verso</a>}
                                  {driver.selfie && <a href={driver.selfie} target="_blank" rel="noreferrer" style={{ color: '#2980b9', textDecoration: 'underline', fontSize: '0.85rem' }}>Selfie</a>}
                                  {!driver.cni_recto && !driver.cni_verso && !driver.selfie && <span style={{ color: 'var(--color-charcoal-muted)', fontSize: '0.8rem' }}>Aucune</span>}
                                </div>
                              </td>
                              <td style={{ padding: '12px 15px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', background: driver.status === 'approved' || driver.status === 'actif' ? '#e6f4ea' : driver.status === 'suspendu' ? '#fdf6e3' : '#fce8e6', color: driver.status === 'approved' || driver.status === 'actif' ? '#1e8e3e' : driver.status === 'suspendu' ? '#b58900' : '#d93025' }}>
                                  {driver.status === 'approved' || driver.status === 'actif' ? 'Actif' : driver.status === 'suspendu' ? 'Suspendu' : 'En attente'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 15px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                                {(driver.status === 'pending' || driver.status === 'suspendu') && (
                                  <button onClick={() => approveDriver(driver.id)} style={{ background: 'var(--color-primary-green)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>{driver.status === 'suspendu' ? 'Réactiver' : 'Valider'}</button>
                                )}
                                {(driver.status === 'approved' || driver.status === 'actif') && (
                                  <button onClick={() => { if(window.confirm('Suspendre ce livreur ?')) suspendDriver(driver.id); }} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Suspendre</button>
                                )}
                                <button onClick={() => { if(window.confirm('Supprimer définitivement ce livreur ?')) deleteDriver(driver.id); }} style={{ background: 'var(--color-primary-red)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Supprimer</button>
                              </td>
                            </tr>
                          ))}
                          {(activeTab === 'drivers' ? stats?.allDrivers : stats?.pendingDrivers)?.length === 0 && (
                            <tr>
                              <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucune donnée à afficher.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* OTHER TABS */}
                {['clients', 'subscriptions', 'stats', 'settings'].includes(activeTab) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '30px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>
                      Module en cours de développement...
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
