import React, { useState } from 'react';
import Drawer from '@/components/Drawer/Drawer';

interface SupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportDrawer({ isOpen, onClose }: SupportDrawerProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const response = await fetch('https://formsubmit.co/ajax/livraisonrapide.app@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email || 'Non renseigné',
          message: message,
          _subject: 'Nouveau message du Support (Livraison Rapide)',
          _template: 'table'
        })
      });

      if (response.ok) {
        setSent(true);
        setTimeout(() => {
          onClose();
          setSent(false);
          setMessage('');
          setEmail('');
        }, 3000);
      } else {
        alert("Une erreur est survenue lors de l'envoi.");
      }
    } catch (error) {
      alert("Une erreur est survenue. Veuillez vérifier votre connexion.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Contacter le Support">
      {!sent ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <p style={{ color: 'var(--color-charcoal-muted)', fontSize: '0.9rem', marginBottom: '10px', lineHeight: '1.4' }}>
            Une question, une suggestion ou un problème ? Envoyez-nous un message, nous vous répondrons par email.
          </p>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>Votre adresse email (optionnel)</label>
            <input 
              type="email" 
              className="loc-input" 
              placeholder="Ex: contact@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: 'rgba(255, 255, 255, 0.8)' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>Votre message <span style={{color: 'var(--color-primary-red)'}}>*</span></label>
            <textarea 
              className="loc-input" 
              placeholder="Comment pouvons-nous vous aider ?" 
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ resize: 'vertical', minHeight: '120px', background: 'rgba(255, 255, 255, 0.8)' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSending || !message.trim()}
            style={{ 
              marginTop: '15px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '10px',
              opacity: (isSending || !message.trim()) ? 0.7 : 1
            }}
          >
            {isSending ? 'Envoi en cours...' : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                Envoyer le mail
              </>
            )}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 10px' }}>
          <div style={{ width: '70px', height: '70px', background: 'rgba(39, 174, 96, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 style={{ color: 'var(--color-primary-brown)', marginBottom: '12px', fontSize: '1.4rem' }}>Message envoyé !</h3>
          <p style={{ color: 'var(--color-charcoal-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Votre message a bien été transmis à l'équipe de Livraison Rapide.
          </p>
        </div>
      )}
    </Drawer>
  );
}
