import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { createClient } from '@/utils/supabase/client';

interface ClientDashboardProps {
  clientData: any;
  onLogout: () => void;
  onSearch: () => void;
  onChatRider: (riderId: string, riderName: string) => void;
}

interface Conversation {
  riderId: string;
  riderName: string;
  selfie: string | null;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
}

// Icônes lineal
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconChat = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const IconAlert = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconLogout = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

export default function ClientDashboard({ clientData, onLogout, onSearch, onChatRider }: ClientDashboardProps) {
  const { logout, user } = useSupabaseAuth();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const safeClientData = clientData || {};
  const name = safeClientData.name || user?.user_metadata?.name || 'Client';
  const phone = safeClientData.phone || user?.user_metadata?.phone || '';
  const initial = name.charAt(0).toUpperCase();

  const flash = (type: 'ok' | 'err', msg: string) => { setBanner({ type, msg }); setTimeout(() => setBanner(b => (b && b.msg === msg ? null : b)), 3800); };

  const handleLogout = async () => { await logout(); onLogout(); };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Conversations : messages du client, groupés par livreur
      setLoadingChats(true);
      const { data: msgs } = await supabase
        .from('chats_livraison')
        .select('rider_id, text, time, created_at, sender')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (msgs && msgs.length > 0) {
        const riderMap = new Map<string, { text: string; time: string; sender: string }>();
        for (const m of msgs) if (!riderMap.has(m.rider_id)) riderMap.set(m.rider_id, { text: m.text || '📎 Fichier', time: m.time, sender: m.sender });
        const riderIds = Array.from(riderMap.keys());
        const { data: riders } = await supabase.from('livreurs_view').select('id, name, selfie').in('id', riderIds);
        const convos: Conversation[] = riderIds.map(rid => {
          const last = riderMap.get(rid)!;
          const r = riders?.find(x => x.id === rid);
          return { riderId: rid, riderName: r?.name || 'Livreur', selfie: r?.selfie || null, lastMessage: last.text, lastTime: last.time, unread: last.sender === 'rider' };
        });
        setConversations(convos);
      } else {
        setConversations([]);
      }
      setLoadingChats(false);

      // Mes signalements
      const { data: tk } = await supabase
        .from('tickets_support')
        .select('id, description, statut, created_at, livreurs(name)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      setTickets(tk || []);

      // Mes avis
      const { data: av } = await supabase
        .from('avis')
        .select('id, stars, text, created_at, livreurs(name)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      setMyReviews(av || []);
    };
    load();
  }, [user, supabase]);

  const savePin = async () => {
    if (newPin.replace(/\D/g, '').length < 4) { flash('err', 'Le code doit contenir au moins 4 chiffres.'); return; }
    setSavingPin(true);
    const password = newPin.length < 6 ? newPin + '_secure_pad' : newPin;
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPin(false);
    if (error) { flash('err', 'Changement du code échoué.'); return; }
    setShowPinForm(false); setNewPin('');
    flash('ok', 'Votre code secret a été modifié.');
  };

  const unreadCount = conversations.filter(c => c.unread).length;
  const card: React.CSSProperties = { background: 'white', borderRadius: '16px', boxShadow: '0 3px 12px rgba(0,0,0,0.04)', padding: '16px', marginTop: '14px' };
  const sectionTitle = (icon: React.ReactNode, text: string, extra?: React.ReactNode) => (
    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', gap: '8px' }}>{icon}{text}{extra}</h4>
  );

  return (
    <div id="client-dashboard-panel" style={{ paddingBottom: '10px' }}>
      {banner && (
        <div style={{ position: 'sticky', top: 0, zIndex: 5, marginBottom: '10px', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', background: banner.type === 'ok' ? '#e6f4ea' : '#fce8e6', color: banner.type === 'ok' ? '#1e8e3e' : '#d93025' }}>{banner.msg}</div>
      )}

      {/* En-tête profil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '4px 2px 14px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>{initial}</div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-brown)' }}>Bonjour, {name.split(' ')[0]} !</h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>{phone}</div>
        </div>
      </div>

      {/* Action principale : chercher un livreur */}
      <button type="button" onClick={onSearch} style={{ width: '100%', padding: '15px', fontSize: '0.95rem', borderRadius: '14px', fontWeight: 800, background: 'linear-gradient(135deg, var(--color-primary-green), var(--color-primary-green-hover))', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(39, 174, 96, 0.3)' }}>
        <IconSearch />Trouver un livreur
      </button>

      {/* Conversations */}
      <div style={card}>
        {sectionTitle(<IconChat />, 'Mes discussions', unreadCount > 0 ? <span style={{ fontSize: '0.7rem', background: 'var(--color-primary-green)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}</span> : undefined)}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loadingChats ? <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Chargement...</p>
            : conversations.length === 0 ? <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-muted)', fontStyle: 'italic', margin: 0 }}>Aucune discussion pour le moment. Trouvez un livreur pour commencer.</p>
            : conversations.map(c => (
              <button key={c.riderId} type="button" onClick={() => onChatRider(c.riderId, c.riderName)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px', background: c.unread ? 'rgba(39, 174, 96, 0.08)' : 'rgba(0,0,0,0.03)', border: c.unread ? '1.5px solid rgba(39, 174, 96, 0.3)' : '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', background: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0 }}>
                  {c.selfie ? <img src={c.selfie} alt={c.riderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.riderName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: c.unread ? 800 : 600, fontSize: '0.85rem', color: 'var(--color-charcoal)' }}>{c.riderName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-charcoal-muted)', flexShrink: 0 }}>{c.lastTime}</span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: c.unread ? 'var(--color-charcoal)' : 'var(--color-charcoal-muted)', fontWeight: c.unread ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</p>
                </div>
                {c.unread && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary-green)', flexShrink: 0, boxShadow: '0 0 6px rgba(39, 174, 96, 0.5)' }} />}
              </button>
            ))}
        </div>
      </div>

      {/* Mes signalements */}
      {tickets.length > 0 && (
        <div style={card}>
          {sectionTitle(<IconAlert />, 'Mes signalements')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tickets.map(t => (
              <div key={t.id} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '11px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>Livreur : {t.livreurs?.name || '—'}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: t.statut === 'resolu' ? '#e6f4ea' : '#fff4e5', color: t.statut === 'resolu' ? '#1e8e3e' : '#e67e22' }}>
                    {t.statut === 'resolu' ? 'Résolu ✓' : 'En cours'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.4 }}>{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mes avis */}
      {myReviews.length > 0 && (
        <div style={card}>
          {sectionTitle(<IconStar />, 'Mes avis')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myReviews.map(a => (
              <div key={a.id} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: a.text ? '4px' : 0 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>{a.livreurs?.name || 'Livreur'}</span>
                  <span style={{ color: 'var(--color-primary-yellow)', fontSize: '0.8rem' }}>{'★'.repeat(Number(a.stars) || 0)}{'☆'.repeat(Math.max(0, 5 - (Number(a.stars) || 0)))}</span>
                </div>
                {a.text && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.4 }}>{a.text}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mon compte : code PIN + suppression */}
      <div style={card}>
        {sectionTitle(<IconLock />, 'Mon compte')}
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
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <a href="/suppression-compte" style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-muted)', textDecoration: 'underline' }}>Supprimer mon compte</a>
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
