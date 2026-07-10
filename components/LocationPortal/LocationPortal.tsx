import React, { useState } from 'react';
import { useLivreursRealtime } from '@/hooks/useLivreursRealtime';

interface LocationPortalProps {
  onClose: () => void;
  onCitySelect: (city: string, lat?: number, lng?: number) => void;
  onAutoDetect?: () => Promise<void> | void;
}

export default function LocationPortal({ onClose, onCitySelect, onAutoDetect }: LocationPortalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tempCity, setTempCity] = useState<string | null>(null);
  const [sectorSearch, setSectorSearch] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch real counts from DB
  const { livreurs, loading: countsLoading } = useLivreursRealtime();
  const ouagaCount = livreurs.filter((l: any) => l.city === 'ouaga').length;
  const boboCount = livreurs.filter((l: any) => l.city === 'bobo').length;
  const cityLabel = (n: number) => countsLoading ? '…' : `${n} livreur${n !== 1 ? 's' : ''} actif${n !== 1 ? 's' : ''}`;

  // Full exhaustive list of sectors & neighborhoods based on administrative divisions
  const sectorsData: Record<string, string[]> = {
    'Ouagadougou': [
      'Balkuy', 'Bangpooré', 'Baoghin', 'Bassinko', 'Bendogo', 'Bilbalogo', 'Bissighin', 'Boassa', 
      'Camp militaire', 'Cissin', 'Dagnoën', 'Dapoya 2', 'Dar-es-Salam', 'Dassasgho', 'Dayongo', 
      'Gandin', 'Godin', 'Gounghin', 'Gounghin Nord', 'Gounghin Sud', 'Hamdalaye', 'Kalgondin', 
      'Kamsonghin', 'Kankasin', 'Karpala', 'Kienbaoghin', 'Kilwin', 'Kologh-Naba', 'Kossodo', 
      'Koulouba', 'Koumdayonré', 'Kouritenga', 'Lanoayiri', 'Larlé', 'Larlé Wéogo', 'Mankougoudou', 
      'Marcoussis', 'Naababpougo', 'Nagrin', 'Nemnin', 'Niogsin', 'Nioko 1', 'Nioko 2', 'Nonsin', 
      'Ouaga 2000', 'Ouapassi', 'Ouidi', 'Ouidtenga', 'Paspanga', 'Patte d\'Oie', 'Pissy', 
      'Rimkiéta', 'Ronsin', 'Saint-Léon', 'Samandin', 'Sambin barrage', 'Sandogo', 'Silmiougou', 
      'Silmiyiri', 'Sogpèlcé', 'Somgandé', 'Taabtenga', 'Tampouy', 'Tanghin', 'Tiedpalogo', 
      'Toukin', 'Trame d\'accueil de Ouaga 2000', 'Wayalghin', 'Wemtenga', 'Wob Riguéré', 
      'Yamtenga', 'Yaoghin', 'Zaghtouli', 'Zangouettin', 'Zogona', 'Zongo', 'Zongo Nabitenga', 
      'Zone industrielle'
    ],
    'Bobo-Dioulasso': [
      'Accart-ville', 'Bana', 'Baré', 'Belle-Ville', 'Belleville', 'Bolomakoté', 'Borodougou', 
      'Colma', 'Dafinso', 'Darsalamy', 'Diarradougou', 'Dindéresso', 'Dingasso', 'Dioulassoba', 
      'Dodougou', 'Dogotélama', 'Doufiguisso', 'Farakan', 'Farakoba', 'Kékélésso', 'Kimidougou', 
      'Koko', 'Kokorowé', 'Koro', 'Kotédougou', 'Kouakoualé', 'Kouentou', 'Koumi', 'Léguéma', 
      'Logofourousso', 'Matourkou', 'Moamy', 'Moukoma', 'Moussobadougou', 'Nasso', 'Niamadougou', 
      'Niangoloko', 'Noumousso', 'Ouolonkoto', 'Pala', 'Panamasso', 'Saint-Étienne', 'Samagan', 
      'Santidougou', 'Sarfalao', 'Secteur 1', 'Secteur 2', 'Secteur 3', 'Secteur 4', 'Secteur 5', 
      'Secteur 6', 'Secteur 7', 'Secteur 8', 'Secteur 9', 'Secteur 10', 'Secteur 11', 'Secteur 12', 
      'Secteur 13', 'Secteur 14', 'Secteur 15', 'Secteur 16', 'Secteur 17', 'Secteur 18', 'Secteur 19', 
      'Secteur 20', 'Secteur 21', 'Secteur 22', 'Secteur 23', 'Secteur 24', 'Secteur 25', 'Secteur 26', 
      'Secteur 27', 'Secteur 28', 'Secteur 29', 'Secteur 30', 'Secteur 31', 'Secteur 32', 'Secteur 33', 
      'Sogossagasso', 'Tondogosso', 'Tounouma', 'Yéguéresso'
    ]
  };

  const handleCityClick = (city: string) => {
    setTempCity(city);
    setStep(2); // Go to options (Carte vs Quartiers)
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    if (onAutoDetect) {
      try {
        await onAutoDetect();
      } finally {
        setIsDetecting(false);
      }
    } else {
      setTimeout(() => {
        setIsDetecting(false);
        onCitySelect('Ouagadougou');
      }, 1200);
    }
  };

  const handleMapDirectly = () => {
    if (tempCity) {
      onCitySelect(tempCity);
    }
  };

  const handleSectorsClick = () => {
    setStep(3); // Go to Sectors selection
  };

  const handleSectorSelect = async (sector: string) => {
    if (tempCity) {
      setIsDetecting(true);
      try {
        const query = `${sector}, ${tempCity}, Burkina Faso`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          onCitySelect(tempCity, parseFloat(data[0].lat), parseFloat(data[0].lon));
        } else {
          // Fallback if sector is not found
          onCitySelect(tempCity);
        }
      } catch (err) {
        console.error("Erreur de géocodage :", err);
        onCitySelect(tempCity);
      } finally {
        setIsDetecting(false);
      }
    }
  };

  const filteredSectors = tempCity && sectorsData[tempCity] 
    ? sectorsData[tempCity].filter(s => s.toLowerCase().includes(sectorSearch.toLowerCase()))
    : [];

  return (
    <div className="location-portal-overlay open" id="location-portal">
      <div className="location-portal-card">
        {step === 1 && (
          <div id="loc-step-city">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', width: '100%' }}>
              <button className="btn-back-modal" onClick={onClose} aria-label="Retour">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Retour
              </button>
            </div>
            
            <div className="loc-header" style={{ marginTop: 0 }}>
              <img src="/monument_martyrs.png" alt="Monument des Martyrs" className="burkina-map-badge" />
              <h3>Dans quelle ville êtes-vous ?</h3>
              <p>Choisissez votre ville pour localiser les livreurs disponibles autour de vous.</p>
            </div>
            
            <div className="gps-auto-detect-container">
              <button 
                className="btn" 
                id="btn-gps-auto-detect" 
                onClick={handleAutoDetect}
                disabled={isDetecting}
                style={{ pointerEvents: isDetecting ? 'none' : 'auto' }}
              >
                {isDetecting ? (
                  <>
                    <div className="geo-spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}></div>
                    Détection en cours...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="radar-anim" style={{ animation: 'pulse-radar 2s infinite' }}><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
                    Recherche automatique
                  </>
                )}
              </button>
            </div>
            
            <div className="loc-city-grid">
               <div className="loc-city-card" onClick={() => handleCityClick('Ouagadougou')}>
                  <img loading="lazy" src="/ouaga_monument.png" alt="Ouagadougou Place des Cinéastes" className="city-card-img" />
                  <h4>Ouagadougou</h4>
                  <span className="city-desc">{cityLabel(ouagaCount)}</span>
              </div>
              <div className="loc-city-card" onClick={() => handleCityClick('Bobo-Dioulasso')}>
                  <img loading="lazy" src="/bobo_mosque.png" alt="Bobo-Dioulasso Grande Mosquée" className="city-card-img" />
                  <h4>Bobo-Dioulasso</h4>
                  <span className="city-desc">{cityLabel(boboCount)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div id="loc-step-options">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', width: '100%' }}>
              <button className="btn-back-modal" onClick={() => setStep(1)} aria-label="Retour">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Retour
              </button>
            </div>
            
            <div className="loc-header" style={{ marginTop: 0 }}>
              <h3 id="loc-city-title">{tempCity}</h3>
              <p>Comment souhaitez-vous trouver votre livreur ?</p>
            </div>
            
            <div className="loc-options-grid">
              <div className="loc-option-btn-card" onClick={handleMapDirectly}>
                <div className="loc-option-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div>
                  <h4>Voir la carte en direct</h4>
                  <p>Découvrez tous les livreurs dispos autour de vous en temps réel.</p>
                </div>
              </div>
              
              <div className="loc-option-btn-card" onClick={handleSectorsClick}>
                <div className="loc-option-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                </div>
                <div>
                  <h4>Choisir mon quartier / secteur</h4>
                  <p>Sélectionnez directement votre quartier pour localiser les livreurs.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div id="loc-step-sectors">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', width: '100%' }}>
              <button className="btn-back-modal" onClick={() => setStep(2)} aria-label="Retour">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Retour
              </button>
            </div>
            
            <div className="loc-header" style={{ marginTop: 0 }}>
              <h3>Sélectionnez votre quartier</h3>
              <p id="loc-sectors-desc">Quartiers disponibles à {tempCity}</p>
            </div>
            
            <div className="sectors-search-wrapper">
              <input 
                type="text" 
                id="sectors-search-input" 
                placeholder="Rechercher un quartier..." 
                autoComplete="off"
                value={sectorSearch}
                onChange={(e) => setSectorSearch(e.target.value)}
              />
            </div>
            
            <div className="loc-sectors-grid" id="loc-sectors-list">
              {filteredSectors.length > 0 ? (
                filteredSectors.map((sector) => (
                  <div key={sector} className="sector-chip" onClick={() => handleSectorSelect(sector)}>
                    {sector}
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0', color: 'var(--color-charcoal-muted)', fontSize: '0.85rem' }}>
                  Aucun quartier ne correspond à votre recherche.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
