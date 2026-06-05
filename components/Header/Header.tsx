import React from 'react';
import Image from 'next/image';
import styles from './Header.module.css';

interface HeaderProps {
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onProfileClick?: () => void;
}

export default function Header({ isLoggedIn = false, onLoginClick, onProfileClick }: HeaderProps) {
  return (
    <header className={styles.header}>
      <a href="/" className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Image 
            src="/delivery_logo_premium.jpg" 
            alt="Livraison Rapide Logo" 
            width={44} 
            height={44} 
            className={styles.logoImage}
          />
        </div>
        <h1 className={styles.logoText}>
          Livraison<span>Rapide</span>
        </h1>
      </a>
      
      <nav className={styles.navButtons}>
        {!isLoggedIn ? (
          <button className={styles.btnSecondary} onClick={onLoginClick}>
            Se connecter
          </button>
        ) : (
          <button className={`${styles.btnSecondary} ${styles.profileBtn}`} onClick={onProfileClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Mon Compte</span>
          </button>
        )}
      </nav>
    </header>
  );
}
