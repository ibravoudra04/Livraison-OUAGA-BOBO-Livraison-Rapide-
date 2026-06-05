import React, { useEffect } from 'react';
import { usePaymentSimulation } from '@/hooks/usePaymentSimulation';

interface PaymentSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  reasonText: string;
  onPaymentSuccess: () => Promise<void>;
}

export default function PaymentSimulator({ isOpen, onClose, amount, reasonText, onPaymentSuccess }: PaymentSimulatorProps) {
  const {
    step, network, phone, pin, loading, error,
    startPayment, selectNetwork, submitPhone, submitPin, setPhone, setPin
  } = usePaymentSimulation();

  useEffect(() => {
    if (isOpen) {
      startPayment();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="payment-overlay" style={{ display: 'flex' }}>
      <div className="payment-modal">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <button className="btn-back-modal" onClick={onClose} aria-label="Retour">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retour
          </button>
        </div>
        
        <div className="payment-header">
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Paiement Sécurisé</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>{reasonText}</p>
        </div>

        <div className="payment-body">
          {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}

          {step === 'NETWORK_SELECTION' && (
            <div id="step-1-network">
              <p style={{ fontWeight: 700, marginBottom: '15px' }}>Choisissez votre réseau :</p>
              <div className="payment-methods">
                <div className="method-option" onClick={() => selectNetwork('Orange')}>
                  <div className="method-logo-sim" style={{ background: '#FF6600', color: 'white', fontWeight: 800, padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>Orange</div>
                  <span className="method-name">Orange Money</span>
                </div>
                <div className="method-option" onClick={() => selectNetwork('Moov')}>
                  <div className="method-logo-sim" style={{ background: '#0055A5', color: 'white', fontWeight: 800, padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>Moov</div>
                  <span className="method-name">Moov Money</span>
                </div>
              </div>
            </div>
          )}

          {step === 'PHONE_INPUT' && (
            <div id="step-2-phone">
              <p style={{ fontWeight: 700, marginBottom: '15px' }}>Numéro {network} Money :</p>
              <div className="form-group">
                <div className="input-wrapper">
                  <span className="input-prefix">+226</span>
                  <input 
                    type="tel" 
                    className="form-input form-input-prefix" 
                    placeholder="Numéro payeur" 
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '15px' }}
                onClick={() => submitPhone(phone)}
                disabled={loading}
              >
                {loading ? 'Connexion réseau...' : `Payer ${amount} FCFA`}
              </button>
            </div>
          )}

          {step === 'USSD_PUSH' && (
            <div id="step-3-ussd" style={{ background: '#000', color: '#00FF00', padding: '15px', borderRadius: '10px', fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>{network?.toUpperCase()} MONEY PUSH</div>
              <p>Voulez-vous payer {amount} FCFA à Livraison Rapide ?</p>
              <p>Entrez votre code PIN pour valider :</p>
              <input 
                type="password" 
                style={{ width: '100%', background: '#333', color: '#00FF00', border: '1px solid #00FF00', padding: '8px', marginTop: '10px', textAlign: 'center', letterSpacing: '5px' }}
                maxLength={4}
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '15px', background: '#00FF00', color: '#000' }}
                onClick={() => submitPin(pin, onPaymentSuccess)}
                disabled={loading}
              >
                {loading ? 'Validation en cours...' : 'VALIDER'}
              </button>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div id="step-4-success" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
              <h3 style={{ color: 'var(--color-primary-green)' }}>Paiement réussi !</h3>
              <p>Merci de votre confiance.</p>
              <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '15px' }}>Fermer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
