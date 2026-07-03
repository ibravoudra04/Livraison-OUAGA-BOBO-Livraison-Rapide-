import React, { useState, useEffect } from 'react';
import Drawer from '@/components/Drawer/Drawer';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import ClientDashboard from './ClientDashboard';

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: () => void;
  onChatRider: (riderId: string, riderName: string) => void;
  initialView?: 'login' | 'register';
}

export default function ClientDrawer({ isOpen, onClose, onSearch, onChatRider, initialView = 'login' }: ClientDrawerProps) {
  const { user, role, supabase, formatPhoneForDB } = useSupabaseAuth();

  const [view, setView] = useState<'login' | 'register' | 'dashboard'>(initialView);
  const [clientData, setClientData] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (user) {
      if (role === 'client') {
        setView('dashboard');
        const fetchClient = async () => {
          try {
            const { data, error } = await supabase.from('clients_livraison').select('*').eq('id', user.id).single();
            if (error) console.error("Error fetching client:", error);
            if (data) {
              setClientData(data);
            } else {
              setClientData({ id: user.id, name: user.user_metadata?.name || 'Client', phone: user.user_metadata?.phone, subscription_paid: false });
            }
          } catch (e) {
            console.error("Exception fetching client:", e);
            setClientData({ id: user.id, name: user.user_metadata?.name || 'Client', phone: user.user_metadata?.phone, subscription_paid: false });
          }
        };
        fetchClient();
      } else if (role === 'admin' || role === 'rider') {
        onClose();
      }
    } else {
      setView(initialView);
      setClientData(null);
    }
  }, [user, role, supabase, initialView]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const phoneNormalized = formatPhoneForDB(phone);
      const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
      const securePassword = pin.length < 6 ? pin + "_secure_pad" : pin;

      const { error: authError } = await supabase.auth.signUp({
        email: virtualEmail,
        password: securePassword,
        options: {
          data: { role: 'client', name, phone: phoneNormalized, subscription_paid: false }
        }
      });
      if (authError) throw authError;
      setView('dashboard');
    } catch (err: any) {
      setError(err.message || "Erreur d'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const phoneNormalized = formatPhoneForDB(phone);
      const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
      const securePassword = pin.length < 6 ? pin + "_secure_pad" : pin;

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: securePassword
      });
      if (authError) throw authError;
      setView('dashboard');
    } catch (err: any) {
      setError("Numéro ou code PIN incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('login');
  };

  return (
    <Drawer id="client-drawer" isOpen={isOpen} onClose={onClose} title={view === 'dashboard' ? 'Espace Client' : 'Compte Client'}>
      {view === 'register' && (
        <div id="client-register-panel">
          <p className="form-subtitle">Créez votre compte client pour sauvegarder vos livreurs favoris.</p>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Nom Complet *</label>
              <input type="text" className="form-input" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone *</label>
              <div className="input-wrapper">
                <span className="input-prefix">+226</span>
                <input type="tel" className="form-input form-input-prefix" required maxLength={11} value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">PIN secret *</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type={showPin ? "text" : "password"} 
                  className="form-input form-input-password" 
                  required 
                  value={pin} 
                  onChange={e => setPin(e.target.value)} 
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  onMouseDown={() => setShowPin(true)}
                  onMouseUp={() => setShowPin(false)}
                  onMouseLeave={() => setShowPin(false)}
                  onTouchStart={() => setShowPin(true)}
                  onTouchEnd={() => setShowPin(false)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-charcoal-muted)' }}
                  aria-label="Afficher le mot de passe"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '15px' }}>
              {loading ? 'Création...' : 'Créer mon compte Client'}
            </button>
          </form>
          <p className="driver-login-link" style={{ textAlign: 'center', marginTop: '15px' }}>
            Déjà client ? <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); }}>Se connecter</a>
          </p>
        </div>
      )}

      {view === 'login' && (
        <div id="client-login-panel">
          <p className="form-subtitle">Connectez-vous à votre espace client.</p>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Téléphone *</label>
              <div className="input-wrapper">
                <span className="input-prefix">+226</span>
                <input type="tel" className="form-input form-input-prefix" required maxLength={11} value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">PIN secret *</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type={showPin ? "text" : "password"} 
                  className="form-input form-input-password" 
                  required 
                  value={pin} 
                  onChange={e => setPin(e.target.value)} 
                  style={{ paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  onMouseDown={() => setShowPin(true)}
                  onMouseUp={() => setShowPin(false)}
                  onMouseLeave={() => setShowPin(false)}
                  onTouchStart={() => setShowPin(true)}
                  onTouchEnd={() => setShowPin(false)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-charcoal-muted)' }}
                  aria-label="Afficher le mot de passe"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '15px' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="driver-login-link" style={{ textAlign: 'center', marginTop: '15px' }}>
            Pas encore client ? <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); }}>Créer un compte</a>
          </p>
        </div>
      )}

      {view === 'dashboard' && (
        <ClientDashboard
          clientData={clientData}
          onLogout={handleLogout}
          onSearch={onSearch}
          onChatRider={onChatRider}
        />
      )}
    </Drawer>
  );
}
