import React, { useState } from 'react';
import Drawer from '@/components/Drawer/Drawer';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (userId: string, role: string) => void;
  onRegisterClient?: () => void;
}

export default function AuthDrawer({ isOpen, onClose, onLoginSuccess, onRegisterClient }: AuthDrawerProps) {
  const { supabase, formatPhoneForDB } = useSupabaseAuth();
  
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let phoneNormalized = formatPhoneForDB(phone);
      let virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
      const securePassword = pin.length < 6 ? pin + "_secure_pad" : pin;

      // Compte administrateur : le numéro dédié pointe vers le compte admin.
      // Le mot de passe saisi est utilisé tel quel — JAMAIS de mot de passe en
      // dur ici (le code client est public). C'est app_metadata.role='admin',
      // fixé côté serveur, qui accorde réellement les droits admin.
      if (phoneNormalized.includes('67 37 09 09') || phoneNormalized.includes('00 00 00 00')) {
        virtualEmail = 'admin@livraison.com';
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: securePassword
      });
      if (authError) throw authError;

      // On success, close the drawer. App.js/page.tsx will handle the routing
      // based on the updated session/role.
      onClose();
      if (onLoginSuccess && authData?.user) {
        // 'admin' ne peut venir QUE de app_metadata (non modifiable par l'usager).
        // Tout le reste est routé comme client/livreur — jamais admin.
        const resolvedRole = authData.user.app_metadata?.role === 'admin'
          ? 'admin'
          : (authData.user.user_metadata?.role === 'rider' ? 'rider' : 'client');
        onLoginSuccess(authData.user.id, resolvedRole);
      }
      // Reset form
      setPhone('');
      setPin('');
    } catch (err: any) {
      setError("Numéro ou code PIN incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer id="auth-drawer" isOpen={isOpen} onClose={onClose} title="Se connecter" cardStyle={{ width: '340px', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
      <div className="drawer-body" style={{ textAlign: 'left', width: '100%' }}>
        
        {error && (
          <div style={{ padding: '10px', backgroundColor: '#fce8e6', color: '#d93025', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Numéro de téléphone</label>
            <div className="input-wrapper">
              <span className="input-prefix">+226</span>
              <input 
                type="tel" 
                className="form-input form-input-prefix" 
                required 
                maxLength={11} 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="70 00 00 00"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Code secret (PIN)</label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <input 
                type={showPin ? "text" : "password"} 
                className="form-input form-input-password" 
                required 
                style={{ paddingRight: '40px' }}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Votre code secret"
              />
              <button 
                type="button" 
                onClick={() => setShowPin(!showPin)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-charcoal-muted)' }}
                aria-label="Afficher le mot de passe"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPin ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '1rem', marginTop: '15px' }} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {onRegisterClient && (
          <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '100%', height: '1px', background: 'var(--color-charcoal-muted)', opacity: 0.2 }}></div>
            <p style={{ margin: '5px 0', fontSize: '0.85rem', color: 'var(--color-charcoal-muted)' }}>Pas encore de compte ?</p>
            <button 
              type="button" 
              onClick={() => { onClose(); onRegisterClient(); }}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '16px', 
                fontSize: '1rem', 
                fontWeight: 'bold',
                background: 'rgba(141, 85, 55, 0.1)', 
                color: 'var(--color-primary-brown)', 
                border: '1px solid rgba(141, 85, 55, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(141, 85, 55, 0.15)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(141, 85, 55, 0.1)'}
            >
              S'inscrire (Compte Client)
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
