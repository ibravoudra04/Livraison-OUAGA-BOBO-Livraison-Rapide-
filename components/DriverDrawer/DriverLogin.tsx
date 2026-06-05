import React, { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface DriverLoginProps {
  onGoToRegister: () => void;
  onSuccess: () => void;
}

export default function DriverLogin({ onGoToRegister, onSuccess }: DriverLoginProps) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithPhone } = useSupabaseAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // The loginWithPhone logic should format phone and append secure pad if needed
      const result = await loginWithPhone(phone, pin);
      if (result.error) {
        setError('Numéro ou code PIN incorrect.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="driver-login-panel">
      <p className="form-subtitle">
        Connectez-vous à votre espace livreur pour gérer votre statut et votre abonnement.
      </p>
      
      {error && (
        <div style={{ color: 'var(--color-primary-red)', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleLogin} id="driver-login-form">
        <div className="form-group">
          <label htmlFor="login-phone" className="form-label">Numéro de téléphone</label>
          <div className="input-wrapper">
            <span className="input-prefix">+226</span>
            <input 
              type="tel" 
              id="login-phone" 
              className="form-input form-input-prefix" 
              placeholder="70 00 00 00" 
              maxLength={11} 
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="login-pin" className="form-label">Code secret (PIN / Mot de passe)</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <input 
              type={showPin ? "text" : "password"} 
              id="login-pin" 
              className="form-input form-input-password" 
              placeholder="Votre code secret" 
              required 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
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

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '1rem', marginTop: '10px' }}>
          {loading ? 'Connexion en cours...' : 'Accéder à mon tableau de bord'}
        </button>
      </form>

      <p className="driver-login-link">
        Pas encore inscrit ? <a href="#" onClick={(e) => { e.preventDefault(); onGoToRegister(); }}>Créer un compte</a>
      </p>
    </div>
  );
}
