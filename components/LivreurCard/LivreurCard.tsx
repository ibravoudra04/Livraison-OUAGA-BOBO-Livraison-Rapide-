import React from 'react';
import styles from './LivreurCard.module.css';

interface LivreurCardProps {
  name: string;
  vehicle: string;
  rating: number;
  reviewsCount: number;
  avatarUrl?: string;
  isAvailable?: boolean;
}

export default function LivreurCard({ 
  name, 
  vehicle, 
  rating, 
  reviewsCount, 
  avatarUrl,
  isAvailable = true
}: LivreurCardProps) {
  return (
    <div className={styles.riderProfile}>
      <div 
        className={styles.riderAvatar} 
        style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
      >
        {!avatarUrl && (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        )}
      </div>
      
      <div className={styles.riderIdentity}>
        <div className={styles.headerRow}>
          <h3 className={styles.riderName}>{name}</h3>
          {isAvailable && <span className={styles.riderStatus}>Disponible</span>}
        </div>
        
        <div className={styles.riderVehicle}>
          <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px' }}>
            {vehicle?.toLowerCase().includes('moto') ? <img src="/icons/moto.png" alt="Moto" width="24" height="24" style={{ objectFit: 'contain' }} /> : 
             vehicle?.toLowerCase().includes('tricycle') ? <img src="/icons/tricycle.png" alt="Tricycle" width="24" height="24" style={{ objectFit: 'contain' }} /> : 
             vehicle?.toLowerCase().includes('voiture') ? <img src="/icons/voiture.png" alt="Voiture" width="24" height="24" style={{ objectFit: 'contain' }} /> : 
             <span style={{fontSize: '16px'}}>🚚</span>}
          </span>
          <span>{vehicle}</span>
        </div>
        
        <div className={styles.riderRating}>
          <div className={styles.ratingStars} style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={i < Math.round(rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            ))}
          </div>
          <span className={styles.ratingVal}>{rating.toFixed(1)}</span>
          <span className={styles.reviewsCount}>({reviewsCount} avis)</span>
        </div>
      </div>
    </div>
  );
}
