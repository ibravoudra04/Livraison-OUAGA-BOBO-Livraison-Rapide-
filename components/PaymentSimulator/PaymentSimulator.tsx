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
                <div className="method-option" onClick={() => {
                  setError("Moov Money n'est pas encore supporté par l'IA.");
                }}>
                  <div className="method-logo-sim" style={{ background: '#0055A5', color: 'white', fontWeight: 800, padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>Moov</div>
                  <span className="method-name">Moov Money</span>
                </div>
              </div>
            </div>
          )}

          {step === 'PHONE_INPUT' && (
            <div id="step-2-phone">
              <p style={{ fontWeight: 700, marginBottom: '15px' }}>Instructions pour le paiement :</p>
              <div style={{ background: 'rgba(0,0,0,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem' }}>
                <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: 1.5 }}>
                  <li>Composez le <strong>*144*2*1*67370909*{amount}#</strong> sur votre téléphone.</li>
                  <li>Validez le transfert avec votre code PIN.</li>
                  <li>Prenez une <strong>capture d'écran</strong> du SMS de confirmation.</li>
                </ol>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '5px' }}
                onClick={() => submitPhone("00000000")} // Skip to USSD_PUSH (which we will repurpose as UPLOAD)
              >
                J'ai effectué le paiement
              </button>
            </div>
          )}

          {step === 'USSD_PUSH' && (
            <div id="step-3-upload" style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, marginBottom: '15px' }}>Joindre la capture d'écran du SMS :</p>
              
              {!window['__paymentScreenshot'] ? (
                <div style={{ border: '2px dashed var(--color-primary-green)', padding: '30px 20px', borderRadius: '16px', cursor: 'pointer', position: 'relative' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          window['__paymentScreenshot'] = reader.result as string;
                          // Force re-render
                          setPin('1234'); // dummy state update to trigger render
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--color-primary-green)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <span style={{ fontWeight: 'bold' }}>Cliquez pour choisir une image</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <img src={window['__paymentScreenshot']} alt="Reçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', background: 'var(--color-primary-green)', color: 'white' }}
                    onClick={async () => {
                      // set loading and call API
                      const base64 = window['__paymentScreenshot'];
                      // We abuse submitPin to bypass hook's state and go into loading.
                      // Actually, let's just use the hook's standard logic to show loading, but do our fetch here
                      const loadingBtn = document.getElementById('verify-btn');
                      if(loadingBtn) loadingBtn.innerText = 'Vérification en cours...';
                      
                      try {
                        const res = await fetch('/api/verify-payment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ imageBase64: base64, montantAttendu: amount })
                        });
                        const data = await res.json();
                        if (data.success) {
                           delete window['__paymentScreenshot'];
                           submitPin('0000', onPaymentSuccess); // trigger SUCCESS step
                        } else {
                           alert(data.message || "Erreur de vérification.");
                           delete window['__paymentScreenshot'];
                           setPin(''); // trigger render to reset
                           if(loadingBtn) loadingBtn.innerText = 'Vérifier le paiement';
                        }
                      } catch(e) {
                         alert("Erreur de connexion serveur.");
                         if(loadingBtn) loadingBtn.innerText = 'Vérifier le paiement';
                      }
                    }}
                    id="verify-btn"
                  >
                    Vérifier le paiement
                  </button>
                  <button onClick={() => { delete window['__paymentScreenshot']; setPin(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-charcoal-muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                    Changer d'image
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'SUCCESS' && (
            <div id="step-5-success" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h3 style={{ color: 'var(--color-primary-green)' }}>Paiement réussi !</h3>
              <p>Merci de votre confiance.</p>
              <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '15px' }}>Continuer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
