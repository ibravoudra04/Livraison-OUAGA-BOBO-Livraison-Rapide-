import React from 'react';
import Image from 'next/image';

interface WelcomePortalProps {
  onStartSearch: () => void;
  onRegisterClick: () => void;
}

export default function WelcomePortal({ onStartSearch, onRegisterClick }: WelcomePortalProps) {
  return (
    <div className="welcome-portal" id="welcome-portal">
      <div className="portal-card-container">
        <div className="portal-hero">
          {/* Utilisation de balise img standard ou next/image, ici next/image pour l'opti */}
          <img src="/burkina_map.png" alt="Carte du Burkina Faso" className="burkina-map-badge" />
          <h2>Livraison Rapide</h2>
          <p>
            Visualisez les livreurs actifs autour de vous sur la carte en temps réel et contactez-les en un clic.
          </p>
        </div>
        
        <div className="portal-options-single">
          <div className="portal-search-container" id="portal-btn-find" onClick={onStartSearch} style={{ cursor: 'pointer' }}>
            <button className="btn-portal-search-magnifier" aria-label="Lancer la recherche" onClick={(e) => { e.stopPropagation(); onStartSearch(); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <span className="portal-search-caption">Lancer la recherche</span>
          </div>
        </div>
      </div>
      
      <button className="btn btn-primary" id="btn-nav-register" onClick={onRegisterClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
          <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
        Devenir livreur
      </button>
    </div>
  );
}
