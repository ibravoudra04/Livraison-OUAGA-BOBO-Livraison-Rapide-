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
        {!avatarUrl && '👤'}
      </div>
      
      <div className={styles.riderIdentity}>
        <div className={styles.headerRow}>
          <h3 className={styles.riderName}>{name}</h3>
          {isAvailable && <span className={styles.riderStatus}>Disponible</span>}
        </div>
        
        <div className={styles.riderVehicle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <span>{vehicle}</span>
        </div>
        
        <div className={styles.riderRating}>
          <span className={styles.ratingStars}>★★★★★</span>
          <span className={styles.ratingVal}>{rating.toFixed(1)}</span>
          <span className={styles.reviewsCount}>({reviewsCount} avis)</span>
        </div>
      </div>
    </div>
  );
}
