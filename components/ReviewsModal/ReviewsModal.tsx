import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Review {
  id: string;
  stars: number;
  text: string;
  created_at: string;
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  riderId: string;
  riderRating: number;
  riderReviewsCount: number;
}

export default function ReviewsModal({ isOpen, onClose, riderId, riderRating, riderReviewsCount, user }: ReviewsModalProps & { user: any }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && riderId) {
      const fetchReviews = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('avis')
          .select('*')
          .eq('rider_id', riderId)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setReviews(data as Review[]);
        }
        setLoading(false);
      };
      
      fetchReviews();
      setShowForm(false);
      setRating(0);
      setReviewText('');
      setFormError('');
      setFormSuccess(false);
    }
  }, [isOpen, riderId, supabase]);

  const handleSubmitReview = async () => {
    if (!user) {
      setFormError('Vous devez être connecté pour laisser un avis.');
      return;
    }
    if (rating === 0) {
      setFormError('Veuillez sélectionner au moins une étoile.');
      return;
    }
    
    setSubmitting(true);
    setFormError('');
    
    const { error } = await supabase
      .from('avis')
      .insert({
        client_id: user.id,
        rider_id: riderId,
        stars: rating,
        text: reviewText || ''
      });
      
    setSubmitting(false);
    
    if (error) {
      if (error.message.includes('unique') || error.message.includes('RLS') || error.code === '42501') {
        setFormError('Vous ne pouvez noter que les livreurs que vous avez contactés/débloqués.');
      } else {
        setFormError('Erreur lors de l\'envoi de l\'avis.');
      }
    } else {
      setFormSuccess(true);
      // Refresh reviews list
      const { data } = await supabase.from('avis').select('*').eq('rider_id', riderId).order('created_at', { ascending: false });
      if (data) setReviews(data as Review[]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" id="reviews-modal" style={{ display: 'flex' }}>
      <div className="payment-card" style={{ maxWidth: '480px', width: '95%' }}>
        <div className="payment-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
          <button className="btn-back-modal" onClick={onClose} aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retour
          </button>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="var(--color-primary-yellow)" stroke="var(--color-primary-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Notes & Avis Clients
          </h3>
          <div style={{ width: '70px' }}></div>
        </div>
        
        <div className="payment-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '20px' }}>
          
          {!showForm && !formSuccess && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <button 
                onClick={() => setShowForm(true)}
                style={{ background: 'var(--color-primary-brown)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(141, 85, 55, 0.2)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                Donner un avis
              </button>
            </div>
          )}

          {showForm && !formSuccess && (
            <div style={{ background: 'rgba(54, 42, 33, 0.04)', padding: '20px', borderRadius: '16px', marginBottom: '25px', border: '1px solid rgba(54, 42, 33, 0.08)' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--color-primary-brown)', fontSize: '1rem', textAlign: 'center' }}>Laissez votre avis</h4>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '15px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star} 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="32" 
                    height="32" 
                    viewBox="0 0 24 24" 
                    fill={(hoverRating || rating) >= star ? "var(--color-primary-yellow)" : "none"} 
                    stroke="var(--color-primary-yellow)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ cursor: 'pointer', transition: 'all 0.1s' }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              
              <textarea 
                placeholder="Racontez votre expérience avec ce livreur (optionnel)..." 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none', marginBottom: '15px' }}
              />
              
              {formError && (
                <div style={{ color: 'var(--color-primary-red)', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                  {formError}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '50px', background: 'transparent', border: '1px solid var(--color-charcoal-muted)', color: 'var(--color-charcoal)', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  style={{ flex: 1, padding: '12px', borderRadius: '50px', background: 'var(--color-primary-green)', border: 'none', color: 'white', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Envoi...' : 'Envoyer l\'avis'}
                </button>
              </div>
            </div>
          )}

          {formSuccess && (
            <div style={{ background: '#e6f4ea', padding: '20px', borderRadius: '16px', marginBottom: '25px', textAlign: 'center', border: '1px solid #1e8e3e' }}>
              <div style={{ color: '#1e8e3e', fontSize: '2rem', marginBottom: '10px' }}>✓</div>
              <h4 style={{ margin: '0 0 5px 0', color: '#1e8e3e', fontSize: '1.1rem' }}>Merci pour votre avis !</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e8e3e' }}>Votre retour aide la communauté.</p>
            </div>
          )}

          {/* C4 — moyenne et compteur calculés en direct sur la liste chargée :
              après un nouvel avis, ils se mettent à jour immédiatement. */}
          {(() => {
            const liveCount = reviews.length > 0 ? reviews.length : (riderReviewsCount || 0);
            const liveAvg = reviews.length > 0
              ? reviews.reduce((s, r) => s + (Number(r.stars) || 0), 0) / reviews.length
              : Number(riderRating || 5);
            return (
          <div className="reviews-summary-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', borderBottom: '1.5px solid var(--color-border)', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary-yellow)', lineHeight: 1 }}>{liveAvg.toFixed(1)}</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-muted)', fontWeight: 600, marginTop: '6px' }}>{liveCount === 0 ? 'Aucun avis pour le moment' : `Basé sur ${liveCount} avis`}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={i < Math.round(liveAvg) ? "var(--color-primary-yellow)" : "none"} stroke="var(--color-primary-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-charcoal-light)', margin: '8px 0 0 0', lineHeight: 1.4 }}>Moyenne générale calculée sur les retours d'expériences clients.</p>
            </div>
          </div>
            );
          })()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <><span className="skl" style={{ display: 'block', height: '72px', borderRadius: '16px' }}></span><span className="skl" style={{ display: 'block', height: '72px', borderRadius: '16px' }}></span></>
            ) : reviews.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-charcoal-light)' }}>Aucun avis pour le moment.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} style={{ background: 'rgba(54, 42, 33, 0.03)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(54, 42, 33, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={i < review.stars ? "var(--color-primary-yellow)" : "none"} stroke="var(--color-primary-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-charcoal-muted)' }}>
                      {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-charcoal)', lineHeight: 1.5 }}>{review.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
