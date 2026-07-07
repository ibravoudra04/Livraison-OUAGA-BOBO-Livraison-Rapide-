import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  riderId: string;
  riderName?: string;
  user: any;
}

export default function ReportModal({ isOpen, onClose, riderId, riderName, user }: ReportModalProps) {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setError('');
      setSuccess(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!user) {
      setError('Vous devez être connecté pour signaler un problème.');
      return;
    }
    if (!description.trim()) {
      setError('Veuillez décrire le problème rencontré.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase
      .from('tickets_support')
      .insert({
        client_id: user.id,
        rider_id: riderId,
        description: description.trim(),
      });

    setSubmitting(false);

    if (insertError) {
      setError("Erreur lors de l'envoi du signalement. Veuillez réessayer.");
    } else {
      setSuccess(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" id="report-modal" style={{ display: 'flex' }}>
      <div className="payment-card" style={{ maxWidth: '480px', width: '95%' }}>
        <div className="payment-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
          <button className="btn-back-modal" onClick={onClose} aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retour
          </button>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            Signaler un problème
          </h3>
          <div style={{ width: '70px' }}></div>
        </div>

        <div className="payment-body" style={{ padding: '20px' }}>
          {!success ? (
            <>
              <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: 'var(--color-charcoal)', lineHeight: 1.5 }}>
                Décrivez le problème rencontré avec <strong>{riderName || 'ce livreur'}</strong>. Votre signalement sera transmis à l'administrateur du support.
              </p>

              <textarea
                placeholder="Expliquez ce qui s'est passé (retard, comportement, colis, tarif...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none', marginBottom: '15px' }}
              />

              {error && (
                <div style={{ color: 'var(--color-primary-red)', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={onClose}
                  style={{ flex: 1, padding: '12px', borderRadius: '50px', background: 'transparent', border: '1px solid var(--color-charcoal-muted)', color: 'var(--color-charcoal)', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ flex: 1, padding: '12px', borderRadius: '50px', background: 'var(--color-primary-red)', border: 'none', color: 'white', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Envoi...' : 'Envoyer le signalement'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ background: '#e6f4ea', padding: '25px 20px', borderRadius: '16px', textAlign: 'center', border: '1px solid #1e8e3e' }}>
              <div style={{ color: '#1e8e3e', fontSize: '2rem', marginBottom: '10px' }}>✓</div>
              <h4 style={{ margin: '0 0 5px 0', color: '#1e8e3e', fontSize: '1.1rem' }}>Signalement envoyé !</h4>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#1e8e3e' }}>L'administrateur a bien été notifié et traitera votre demande.</p>
              <button
                onClick={onClose}
                style={{ padding: '12px 30px', borderRadius: '50px', background: 'var(--color-primary-brown)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
