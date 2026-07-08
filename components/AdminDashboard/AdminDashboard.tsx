import React, { useState, useEffect } from 'react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

type TabType = 'overview' | 'drivers' | 'clients' | 'chats' | 'pending' | 'stats' | 'settings' | 'litiges' | 'avis' | 'analytics' | 'sante' | 'creer';

// Formatte une date de dernière connexion en texte court et lisible.
const formatLastSeen = (iso: string | null | undefined): string => {
  if (!iso) return 'Jamais connecté';
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 30) return `Il y a ${days} jours`;
  return d.toLocaleDateString('fr-FR');
};

export default function AdminDashboard({ isOpen, onClose, isAdmin }: AdminDashboardProps) {
  const { stats, loading, approveDriver, suspendDriver, deleteDriver, verifyDriver, toggleClientPremium, deleteClient, createAnnonce, deactivateAnnonce, resolveTicket, reopenTicket, deleteTicket, deleteAvis, applyDriverPatch, addDriverLocal } = useAdminStats(isAdmin);
  const { logout, supabase } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);
  const [searchDrivers, setSearchDrivers] = useState('');
  const [searchClients, setSearchClients] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'today' | '7days' | 'all'>('all');
  const [ticketFilter, setTicketFilter] = useState<'tous' | 'ouvert' | 'resolu'>('tous');

  // Nouveaux états : édition de fiche, création de livreur, santé de la base, réglages
  const [busy, setBusy] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; phone: string; vehicle: string; city: string } | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', pin: '', vehicle: 'Moto', city: 'ouaga', activate: true });
  const [createFiles, setCreateFiles] = useState<{ selfie?: File; cniRecto?: File; cniVerso?: File }>({});
  const [health, setHealth] = useState<{ ghosts: any[]; orphanPayments: any[]; lastSignIn: Record<string, string | null> }>({ ghosts: [], orphanPayments: [], lastSignIn: {} });
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [settingsForm, setSettingsForm] = useState<{ support_whatsapp: string; support_phone: string; welcome_text: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Charge le bilan de santé (comptes fantômes, paiements orphelins, dernières connexions)
  const loadHealth = React.useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/admin/health');
      const data = await res.json();
      if (data.success) setHealth({ ghosts: data.ghosts || [], orphanPayments: data.orphanPayments || [], lastSignIn: data.lastSignIn || {} });
    } catch { /* ignore */ }
    setLoadingHealth(false);
  }, []);

  // Charge la santé une fois à l'ouverture (pour disposer des dernières connexions)
  useEffect(() => {
    if (isOpen && isAdmin) loadHealth();
  }, [isOpen, isAdmin, loadHealth]);

  // Charge les réglages actuels quand on ouvre l'onglet Configuration
  useEffect(() => {
    if (activeTab === 'settings' && settingsForm === null) {
      (async () => {
        const defaults = { support_whatsapp: '22667370909', support_phone: '+22667370909', welcome_text: 'Visualisez les livreurs actifs autour de vous sur la carte en temps réel et contactez-les en un clic.' };
        try {
          const { data } = await supabase.from('parametres_app').select('key, value');
          const merged = { ...defaults };
          for (const row of data || []) if (row.key in merged && row.value) (merged as any)[row.key] = row.value;
          setSettingsForm(merged);
        } catch {
          setSettingsForm(defaults);
        }
      })();
    }
  }, [activeTab, settingsForm, supabase]);

  // ===== Actions serveur (routes /api/admin/*) =====
  const resetPin = async (userId: string, label: string) => {
    if (!window.confirm(`Réinitialiser le code PIN de ${label} ?\nUn nouveau code à 4 chiffres sera généré à lui communiquer.`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/reset-pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (data.success) alert(`✅ Nouveau code PIN de ${label} :\n\n        ${data.pin}\n\nCommuniquez-le à la personne. Elle pourra le changer plus tard.`);
      else alert('❌ ' + (data.error || 'Échec'));
    } catch { alert('❌ Erreur de connexion.'); }
    setBusy(false);
  };

  const notifyUser = async (userId: string, label: string) => {
    const message = window.prompt(`Message de notification à envoyer à ${label} :`);
    if (!message || !message.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId: userId, title: 'Message de l\'administration', message: message.trim() }) });
      const data = await res.json();
      if (data.success) alert(data.sent > 0 ? `✅ Notification envoyée (${data.sent} appareil).` : "⚠️ Cette personne n'a pas activé les notifications sur son téléphone.");
      else alert('❌ ' + (data.error || 'Échec'));
    } catch { alert('❌ Erreur de connexion.'); }
    setBusy(false);
  };

  const saveDriverEdit = async () => {
    if (!editForm || !selectedDriver) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/update-driver', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedDriver.id, ...editForm }) });
      const data = await res.json();
      if (data.success) {
        applyDriverPatch(selectedDriver.id, data.driver);
        setSelectedDriver({ ...selectedDriver, ...data.driver });
        setEditForm(null);
        alert('✅ Fiche mise à jour.');
      } else alert('❌ ' + (data.error || 'Échec'));
    } catch { alert('❌ Erreur de connexion.'); }
    setBusy(false);
  };

  const submitCreateDriver = async () => {
    if (!createForm.name.trim() || createForm.phone.replace(/\D/g, '').length < 8 || createForm.pin.length < 4) {
      alert('Veuillez renseigner le nom, un numéro à 8 chiffres et un PIN d\'au moins 4 chiffres.');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', createForm.name);
      fd.append('phone', createForm.phone);
      fd.append('pin', createForm.pin);
      fd.append('vehicle', createForm.vehicle);
      fd.append('city', createForm.city);
      fd.append('activate', createForm.activate ? '1' : '0');
      if (createFiles.selfie) fd.append('selfie', createFiles.selfie);
      if (createFiles.cniRecto) fd.append('cniRecto', createFiles.cniRecto);
      if (createFiles.cniVerso) fd.append('cniVerso', createFiles.cniVerso);
      const res = await fetch('/api/admin/create-driver', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        addDriverLocal(data.driver);
        alert(`✅ Livreur "${createForm.name}" créé.\nCode PIN : ${createForm.pin}`);
        setCreateForm({ name: '', phone: '', pin: '', vehicle: 'Moto', city: 'ouaga', activate: true });
        setCreateFiles({});
        setActiveTab('drivers');
      } else alert('❌ ' + (data.error || 'Échec'));
    } catch { alert('❌ Erreur de connexion.'); }
    setBusy(false);
  };

  const cleanupItem = async (type: 'ghost' | 'orphan_payment', id: string, label: string) => {
    if (!window.confirm(`Supprimer définitivement ${label} ?`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id }) });
      const data = await res.json();
      if (data.success) {
        setHealth(prev => ({ ...prev, ghosts: prev.ghosts.filter(g => g.id !== id), orphanPayments: prev.orphanPayments.filter(p => p.id !== id) }));
      } else alert('❌ ' + (data.error || 'Échec'));
    } catch { alert('❌ Erreur de connexion.'); }
    setBusy(false);
  };

  const saveSettings = async () => {
    if (!settingsForm) return;
    setSavingSettings(true);
    try {
      const rows = Object.entries(settingsForm).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
      const { error } = await supabase.from('parametres_app').upsert(rows, { onConflict: 'key' });
      if (error) alert('❌ ' + (error.message.includes('does not exist') || error.code === '42P01' ? 'La table des réglages n\'existe pas encore. Exécutez le script AJOUT_PARAMETRES_APP.sql dans Supabase.' : error.message));
      else alert('✅ Réglages enregistrés. Ils s\'appliquent au prochain chargement de l\'app.');
    } catch { alert('❌ Erreur de connexion.'); }
    setSavingSettings(false);
  };

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

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: broadcastTitle.trim(), message: broadcastMessage.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Notification envoyée à ${data.sent} appareil(s) !`);
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        alert('Erreur lors de l\'envoi : ' + (data.error || 'Inconnu'));
      }
    } catch {
      alert('Erreur de connexion au serveur.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (!isOpen || !isAdmin) return null;

  const filteredDrivers = stats.allDrivers.filter(d =>
    !searchDrivers || `${d.first_name || ''} ${d.name || ''} ${d.phone || ''}`.toLowerCase().includes(searchDrivers.toLowerCase())
  );
  const filteredClients = stats.allClients.filter(c =>
    !searchClients || `${c.name || ''} ${c.phone || ''}`.toLowerCase().includes(searchClients.toLowerCase())
  );

  return (
    <div className="location-portal-overlay open" style={{ zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="location-portal-card" style={{ maxWidth: '1600px', width: '98%', height: '95vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)' }}>

        {/* Header Admin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 24px', background: 'var(--color-bg-warm)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <button onClick={() => activeTab === 'overview' ? onClose() : setActiveTab('overview')} style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-charcoal)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-brown)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Espace Administration</h2>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(232, 92, 74, 0.15)', border: 'none', color: 'var(--color-primary-red)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                {/* VUE GLOBALE */}
                {activeTab === 'overview' && (
                  <div className={styles.adminGrid}>
                    {[
                      { tab: 'chats', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>, color: '#9b59b6', label: 'Discussions en Cours', sub: `${stats.allChats?.length || 0} session(s)` },
                      { tab: 'drivers', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, color: '#2c3e50', label: 'Gestion des Livreurs', sub: `${stats.totalDrivers || 0} inscrit(s)` },
                      { tab: 'clients', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>, color: '#8e44ad', label: 'Gestion des Clients', sub: `${stats.totalClients || 0} client(s)` },
                      { tab: 'pending', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>, color: '#2980b9', label: 'Candidatures en Attente', sub: `${stats.pendingDrivers?.length || 0} à vérifier`, alert: (stats.pendingDrivers?.length || 0) > 0 },
                      { tab: 'analytics', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>, color: '#e67e22', label: 'Analytiques Journalières', sub: 'Activité 14 derniers jours' },
                      { tab: 'stats', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>, color: '#f39c12', label: 'Statistiques Plateforme', sub: 'Clics et visites' },
                      { tab: 'litiges', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>, color: '#e74c3c', label: 'Litiges & Support', sub: `${stats.tickets?.filter(t => t.statut === 'ouvert')?.length || 0} ouvert(s)`, alert: (stats.tickets?.filter(t => t.statut === 'ouvert')?.length || 0) > 0 },
                      { tab: 'avis', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>, color: '#d4a017', label: 'Gestion des Avis', sub: `${stats.allAvis?.length || 0} avis publié(s)` },
                      { tab: 'creer', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>, color: '#16a085', label: 'Inscrire un Livreur', sub: 'Créer un compte à sa place' },
                      { tab: 'sante', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>, color: '#c0392b', label: 'Santé de la Base', sub: `${health.ghosts.length} fantôme(s) · ${health.orphanPayments.length} paiement(s) orphelin(s)`, alert: (health.ghosts.length + health.orphanPayments.length) > 0 },
                      { tab: 'settings', icon: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>, color: '#7f8c8d', label: 'Configuration & Messages', sub: 'Annonces, push' },
                    ].map(({ tab, icon, color, label, sub, alert }) => (
                      <div key={tab} className={styles.gridCard} onClick={() => setActiveTab(tab as TabType)}>
                        <div className={styles.gridIcon} style={{ color, background: `${color}1A` }}>{icon}</div>
                        <div className={styles.gridText}>
                          <h3>{label}</h3>
                          <p style={{ color: alert ? 'var(--color-primary-red)' : undefined }}>{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* DISCUSSIONS */}
                {activeTab === 'chats' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Discussions en direct</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                      {stats.allChats?.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucun message échangé pour l'instant.</div>
                      ) : (
                        stats.allChats?.map(chat => (
                          <div key={chat.id} style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: chat.sender === 'client' ? 'var(--color-primary-brown)' : 'var(--color-primary-green)' }}>
                                {chat.sender === 'client' ? `Client : ${chat.clients_livraison?.name || '—'}` : `Livreur : ${chat.livreurs?.name || '—'}`}
                              </strong>
                              <small style={{ color: 'var(--color-charcoal-muted)' }}>{new Date(chat.created_at).toLocaleString('fr-FR')}</small>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>{activeTab === 'drivers' ? 'Gestion des Livreurs Inscrits' : 'Candidatures en Attente'}</h3>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="Rechercher livreur..."
                              value={searchDrivers}
                              onChange={e => setSearchDrivers(e.target.value)}
                              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none', minWidth: '200px' }}
                            />
                            {activeTab === 'drivers' && (
                              <button onClick={() => downloadCSV(stats.allDrivers, 'livreurs_export')} style={{ background: '#2980b9', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Exporter CSV</button>
                            )}
                          </div>
                        </div>
                        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                          {(activeTab === 'drivers' ? filteredDrivers : stats.pendingDrivers.filter(d => !searchDrivers || `${d.first_name || ''} ${d.name || ''} ${d.phone || ''}`.toLowerCase().includes(searchDrivers.toLowerCase())))?.map(driver => (
                            <div
                              key={driver.id}
                              onClick={() => setSelectedDriver(driver)}
                              style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-brown)', fontWeight: 'bold', overflow: 'hidden' }}>
                                  {driver.selfie ? <img src={driver.selfie} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (driver.initial || driver.name?.substring(0, 2).toUpperCase())}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <strong style={{ fontSize: '1rem', color: 'var(--color-charcoal)' }}>{driver.first_name || driver.name}</strong>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)' }}>
                                    {driver.status === 'approved' || driver.status === 'actif' ? '🟢 Actif' : driver.status === 'en pause' ? '⏸️ En pause' : driver.status === 'suspendu' ? '🟠 Suspendu' : '🔴 En attente'} • {driver.city === 'ouaga' ? 'Ouagadougou' : 'Bobo-Dioulasso'} • {driver.phone} • Inscrit le {new Date(driver.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-charcoal-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </div>
                          ))}
                          {filteredDrivers.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucun résultat.</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--color-bg-warm)', zIndex: 10, display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(16px)' }}>
                          <button onClick={() => setSelectedDriver(null)} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-charcoal)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Retour
                          </button>
                          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-brown)' }}>🪪 Inspecteur — {selectedDriver.first_name || selectedDriver.name}</h2>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            {[
                              { label: '👤 NOM COMPLET', val: selectedDriver.first_name || selectedDriver.name },
                              { label: '📞 TÉLÉPHONE', val: selectedDriver.phone },
                              { label: '🏍️ TRANSPORT', val: selectedDriver.transport_type || selectedDriver.vehicle },
                              { label: '🏙️ VILLE', val: selectedDriver.city === 'ouaga' ? 'Ouagadougou' : 'Bobo-Dioulasso' },
                              { label: '📍 GPS', val: `${selectedDriver.lat?.toFixed(5)}, ${selectedDriver.lng?.toFixed(5)}` },
                              { label: '⭐ NOTE & CLICS', val: `⭐ ${selectedDriver.rating || '5.0'} • ${selectedDriver.contacts_count || 0} clics` },
                              { label: '👁️ VUES PROFIL', val: `${selectedDriver.views_count || 0} visites` },
                              { label: '📅 INSCRIPTION', val: new Date(selectedDriver.created_at).toLocaleDateString('fr-FR') },
                              { label: '🕐 DERNIÈRE CONNEXION', val: formatLastSeen(health.lastSignIn[selectedDriver.id]) },
                            ].map(({ label, val }) => (
                              <div key={label} style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-charcoal)' }}>{val}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', fontWeight: 'bold' }}>📸 PHOTO DE PROFIL :</div>
                            {selectedDriver.selfie ? (
                              <img src={selectedDriver.selfie} alt="Selfie" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', display: 'block', margin: '0 auto' }} />
                            ) : (
                              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--color-bg-warm)', borderRadius: '8px', color: 'var(--color-charcoal-muted)' }}>Aucune photo fournie</div>
                            )}
                            {(selectedDriver.cni_recto || selectedDriver.cni_verso) && (
                              <>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '20px 0 15px 0', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '20px' }}>🪪 PIÈCES D'IDENTITÉ :</div>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                  {selectedDriver.cni_recto && <img src={selectedDriver.cni_recto} alt="CNI Recto" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />}
                                  {selectedDriver.cni_verso && <img src={selectedDriver.cni_verso} alt="CNI Verso" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />}
                                </div>
                              </>
                            )}
                          </div>
                          {/* Gestion du compte : modifier la fiche, réinitialiser le PIN, notifier */}
                          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', fontWeight: 'bold' }}>🛠️ GESTION DU COMPTE :</div>
                            {!editForm ? (
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button onClick={() => setEditForm({ name: selectedDriver.name || '', phone: (selectedDriver.phone || '').replace(/\D/g, '').replace(/^226/, ''), vehicle: selectedDriver.vehicle || 'Moto', city: selectedDriver.city || 'ouaga' })} disabled={busy} style={{ flex: 1, minWidth: '150px', background: 'var(--color-primary-brown)', color: 'white', border: 'none', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  Modifier la fiche
                                </button>
                                <button onClick={() => resetPin(selectedDriver.id, selectedDriver.name)} disabled={busy} style={{ flex: 1, minWidth: '150px', background: '#e67e22', color: 'white', border: 'none', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                  Réinitialiser le PIN
                                </button>
                                <button onClick={() => notifyUser(selectedDriver.id, selectedDriver.name)} disabled={busy} style={{ flex: 1, minWidth: '150px', background: '#8e44ad', color: 'white', border: 'none', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                  Envoyer une notification
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Nom complet
                                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                                  </label>
                                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Téléphone (8 chiffres)
                                    <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="70 00 00 00" style={{ display: 'block', width: '100%', marginTop: '5px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                                  </label>
                                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Transport
                                    <select value={editForm.vehicle} onChange={e => setEditForm({ ...editForm, vehicle: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                                      <option>Moto</option><option>Tricycle</option><option>Voiture</option>
                                    </select>
                                  </label>
                                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Ville
                                    <select value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                                      <option value="ouaga">Ouagadougou</option><option value="bobo">Bobo-Dioulasso</option>
                                    </select>
                                  </label>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button onClick={() => setEditForm(null)} disabled={busy} style={{ flex: 1, background: 'transparent', border: '1px solid var(--color-charcoal-muted)', color: 'var(--color-charcoal)', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Annuler</button>
                                  <button onClick={saveDriverEdit} disabled={busy} style={{ flex: 1, background: 'var(--color-primary-green)', border: 'none', color: 'white', padding: '11px', borderRadius: '10px', cursor: busy ? 'wait' : 'pointer', fontWeight: 'bold' }}>{busy ? 'Enregistrement...' : 'Enregistrer'}</button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            {(selectedDriver.status === 'en attente' || selectedDriver.status === 'suspendu') && (
                              <button onClick={() => { approveDriver(selectedDriver.id); setSelectedDriver({ ...selectedDriver, status: 'actif' }); }} style={{ flex: 1, background: 'var(--color-primary-green)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', minWidth: '160px' }}>{selectedDriver.status === 'suspendu' ? 'Réactiver le compte' : 'Valider la candidature'}</button>
                            )}
                            {(selectedDriver.status === 'approved' || selectedDriver.status === 'actif' || selectedDriver.status === 'en pause') && (
                              <button onClick={() => { if (window.confirm('Suspendre ce livreur ?')) { suspendDriver(selectedDriver.id); setSelectedDriver({ ...selectedDriver, status: 'suspendu' }); } }} style={{ flex: 1, background: '#f39c12', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', minWidth: '160px' }}>Suspendre temporairement</button>
                            )}
                            {(selectedDriver.status === 'approved' || selectedDriver.status === 'actif' || selectedDriver.status === 'en pause') && !selectedDriver.is_verified && (
                              <button onClick={() => { verifyDriver(selectedDriver.id, true); setSelectedDriver({ ...selectedDriver, is_verified: true }); }} style={{ flex: 1, background: '#3498db', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', minWidth: '160px' }}>Décerner Badge Vérifié</button>
                            )}
                            {selectedDriver.is_verified && (
                              <button onClick={() => { verifyDriver(selectedDriver.id, false); setSelectedDriver({ ...selectedDriver, is_verified: false }); }} style={{ flex: 1, background: '#bdc3c7', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', minWidth: '160px' }}>Retirer Badge Vérifié</button>
                            )}
                            <button onClick={() => { if (window.confirm('Supprimer définitivement ce livreur ? Action irréversible.')) { deleteDriver(selectedDriver.id); setSelectedDriver(null); } }} style={{ flex: 1, background: 'var(--color-primary-red)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', minWidth: '160px' }}>Supprimer définitivement</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CLIENTS */}
                {(activeTab === 'clients') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Gestion des Clients</h3>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Rechercher client..."
                          value={searchClients}
                          onChange={e => setSearchClients(e.target.value)}
                          style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none', minWidth: '200px' }}
                        />
                        {activeTab === 'clients' && <button onClick={() => downloadCSV(stats.allClients, 'clients_export')} style={{ background: '#2980b9', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Exporter CSV</button>}
                      </div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-warm)', textAlign: 'left', color: 'var(--color-charcoal-muted)' }}>
                            <th style={{ padding: '12px 15px' }}>Nom</th>
                            <th style={{ padding: '12px 15px' }}>Téléphone</th>
                            <th style={{ padding: '12px 15px' }}>Date d'inscription</th>
                            <th style={{ padding: '12px 15px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(filteredClients)?.map(client => (
                            <tr key={client.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{client.name}</td>
                              <td style={{ padding: '12px 15px' }}>{client.phone}</td>
                              <td style={{ padding: '12px 15px', color: 'var(--color-charcoal-muted)' }}>{new Date(client.created_at).toLocaleDateString('fr-FR')}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => resetPin(client.id, client.name)}
                                    disabled={busy}
                                    title="Réinitialiser le code PIN"
                                    style={{ background: '#e67e22', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    PIN
                                  </button>
                                  <button
                                    onClick={() => notifyUser(client.id, client.name)}
                                    disabled={busy}
                                    title="Envoyer une notification"
                                    style={{ background: '#8e44ad', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                    Notifier
                                  </button>
                                  <button
                                    onClick={() => { if (window.confirm(`Supprimer le client ${client.name} ?`)) deleteClient(client.id); }}
                                    style={{ background: 'var(--color-primary-red)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredClients.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucun client trouvé.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ANALYTIQUES JOURNALIÈRES */}
                {activeTab === 'analytics' && (() => {
                  const allVals = stats.dailyStats.flatMap(d => [d.newDrivers, d.newClients, d.messages]);
                  const maxVal = Math.max(...allVals, 1);
                  const metrics = [
                    { key: 'newDrivers' as const, label: 'Livreurs', color: '#2c3e50' },
                    { key: 'newClients' as const, label: 'Clients', color: '#8e44ad' },
                    { key: 'messages' as const, label: 'Messages', color: '#27ae60' },
                  ];
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Analytiques — 14 derniers jours</h3>

                      {/* KPI Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                        {metrics.map(m => (
                          <div key={m.key} style={{ background: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderLeft: `4px solid ${m.color}` }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: m.color }}>{stats.dailyStats.reduce((a, d) => a + d[m.key], 0)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-muted)', marginTop: '4px' }}>{m.label} (14j)</div>
                          </div>
                        ))}
                      </div>

                      {/* Bar Chart */}
                      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>Activité quotidienne</h4>
                          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            {metrics.map(m => (
                              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--color-charcoal)' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: m.color }} />
                                {m.label}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '10px', alignItems: 'flex-end' }}>
                          {stats.dailyStats.map(day => (
                            <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '48px', flex: 1 }}>
                              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '140px', width: '100%', justifyContent: 'center' }}>
                                {metrics.map(m => (
                                  <div
                                    key={m.key}
                                    title={`${m.label}: ${day[m.key]}`}
                                    style={{
                                      flex: 1,
                                      height: day[m.key] > 0 ? `${Math.max((day[m.key] / maxVal) * 140, 4)}px` : '3px',
                                      background: day[m.key] > 0 ? m.color : 'rgba(0,0,0,0.07)',
                                      borderRadius: '3px 3px 0 0',
                                      transition: 'height 0.3s ease',
                                    }}
                                  />
                                ))}
                              </div>
                              <span style={{ fontSize: '0.58rem', color: 'var(--color-charcoal-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{day.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* City Breakdown */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {[
                          { city: 'Ouagadougou', drivers: stats.ouagaDrivers, color: '#e74c3c', emoji: '🏙️' },
                          { city: 'Bobo-Dioulasso', drivers: stats.boboDrivers, color: '#3498db', emoji: '🌆' },
                        ].map(c => (
                          <div key={c.city} style={{ background: 'white', borderRadius: '16px', padding: '22px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: `4px solid ${c.color}` }}>
                            <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-charcoal)', fontSize: '1rem' }}>{c.emoji} {c.city}</h4>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: c.color }}>{c.drivers}</span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)' }}>livreurs inscrits</span>
                            </div>
                            <div style={{ marginTop: '8px', height: '6px', borderRadius: '3px', background: '#f0f0f0', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${stats.totalDrivers > 0 ? (c.drivers / stats.totalDrivers) * 100 : 0}%`, background: c.color, borderRadius: '3px', transition: 'width 0.5s' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-muted)', marginTop: '4px' }}>
                              {stats.totalDrivers > 0 ? `${Math.round((c.drivers / stats.totalDrivers) * 100)}%` : '0%'} du total
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* STATS */}
                {activeTab === 'stats' && (() => {
                  // Filtre par période
                  const now = new Date();
                  const startOf = (period: typeof statsPeriod) => {
                    if (period === 'today') {
                      const d = new Date(now); d.setHours(0,0,0,0); return d;
                    }
                    if (period === '7days') {
                      const d = new Date(now); d.setDate(d.getDate() - 7); d.setHours(0,0,0,0); return d;
                    }
                    return new Date(0);
                  };
                  const since = startOf(statsPeriod);
                  const inPeriod = (dateStr: string) => dateStr ? new Date(dateStr) >= since : false;

                  const filteredDrivers  = stats.allDrivers.filter(d => inPeriod(d.created_at));
                  const filteredClients  = stats.allClients.filter(c => inPeriod(c.created_at));
                  const filteredChats    = stats.allChats.filter(c => inPeriod(c.created_at));
                  const filteredVisits   = (stats.allVisits || []).filter(v => inPeriod(v.created_at));

                  const totalProfileViews   = statsPeriod === 'all' ? stats.allDrivers.reduce((a, d) => a + (d.views_count || 0), 0) : '—';
                  const totalContactClicks  = statsPeriod === 'all' ? stats.allDrivers.reduce((a, d) => a + (d.contacts_count || 0), 0) : '—';
                  const incompleteRiders    = stats.allDrivers.filter(d => d.status === 'en attente' && (!d.selfie || !d.cni_recto || !d.cni_verso)).length;
                  const readyRiders         = stats.allDrivers.filter(d => d.status === 'en attente' && d.selfie && d.cni_recto && d.cni_verso).length;

                  const periodLabels = { today: "Aujourd'hui", '7days': '7 derniers jours', all: 'Tout' };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* En-tête + sélecteur de période */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Statistiques Plateforme</h3>
                        <div style={{ display: 'flex', background: 'white', borderRadius: '12px', padding: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', gap: '2px' }}>
                          {(['today', '7days', 'all'] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => setStatsPeriod(p)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '9px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: statsPeriod === p ? '700' : '500',
                                fontSize: '0.85rem',
                                background: statsPeriod === p ? 'var(--color-primary-brown)' : 'transparent',
                                color: statsPeriod === p ? 'white' : 'var(--color-charcoal-muted)',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {periodLabels[p]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cartes métriques */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        {[
                          { label: 'Nouveaux Livreurs', val: filteredDrivers.length.toString(), sub: 'Inscriptions sur la période', color: '#2c3e50' },
                          { label: 'Nouveaux Clients', val: filteredClients.length.toString(), sub: 'Inscriptions sur la période', color: '#8e44ad' },
                          { label: 'Messages Échangés', val: filteredChats.length.toString(), sub: 'Dans les messageries instantanées', color: '#7f8c8d' },
                          { label: 'Visites Plateforme', val: statsPeriod === 'all' ? (stats.allVisits?.length || 0).toString() : filteredVisits.length.toString(), sub: 'Visites uniques de l\'application', color: '#1abc9c' },
                          { label: 'Clics sur Profils', val: totalProfileViews.toString(), sub: 'Vues des fiches livreurs (total)', color: '#9b59b6' },
                          { label: 'Demandes de Contact', val: totalContactClicks.toString(), sub: 'Clics téléphone (total)', color: '#3498db' },
                          { label: 'Dossiers Incomplets', val: incompleteRiders.toString(), sub: 'Livreurs sans documents complets', color: '#e74c3c' },
                          { label: 'Dossiers Prêts à Valider', val: readyRiders.toString(), sub: 'En attente de validation admin', color: '#16a085' },
                        ].map(({ label, val, sub, color }) => (
                          <div key={label} style={{ background: 'white', borderRadius: '16px', padding: '22px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: `5px solid ${color}` }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-charcoal-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{label}</div>
                            <div style={{ fontSize: '1.9rem', fontWeight: '900', color }}>{val}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-charcoal-muted)' }}>{sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* SETTINGS */}
                {activeTab === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Configuration & Communication</h3>

                    {/* Paramètres de l'app (coordonnées support, texte d'accueil) */}
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '25px' }}>
                      <h4 style={{ margin: '0 0 16px 0', color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Paramètres de l'application
                      </h4>
                      {settingsForm === null ? (
                        <p style={{ color: 'var(--color-charcoal-muted)', fontSize: '0.9rem' }}>Chargement...</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Numéro WhatsApp support (format international sans +, ex : 22667370909)
                            <input value={settingsForm.support_whatsapp} onChange={e => setSettingsForm({ ...settingsForm, support_whatsapp: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                          </label>
                          <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Numéro de téléphone support (ex : +22667370909)
                            <input value={settingsForm.support_phone} onChange={e => setSettingsForm({ ...settingsForm, support_phone: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                          </label>
                          <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Texte d'accueil (page d'ouverture)
                            <textarea value={settingsForm.welcome_text} onChange={e => setSettingsForm({ ...settingsForm, welcome_text: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '70px', resize: 'vertical' }} />
                          </label>
                          <button onClick={saveSettings} disabled={savingSettings} style={{ background: 'var(--color-primary-green)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: savingSettings ? 'wait' : 'pointer', width: 'fit-content' }}>
                            {savingSettings ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Annonce In-App */}
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '25px' }}>
                      <h4 style={{ margin: '0 0 16px 0', color: 'var(--color-primary-brown)' }}>📢 Annonce Globale (In-App)</h4>
                      <textarea
                        id="annonceText"
                        placeholder="Message affiché chez tous les utilisateurs à leur prochaine connexion..."
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }}
                      />
                      <button
                        onClick={async () => {
                          const val = (document.getElementById('annonceText') as HTMLTextAreaElement).value;
                          if (val) { await createAnnonce(val); alert('Annonce publiée !'); (document.getElementById('annonceText') as HTMLTextAreaElement).value = ''; }
                        }}
                        style={{ background: '#8e44ad', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
                      >
                        Publier l'annonce
                      </button>

                      {/* Liste annonces actives */}
                      {stats.annonces.filter(a => a.is_active).length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: 'var(--color-charcoal-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Annonces actives :</h5>
                          {stats.annonces.filter(a => a.is_active).map(a => (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(142, 68, 173, 0.06)', border: '1px solid rgba(142, 68, 173, 0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>{a.message}</span>
                              <button onClick={() => deactivateAnnonce(a.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '10px', whiteSpace: 'nowrap' }}>Désactiver</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Broadcast Push */}
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '25px' }}>
                      <h4 style={{ margin: '0 0 16px 0', color: 'var(--color-primary-brown)' }}>🔔 Notification Push — Tous les Utilisateurs</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--color-charcoal-muted)' }}>Envoie une notification push à tous les appareils enregistrés sur la plateforme.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                          type="text"
                          placeholder="Titre de la notification (ex: Nouvelle fonctionnalité !)"
                          value={broadcastTitle}
                          onChange={e => setBroadcastTitle(e.target.value)}
                          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', boxSizing: 'border-box' }}
                        />
                        <textarea
                          placeholder="Contenu du message..."
                          value={broadcastMessage}
                          onChange={e => setBroadcastMessage(e.target.value)}
                          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}
                        />
                        <button
                          onClick={handleBroadcast}
                          disabled={!broadcastTitle.trim() || !broadcastMessage.trim() || sendingBroadcast}
                          style={{ background: sendingBroadcast ? '#bdc3c7' : '#e67e22', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: sendingBroadcast ? 'not-allowed' : 'pointer', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          {sendingBroadcast ? 'Envoi en cours...' : '🚀 Envoyer à tous'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* LITIGES */}
                {activeTab === 'litiges' && (() => {
                  const filteredTickets = (stats.tickets || []).filter(t => ticketFilter === 'tous' || t.statut === ticketFilter);
                  const filterLabels = { tous: `Tous (${stats.tickets?.length || 0})`, ouvert: `Ouverts (${stats.tickets?.filter(t => t.statut === 'ouvert').length || 0})`, resolu: `Résolus (${stats.tickets?.filter(t => t.statut === 'resolu').length || 0})` };
                  return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Litiges & Support</h3>
                      <div style={{ display: 'flex', background: 'white', borderRadius: '12px', padding: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', gap: '2px' }}>
                        {(['tous', 'ouvert', 'resolu'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setTicketFilter(f)}
                            style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: ticketFilter === f ? '700' : '500', fontSize: '0.85rem', background: ticketFilter === f ? 'var(--color-primary-brown)' : 'transparent', color: ticketFilter === f ? 'white' : 'var(--color-charcoal-muted)', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
                          >
                            {filterLabels[f]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-warm)', textAlign: 'left', color: 'var(--color-charcoal-muted)' }}>
                            <th style={{ padding: '12px 15px' }}>Date</th>
                            <th style={{ padding: '12px 15px' }}>Client</th>
                            <th style={{ padding: '12px 15px' }}>Livreur concerné</th>
                            <th style={{ padding: '12px 15px' }}>Description</th>
                            <th style={{ padding: '12px 15px' }}>Statut</th>
                            <th style={{ padding: '12px 15px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTickets.map(ticket => (
                            <tr key={ticket.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <td style={{ padding: '12px 15px', color: 'var(--color-charcoal-muted)', fontSize: '0.85rem' }}>{new Date(ticket.created_at).toLocaleString('fr-FR')}</td>
                              <td style={{ padding: '12px 15px' }}><strong>{ticket.clients_livraison?.name || '—'}</strong><br />{ticket.clients_livraison?.phone && <a href={`tel:${ticket.clients_livraison.phone}`} style={{ fontSize: '0.8rem', color: 'var(--color-primary-brown)' }}>{ticket.clients_livraison.phone}</a>}</td>
                              <td style={{ padding: '12px 15px' }}><strong>{ticket.livreurs?.name || '—'}</strong><br />{ticket.livreurs?.phone && <a href={`tel:${ticket.livreurs.phone}`} style={{ fontSize: '0.8rem', color: 'var(--color-primary-brown)' }}>{ticket.livreurs.phone}</a>}</td>
                              <td style={{ padding: '12px 15px', maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{ticket.description}</td>
                              <td style={{ padding: '12px 15px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', background: ticket.statut === 'resolu' ? '#e6f4ea' : '#fce8e6', color: ticket.statut === 'resolu' ? '#1e8e3e' : '#d93025' }}>
                                  {ticket.statut === 'resolu' ? 'Résolu' : 'Ouvert'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  {ticket.statut === 'ouvert' ? (
                                    <button onClick={() => { if (window.confirm('Marquer comme résolu ?')) resolveTicket(ticket.id); }} style={{ background: 'var(--color-primary-green)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Résoudre</button>
                                  ) : (
                                    <button onClick={() => reopenTicket(ticket.id)} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Rouvrir</button>
                                  )}
                                  {ticket.rider_id && (
                                    <button onClick={() => { if (window.confirm(`Suspendre le livreur ${ticket.livreurs?.name || ''} suite à ce signalement ?`)) suspendDriver(ticket.rider_id); }} style={{ background: '#e67e22', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Suspendre livreur</button>
                                  )}
                                  <button onClick={() => { if (window.confirm('Supprimer définitivement ce signalement ?')) deleteTicket(ticket.id); }} style={{ background: 'var(--color-primary-red)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Supprimer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredTickets.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>{ticketFilter === 'tous' ? 'Aucun litige signalé.' : `Aucun litige ${ticketFilter === 'ouvert' ? 'ouvert' : 'résolu'}.`}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  );
                })()}

                {/* GESTION DES AVIS */}
                {activeTab === 'avis' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Gestion des Avis Clients</h3>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-warm)', textAlign: 'left', color: 'var(--color-charcoal-muted)' }}>
                            <th style={{ padding: '12px 15px' }}>Date</th>
                            <th style={{ padding: '12px 15px' }}>Client</th>
                            <th style={{ padding: '12px 15px' }}>Livreur noté</th>
                            <th style={{ padding: '12px 15px' }}>Note</th>
                            <th style={{ padding: '12px 15px' }}>Commentaire</th>
                            <th style={{ padding: '12px 15px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.allAvis?.map(avis => (
                            <tr key={avis.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <td style={{ padding: '12px 15px', color: 'var(--color-charcoal-muted)', fontSize: '0.85rem' }}>{new Date(avis.created_at).toLocaleDateString('fr-FR')}</td>
                              <td style={{ padding: '12px 15px' }}><strong>{avis.clients_livraison?.name || '—'}</strong></td>
                              <td style={{ padding: '12px 15px' }}><strong>{avis.livreurs?.name || '—'}</strong></td>
                              <td style={{ padding: '12px 15px', color: '#d4a017', whiteSpace: 'nowrap' }}>{'★'.repeat(Number(avis.stars) || 0)}{'☆'.repeat(Math.max(0, 5 - (Number(avis.stars) || 0)))}</td>
                              <td style={{ padding: '12px 15px', maxWidth: '300px', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{avis.text || <em style={{ color: 'var(--color-charcoal-muted)' }}>Sans commentaire</em>}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                                <button onClick={() => { if (window.confirm('Supprimer cet avis ? Action irréversible.')) deleteAvis(avis.id); }} style={{ background: 'var(--color-primary-red)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Supprimer</button>
                              </td>
                            </tr>
                          ))}
                          {(!stats.allAvis || stats.allAvis.length === 0) && (
                            <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Aucun avis publié pour le moment.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* INSCRIRE UN LIVREUR (par l'admin) */}
                {activeTab === 'creer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '640px' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Inscrire un livreur</h3>
                    <p style={{ margin: 0, color: 'var(--color-charcoal-muted)', fontSize: '0.9rem' }}>Créez le compte d'un livreur qui n'a pas de smartphone ou n'arrive pas à s'inscrire seul. Vous pourrez ajouter ses documents plus tard.</p>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Nom complet *
                          <input value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Ex : Souleymane Barry" style={{ display: 'block', width: '100%', marginTop: '5px', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                        </label>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Téléphone * (8 chiffres)
                          <input value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="70 00 00 00" style={{ display: 'block', width: '100%', marginTop: '5px', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                        </label>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Code PIN * (4 chiffres min.)
                          <input value={createForm.pin} onChange={e => setCreateForm({ ...createForm, pin: e.target.value })} placeholder="ex : 1234" style={{ display: 'block', width: '100%', marginTop: '5px', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                        </label>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Transport
                          <select value={createForm.vehicle} onChange={e => setCreateForm({ ...createForm, vehicle: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                            <option>Moto</option><option>Tricycle</option><option>Voiture</option>
                          </select>
                        </label>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-charcoal-muted)' }}>Ville
                          <select value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} style={{ display: 'block', width: '100%', marginTop: '5px', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                            <option value="ouaga">Ouagadougou</option><option value="bobo">Bobo-Dioulasso</option>
                          </select>
                        </label>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                        {([['selfie', 'Selfie'], ['cniRecto', 'CNI recto'], ['cniVerso', 'CNI verso']] as const).map(([field, label]) => (
                          <label key={field} style={{ fontSize: '0.78rem', color: 'var(--color-charcoal-muted)', border: '1px dashed #ccc', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
                            📎 {createFiles[field] ? (createFiles[field] as File).name.slice(0, 18) : label + ' (option.)'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setCreateFiles({ ...createFiles, [field]: e.target.files?.[0] })} />
                          </label>
                        ))}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>
                        <input type="checkbox" checked={createForm.activate} onChange={e => setCreateForm({ ...createForm, activate: e.target.checked })} />
                        Activer immédiatement (visible sur la carte tout de suite)
                      </label>
                      <button onClick={submitCreateDriver} disabled={busy} style={{ background: 'var(--color-primary-green)', color: 'white', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: busy ? 'wait' : 'pointer' }}>
                        {busy ? 'Création en cours...' : '✓ Créer le compte livreur'}
                      </button>
                    </div>
                  </div>
                )}

                {/* SANTÉ DE LA BASE */}
                {activeTab === 'sante' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ margin: 0, color: 'var(--color-primary-brown)', fontSize: '1.4rem' }}>Santé de la base</h3>
                      <button onClick={loadHealth} disabled={loadingHealth} style={{ background: 'var(--color-primary-brown)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        {loadingHealth ? 'Analyse...' : 'Rafraîchir'}
                      </button>
                    </div>

                    {/* Comptes fantômes */}
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9h.01"></path><path d="M15 9h.01"></path><path d="M12 2a7 7 0 0 0-7 7v12l3-2 2 2 2-2 2 2 3-2V9a7 7 0 0 0-7-7z"></path></svg>
                        <strong style={{ color: 'var(--color-charcoal)' }}>Comptes fantômes</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)' }}>— compte de connexion sans profil (inscription non terminée)</span>
                      </div>
                      {loadingHealth ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Analyse en cours...</div>
                      ) : health.ghosts.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-primary-green)' }}>✓ Aucun compte fantôme. Base propre !</div>
                      ) : health.ghosts.map(g => (
                        <div key={g.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>{g.name || g.email}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-muted)' }}>{g.role} · {g.phone || g.email} · créé le {new Date(g.created_at).toLocaleDateString('fr-FR')} · {formatLastSeen(g.last_sign_in_at)}</div>
                          </div>
                          <button onClick={() => cleanupItem('ghost', g.id, `le compte fantôme ${g.name || g.email}`)} disabled={busy} style={{ background: 'var(--color-primary-red)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}>Supprimer</button>
                        </div>
                      ))}
                    </div>

                    {/* Livreurs sans documents */}
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e67e22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        <strong style={{ color: 'var(--color-charcoal)' }}>Livreurs actifs sans documents</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)' }}>— visibles sur la carte mais sans CNI/selfie</span>
                      </div>
                      {(() => {
                        const noDocs = stats.allDrivers.filter(d => (d.status === 'actif' || d.status === 'approved') && (!d.selfie || !d.cni_recto || !d.cni_verso));
                        return noDocs.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-primary-green)' }}>✓ Tous les livreurs actifs ont leurs documents.</div>
                        ) : noDocs.map(d => (
                          <div key={d.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <strong style={{ fontSize: '0.9rem' }}>{d.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-muted)' }}>{d.phone} · manque : {[!d.selfie && 'selfie', !d.cni_recto && 'CNI recto', !d.cni_verso && 'CNI verso'].filter(Boolean).join(', ')}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => notifyUser(d.id, d.name)} disabled={busy} style={{ background: '#8e44ad', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}>Relancer</button>
                              <button onClick={() => { setActiveTab('drivers'); setSelectedDriver(d); }} style={{ background: 'var(--color-primary-brown)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}>Ouvrir</button>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Paiements orphelins */}
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                        <strong style={{ color: 'var(--color-charcoal)' }}>Paiements orphelins</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)' }}>— reçus liés à un client supprimé (ère payante)</span>
                      </div>
                      {loadingHealth ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-charcoal-muted)' }}>Analyse en cours...</div>
                      ) : health.orphanPayments.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-primary-green)' }}>✓ Aucun paiement orphelin.</div>
                      ) : health.orphanPayments.map(p => (
                        <div key={p.id} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ fontSize: '0.85rem' }}>{p.montant} F · {p.statut} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</div>
                          <button onClick={() => cleanupItem('orphan_payment', p.id, `ce paiement de ${p.montant} F`)} disabled={busy} style={{ background: 'var(--color-primary-red)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}>Supprimer</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal Aperçu Reçu */}
        {activeReceiptUrl && (
          <div onClick={() => setActiveReceiptUrl(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, cursor: 'zoom-out' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '20px', borderRadius: '24px', boxShadow: '0 24px 70px rgba(0,0,0,0.3)', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <img src={activeReceiptUrl} alt="Reçu de Paiement" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
              <button onClick={() => setActiveReceiptUrl(null)} style={{ background: 'var(--color-primary-brown)', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
