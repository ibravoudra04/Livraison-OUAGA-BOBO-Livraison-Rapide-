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
    startPayment, selectNetwork, submitPhone, submitPin, setPhone, setPin, setError
  } = usePaymentSimulation();

  const [simulatorAttempts, setSimulatorAttempts] = React.useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const atts = sessionStorage.getItem('simulatorAttempts');
      if (atts) {
        setSimulatorAttempts(parseInt(atts));
      }
    }
  }, []);

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
              {simulatorAttempts >= 5 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(232, 92, 74, 0.1)', padding: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  </div>
                  <h3 style={{ color: 'var(--color-primary-red)', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Limite d'essais atteinte</h3>
                  <p style={{ color: 'var(--color-charcoal)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                    Votre reçu n'a pas pu être validé après 5 tentatives. Veuillez contacter notre support pour débloquer votre accès.
                  </p>
                  <div style={{ background: 'rgba(141, 85, 55, 0.06)', border: '1px dashed rgba(141, 85, 55, 0.2)', padding: '12px', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--color-primary-brown)', lineHeight: '1.4', margin: '5px 0' }}>
                    <strong>📸 Consigne de capture d'écran :</strong><br />
                    Veuillez faire une <strong>capture d'écran de cette page</strong> (comprenant l'erreur ou votre reçu) et l'envoyer au support pour une résolution rapide.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '10px' }}>
                    <a 
                      href="https://wa.me/22667370909?text=Bonjour,%20mon%20paiement%20sur%20Livraison%20Rapide%20n'a%20pas%20pu%20être%20validé%20après%205%20essais.%20Voici%20la%20capture%20d'écran%20du%20problème."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ 
                        background: '#25D366', 
                        color: 'white', 
                        padding: '12px', 
                        borderRadius: '16px', 
                        fontWeight: 'bold', 
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003  5.324 5.328 0 11.989 0c3.23.001 6.265 1.258 8.549 3.541C22.822 5.825 24.078 8.861 24.075 12c-.003 6.676-5.328 12-11.991 12-2.003-.001-3.97-.502-5.713-1.458L0 24zM6.574 20.038c1.676.995 3.324 1.52 5.421 1.52 5.463 0 9.907-4.444 9.91-9.908.002-2.646-1.03-5.132-2.906-7.009C17.123 2.766 14.634 1.733 11.99 1.733c-5.466 0-9.912 4.446-9.915 9.91-.001 1.916.498 3.79 1.443 5.429L2.52 21.48l4.054-1.442zm11.233-5.305c-.29-.145-1.713-.846-1.979-.943-.265-.096-.459-.145-.653.146-.193.29-.748.943-.918 1.139-.17.195-.34.218-.63.073-.29-.145-1.226-.452-2.335-1.442-.863-.77-1.445-1.722-1.614-2.012-.17-.29-.018-.447.127-.591.131-.13.29-.34.436-.51.145-.17.193-.29.29-.484.097-.193.048-.363-.024-.51-.072-.145-.653-1.573-.895-2.154-.236-.569-.475-.49-.653-.5-.18-.008-.387-.01-.593-.01-.207 0-.543.078-.828.388-.285.31-1.088 1.065-1.088 2.594 0 1.53 1.111 3.008 1.266 3.218.155.21 2.186 3.339 5.298 4.68.74.32 1.317.51 1.767.653.743.236 1.419.203 1.953.123.595-.089 1.713-.7 1.957-1.378.243-.677.243-1.258.17-1.378-.073-.12-.265-.194-.555-.339z"/></svg>
                      Contacter sur WhatsApp
                    </a>
                    <a 
                      href="tel:+22667370909"
                      className="btn btn-secondary"
                      style={{ 
                        padding: '12px', 
                        borderRadius: '16px', 
                        fontWeight: 'bold', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      Appeler le Support
                    </a>
                  </div>
                </div>
              ) : (
                <>
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
                      {simulatorAttempts > 0 && (
                        <div style={{ color: 'var(--color-primary-brown)', fontSize: '0.85rem', fontWeight: 'bold', margin: '5px 0 10px 0', textAlign: 'center' }}>
                          Tentative de vérification : {simulatorAttempts} / 5
                        </div>
                      )}

                      <button 
                        className="btn btn-primary" 
                        style={{ 
                          width: '100%', 
                          background: 'var(--color-primary-green)', 
                          color: 'white'
                        }}
                        onClick={async () => {
                          const base64 = window['__paymentScreenshot'];
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
                               sessionStorage.setItem('simulatorAttempts', '0');
                               setSimulatorAttempts(0);
                               submitPin('0000', onPaymentSuccess);
                            } else {
                               const nextAtts = simulatorAttempts + 1;
                               setSimulatorAttempts(nextAtts);
                               sessionStorage.setItem('simulatorAttempts', nextAtts.toString());
                               alert(data.message || "Erreur de vérification.");
                               delete window['__paymentScreenshot'];
                               setPin('');
                               if(loadingBtn) loadingBtn.innerText = 'Vérifier le paiement';
                            }
                          } catch(e) {
                             const nextAtts = simulatorAttempts + 1;
                             setSimulatorAttempts(nextAtts);
                             sessionStorage.setItem('simulatorAttempts', nextAtts.toString());
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
                </>
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
