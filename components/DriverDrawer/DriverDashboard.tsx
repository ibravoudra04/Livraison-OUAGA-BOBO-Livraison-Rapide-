import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { createClient } from '@/utils/supabase/client';
import { compressImage } from '@/utils/compressImage';

interface DriverDashboardProps {
  driverData: any;
  onLogout: () => void;
  onChatClient: (clientId: string, clientName: string) => void;
}

interface ChatConversation {
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
}

const APP_URL = 'https://livraisonrapide.app';

// Icônes lineal (traits fins) — cohérentes avec la charte de l'app
const IconEye = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconHandshake = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconPin = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const IconChat = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconDoc = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconShare = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
const IconPower = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>;
const IconLogout = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const vehicleIcon = (v: string) => {
  const t = (v || '').toLowerCase();
  if (t.includes('tricycle')) return <img src="/icons/tricycle.png" alt="Tricycle" width="18" height="18" style={{ objectFit: 'contain' }} />;
  if (t.includes('voiture')) return <img src="/icons/voiture.png" alt="Voiture" width="18" height="18" style={{ objectFit: 'contain' }} />;
  return <img src="/icons/moto.png" alt="Moto" width="18" height="18" style={{ objectFit: 'contain' }} />;
};

export default function DriverDashboard({ driverData, onLogout, onChatClient }: DriverDashboardProps) {
  const { logout } = useSupabaseAuth();
  const supabase = createClient();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [reviews, setReviews] = useState<{ id: string; stars: number; text: string | null; created_at: string }[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [status, setStatus] = useState<string>(driverData?.status || 'en attente');
  const [docs, setDocs] = useState<{ selfie: string | null; cni_recto: string | null; cni_verso: string | null }>({ selfie: null, cni_recto: null, cni_verso: null });
  const [gpsUpdatedAt, setGpsUpdatedAt] = useState<Date | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err' | 'info'; msg: string } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string>('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const safeDriverData = driverData || { id: 'placeholder', name: 'Livreur', vehicle: 'Moto', status: 'en attente', contacts_count: 0, views_count: 0, rating: 5, created_at: new Date().toISOString() };
  const id = safeDriverData.id;
  const isPlaceholder = id === 'placeholder';

  const flash = (type: 'ok' | 'err' | 'info', msg: string) => {
    setBanner({ type, msg });
    setTimeout(() => setBanner(b => (b && b.msg === msg ? null : b)), 3800);
  };

  // Synchroniser le statut si driverData change
  useEffect(() => { if (driverData?.status) setStatus(driverData.status); }, [driverData?.status]);

  // Charger les conversations (temps réel)
  useEffect(() => {
    if (isPlaceholder) return;
    const loadConversations = async () => {
      setLoadingChats(true);
      try {
        const { data: allMessages } = await supabase
          .from('chats_livraison')
          .select('client_id, text, time, created_at, sender')
          .eq('rider_id', id)
          .order('created_at', { ascending: false });
        if (!allMessages) { setLoadingChats(false); return; }
        const clientMap = new Map<string, { text: string; time: string; sender: string }>();
        for (const msg of allMessages) {
          if (!clientMap.has(msg.client_id)) clientMap.set(msg.client_id, { text: msg.text || '📎 Fichier', time: msg.time, sender: msg.sender });
        }
        if (clientMap.size === 0) { setConversations([]); setLoadingChats(false); return; }
        const clientIds = Array.from(clientMap.keys());
        const { data: clients } = await supabase.rpc('get_my_chat_clients');
        const convos: ChatConversation[] = clientIds.map(cid => {
          const lastMsg = clientMap.get(cid)!;
          const clientInfo = clients?.find((c: { id: string; name: string }) => c.id === cid);
          return { clientId: cid, clientName: clientInfo?.name || 'Client', lastMessage: lastMsg.text, lastTime: lastMsg.time, unread: lastMsg.sender === 'client' };
        });
        setConversations(convos);
      } catch (e) { console.error('Erreur conversations:', e); }
      setLoadingChats(false);
    };
    loadConversations();
    const channel = supabase.channel(`driver_chats_${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats_livraison', filter: `rider_id=eq.${id}` }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driverData?.id, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger les vrais avis
  useEffect(() => {
    if (isPlaceholder) return;
    const loadReviews = async () => {
      setLoadingReviews(true);
      const { data } = await supabase.from('avis').select('id, stars, text, created_at').eq('rider_id', id).order('created_at', { ascending: false });
      setReviews(data || []);
      setLoadingReviews(false);
    };
    loadReviews();
  }, [driverData?.id, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger les documents propres (table livreurs — le livreur lit sa propre ligne)
  useEffect(() => {
    if (isPlaceholder) return;
    const loadDocs = async () => {
      const { data } = await supabase.from('livreurs').select('selfie, cni_recto, cni_verso').eq('id', id).maybeSingle();
      if (data) setDocs({ selfie: data.selfie, cni_recto: data.cni_recto, cni_verso: data.cni_verso });
    };
    loadDocs();
  }, [driverData?.id, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  const reviewsCount = reviews.length;
  const avgRating = reviewsCount > 0 ? reviews.reduce((s, r) => s + (Number(r.stars) || 0), 0) / reviewsCount : Number(safeDriverData.rating || 5);
  const avgRounded = Math.round(avgRating);
  const unreadCount = conversations.filter(c => c.unread).length;

  const isOnline = status === 'actif' || status === 'approved';
  const isPaused = status === 'en pause';
  const canToggle = isOnline || isPaused; // ni "en attente", ni "suspendu"

  const handleLogout = async () => { await logout(); onLogout(); };

  const togglePause = async () => {
    if (!canToggle || isPlaceholder) return;
    const next = isOnline ? 'en pause' : 'actif';
    const { error } = await supabase.from('livreurs').update({ status: next }).eq('id', id);
    if (error) {
      const notEnabled = error.code === '23514' || (error.message || '').includes('status_check');
      flash('err', notEnabled ? "La mise en pause sera bientôt disponible (activation serveur en attente)." : "Impossible de changer votre disponibilité.");
      return;
    }
    setStatus(next);
    flash('ok', next === 'actif' ? 'Vous êtes de nouveau en ligne, visible sur la carte.' : 'Vous êtes en pause. Vous n\'apparaissez plus sur la carte.');
  };

  const updateGPS = (silent = false) => {
    if (isPlaceholder) return;
    if (!navigator.geolocation) { if (!silent) flash('err', "La géolocalisation n'est pas disponible."); return; }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase.from('livreurs').update({ lat: pos.coords.latitude, lng: pos.coords.longitude }).eq('id', id);
        setGpsBusy(false);
        if (error) { if (!silent) flash('err', 'Erreur de mise à jour GPS.'); return; }
        setGpsUpdatedAt(new Date());
        if (!silent) flash('ok', 'Votre position a été actualisée.');
      },
      () => { setGpsBusy(false); if (!silent) flash('err', "Impossible d'obtenir votre position (GPS désactivé ?)."); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // Mise à jour GPS automatique une fois à l'ouverture si le livreur est en ligne
  useEffect(() => {
    if (!isPlaceholder && isOnline) updateGPS(true);
  }, [driverData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadDoc = async (field: 'selfie' | 'cni_recto' | 'cni_verso', file: File) => {
    if (!file || isPlaceholder) return;
    setUploadingDoc(field);
    try {
      const compressed = await compressImage(file);
      const path = `${id}/${field}_${Date.now()}`;
      const { error: upErr } = await supabase.storage.from('identities').upload(path, compressed, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('identities').getPublicUrl(path);
      const { error: updErr } = await supabase.from('livreurs').update({ [field]: pub.publicUrl }).eq('id', id);
      if (updErr) throw updErr;
      setDocs(d => ({ ...d, [field]: pub.publicUrl }));
      flash('ok', 'Document envoyé. Merci !');
    } catch (e) {
      flash('err', "L'envoi du document a échoué. Réessayez.");
    }
    setUploadingDoc('');
  };

  const savePin = async () => {
    if (newPin.replace(/\D/g, '').length < 4) { flash('err', 'Le code doit contenir au moins 4 chiffres.'); return; }
    setSavingPin(true);
    const password = newPin.length < 6 ? newPin + '_secure_pad' : newPin;
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPin(false);
    if (error) { flash('err', 'Changement du code échoué : ' + error.message); return; }
    setShowPinForm(false); setNewPin('');
    flash('ok', 'Votre code secret a été modifié.');
  };

  const shareProfile = async () => {
    const text = `Bonjour ! Je suis ${(safeDriverData.name || 'un livreur').split(' ')[0]}, livreur sur Livraison Rapide. Retrouvez-moi sur la carte et contactez-moi : ${APP_URL}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Livraison Rapide', text, url: APP_URL }); }
      else { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
    } catch { /* annulé */ }
  };

  const firstName = (safeDriverData.name || safeDriverData.first_name || 'Livreur').split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();
  const missingDocs = [!docs.selfie && 'selfie', !docs.cni_recto && 'CNI recto', !docs.cni_verso && 'CNI verso'].filter(Boolean);

  const sectionTitle = (icon: React.ReactNode, text: string, extra?: React.ReactNode) => (
    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon}{text}{extra}
    </h4>
  );
  const card: React.CSSProperties = { background: 'white', borderRadius: '16px', boxShadow: '0 3px 12px rgba(0,0,0,0.04)', padding: '16px', marginTop: '14px' };

  return (
    <div id="driver-dashboard-panel" style={{ paddingBottom: '10px' }}>
      {/* Bandeau de notification (remplace les alert) */}
      {banner && (
        <div style={{ position: 'sticky', top: 0, zIndex: 5, marginBottom: '10px', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', background: banner.type === 'ok' ? '#e6f4ea' : banner.type === 'err' ? '#fce8e6' : '#eef2f7', color: banner.type === 'ok' ? '#1e8e3e' : banner.type === 'err' ? '#d93025' : 'var(--color-charcoal)' }}>
          {banner.msg}
        </div>
      )}

      {/* En-tête : avatar + prénom + véhicule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px 2px 12px' }}>
        <div style={{ width: '58px', height: '58px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', flexShrink: 0, background: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.4rem' }}>
          {docs.selfie ? <img src={docs.selfie} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-brown)' }}>Bonjour, {firstName} !</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>
            {vehicleIcon(safeDriverData.vehicle)} {safeDriverData.vehicle || 'Moto'}
          </div>
        </div>
      </div>

      {/* CARTE HÉRO — statut + interrupteur */}
      {(() => {
        const conf = isOnline
          ? { bg: 'linear-gradient(135deg, #e8f7ee, #d3f0de)', dot: '#1e8e3e', label: 'EN LIGNE', sub: 'Vous êtes visible sur la carte' }
          : isPaused
          ? { bg: 'linear-gradient(135deg, #fff4e5, #ffe9cc)', dot: '#e67e22', label: 'EN PAUSE', sub: 'Vous n\'apparaissez pas sur la carte' }
          : status === 'suspendu'
          ? { bg: 'linear-gradient(135deg, #fdecea, #f9d9d5)', dot: '#d93025', label: 'COMPTE SUSPENDU', sub: 'Contactez l\'administration' }
          : { bg: 'linear-gradient(135deg, #fdf3e0, #f7e6c4)', dot: '#c9a227', label: 'EN ATTENTE DE VALIDATION', sub: 'Votre dossier est en cours d\'examen' };
        return (
          <div style={{ background: conf.bg, borderRadius: '18px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="pulse-dot" style={{ width: '14px', height: '14px', background: conf.dot, flexShrink: 0 }}></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-charcoal)', letterSpacing: '0.3px' }}>{conf.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>{conf.sub}</div>
              </div>
            </div>
            {canToggle && (
              <button onClick={togglePause} style={{ width: '100%', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem', padding: '12px', borderRadius: '12px', color: 'white', background: isOnline ? '#e67e22' : 'var(--color-primary-green)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
                <IconPower />{isOnline ? 'Me mettre en pause' : 'Revenir en ligne'}
              </button>
            )}
          </div>
        );
      })()}

      {/* GPS */}
      {(isOnline || isPaused) && (
        <div style={card}>
          {sectionTitle(<span style={{ color: 'var(--color-primary-brown)' }}><IconPin /></span>, 'Ma position GPS')}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.4 }}>
              {gpsUpdatedAt ? `Actualisée à ${gpsUpdatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Actualisez pour que les clients vous localisent précisément.'}
            </p>
            <button onClick={() => updateGPS(false)} disabled={gpsBusy} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary-green)', color: 'white', border: 'none', padding: '9px 15px', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: gpsBusy ? 'wait' : 'pointer' }}>
              <IconPin />{gpsBusy ? '...' : 'Actualiser'}
            </button>
          </div>
        </div>
      )}

      {/* Statistiques en cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
        <div style={{ background: 'white', borderRadius: '14px', padding: '14px', boxShadow: '0 3px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #2c3e50' }}>
          <div style={{ color: '#2c3e50', marginBottom: '4px' }}><IconHandshake /></div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2c3e50', lineHeight: 1 }}>{safeDriverData.contacts_count || 0}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-charcoal-muted)', marginTop: '3px' }}>Mises en relation</div>
        </div>
        <div style={{ background: 'white', borderRadius: '14px', padding: '14px', boxShadow: '0 3px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #8e44ad' }}>
          <div style={{ color: '#8e44ad', marginBottom: '4px' }}><IconEye /></div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8e44ad', lineHeight: 1 }}>{safeDriverData.views_count || 0}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-charcoal-muted)', marginTop: '3px' }}>Clics sur profil</div>
        </div>
      </div>

      {/* Mes documents */}
      <div style={card}>
        {sectionTitle(<IconDoc />, 'Mes documents', missingDocs.length > 0 ? <span style={{ fontSize: '0.7rem', background: '#fce8e6', color: '#d93025', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{missingDocs.length} manquant{missingDocs.length > 1 ? 's' : ''}</span> : <span style={{ fontSize: '0.7rem', background: '#e6f4ea', color: '#1e8e3e', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>Complet ✓</span>)}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {([['selfie', 'Selfie'], ['cni_recto', 'CNI recto'], ['cni_verso', 'CNI verso']] as const).map(([field, label]) => (
            <label key={field} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', minHeight: '84px', borderRadius: '12px', border: docs[field] ? '1px solid rgba(0,0,0,0.08)' : '1.5px dashed #d9b8a0', background: docs[field] ? 'transparent' : 'var(--color-primary-brown-light)', cursor: 'pointer', overflow: 'hidden', textAlign: 'center', padding: '6px' }}>
              {docs[field] ? (
                <>
                  <img src={docs[field] as string} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: '0.62rem', fontWeight: 700, color: 'white', background: 'rgba(0,0,0,0.45)', padding: '2px' }}>{label} ✓</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '1.1rem' }}>{uploadingDoc === field ? '⏳' : '＋'}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-charcoal-muted)', fontWeight: 600 }}>{uploadingDoc === field ? 'Envoi...' : label}</span>
                </>
              )}
              <input type="file" accept="image/*" style={{ display: 'none' }} disabled={!!uploadingDoc} onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(field, f); }} />
            </label>
          ))}
        </div>
        {missingDocs.length > 0 && <p style={{ margin: '10px 0 0 0', fontSize: '0.72rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.4 }}>Envoyez vos documents manquants pour obtenir le badge « Profil Vérifié ».</p>}
      </div>

      {/* Notes & Avis */}
      <div style={card}>
        {sectionTitle(<IconStar />, 'Notes & Avis clients')}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--color-primary-yellow)' }}>{avgRating.toFixed(1)}</span>
          <div>
            <div style={{ color: 'var(--color-primary-yellow)', fontSize: '0.9rem', letterSpacing: '1px' }}>{'★'.repeat(avgRounded)}{'☆'.repeat(5 - avgRounded)}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-charcoal-muted)' }}>{reviewsCount === 0 ? 'Aucun avis pour le moment' : `Basé sur ${reviewsCount} avis`}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loadingReviews ? <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Chargement...</p>
            : reviewsCount === 0 ? <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Vos futurs avis apparaîtront ici.</p>
            : reviews.map(r => (
              <div key={r.id} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: r.text ? '4px' : 0 }}>
                  <span style={{ color: 'var(--color-primary-yellow)', fontSize: '0.8rem' }}>{'★'.repeat(Number(r.stars) || 0)}{'☆'.repeat(Math.max(0, 5 - (Number(r.stars) || 0)))}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-charcoal-muted)' }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {r.text && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-charcoal)', lineHeight: 1.4 }}>{r.text}</p>}
              </div>
            ))}
        </div>
      </div>

      {/* Messages clients */}
      <div style={card}>
        {sectionTitle(<IconChat />, 'Messages clients', unreadCount > 0 ? <span style={{ fontSize: '0.7rem', background: 'var(--color-primary-green)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}</span> : undefined)}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loadingChats ? <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Chargement...</p>
            : conversations.length === 0 ? <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Aucun message reçu pour le moment.</p>
            : conversations.map(convo => (
              <button key={convo.clientId} type="button" onClick={() => onChatClient(convo.clientId, convo.clientName)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px', background: convo.unread ? 'rgba(39, 174, 96, 0.08)' : 'rgba(0,0,0,0.03)', border: convo.unread ? '1.5px solid rgba(39, 174, 96, 0.3)' : '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0 }}>{convo.clientName.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: convo.unread ? 800 : 600, fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>{convo.clientName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-charcoal-muted)', flexShrink: 0 }}>{convo.lastTime}</span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: convo.unread ? 'var(--color-charcoal)' : 'var(--color-charcoal-muted)', fontWeight: convo.unread ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{convo.lastMessage}</p>
                </div>
                {convo.unread && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary-green)', flexShrink: 0, boxShadow: '0 0 6px rgba(39, 174, 96, 0.5)' }} />}
              </button>
            ))}
        </div>
      </div>

      {/* Outils : partager + code PIN */}
      <div style={card}>
        {sectionTitle(<IconLock />, 'Mon compte')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={shareProfile} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: 'white', background: 'var(--color-primary-green)' }}>
            <IconShare />Partager mon profil (WhatsApp)
          </button>
          {!showPinForm ? (
            <button onClick={() => setShowPinForm(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary-brown)', background: 'white' }}>
              <IconLock />Changer mon code secret
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--color-primary-brown-light)', padding: '12px', borderRadius: '12px' }}>
              <input value={newPin} onChange={e => setNewPin(e.target.value)} type="password" inputMode="numeric" placeholder="Nouveau code (4 chiffres min.)" style={{ padding: '11px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowPinForm(false); setNewPin(''); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-charcoal-muted)', background: 'transparent', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button onClick={savePin} disabled={savingPin} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-primary-green)', color: 'white', fontWeight: 700, cursor: savingPin ? 'wait' : 'pointer' }}>{savingPin ? '...' : 'Enregistrer'}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Déconnexion discrète */}
      <div style={{ textAlign: 'center', marginTop: '18px', marginBottom: '6px' }}>
        <button onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', color: 'var(--color-primary-red)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', padding: '8px 14px' }}>
          <IconLogout />Se déconnecter
        </button>
      </div>
    </div>
  );
}
