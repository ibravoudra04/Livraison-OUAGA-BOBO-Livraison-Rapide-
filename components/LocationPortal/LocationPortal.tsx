import React, { useState } from 'react';
import { useLivreursRealtime } from '@/hooks/useLivreursRealtime';

interface LocationPortalProps {
  onClose: () => void;
  onCitySelect: (city: string) => void;
}

export default function LocationPortal({ onClose, onCitySelect }: LocationPortalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tempCity, setTempCity] = useState<string | null>(null);
  const [sectorSearch, setSectorSearch] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch real counts from DB
  const { livreurs } = useLivreursRealtime();
  const ouagaCount = livreurs.filter((l: any) => l.city === 'ouaga').length;
  const boboCount = livreurs.filter((l: any) => l.city === 'bobo').length;

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

  const handleAutoDetect = () => {
    setIsDetecting(true);
    // Simulate GPS detection delay
    setTimeout(() => {
      setIsDetecting(false);
      // Let's pretend GPS resolved to Ouagadougou directly, skip step 2 for auto-detect
      // To strictly adhere to the old behavior, we pass the city to onCitySelect which skips options
      onCitySelect('Ouagadougou');
    }, 1200);
  };

  const handleMapDirectly = () => {
    if (tempCity) {
      onCitySelect(tempCity);
    }
  };

  const handleSectorsClick = () => {
    setStep(3); // Go to Sectors selection
  };

  const handleSectorSelect = (sector: string) => {
    if (tempCity) {
      onCitySelect(tempCity);
      // In a real app, we would pan the map to the sector here
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
              <img src="/burkina_map.png" alt="Carte du Burkina Faso" className="burkina-map-badge" />
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
                  <span className="city-desc">{ouagaCount} livreur{ouagaCount !== 1 ? 's' : ''} actif{ouagaCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="loc-city-card" onClick={() => handleCityClick('Bobo-Dioulasso')}>
                  <img loading="lazy" src="/bobo_mosque.png" alt="Bobo-Dioulasso Grande Mosquée" className="city-card-img" />
                  <h4>Bobo-Dioulasso</h4>
                  <span className="city-desc">{boboCount} livreur{boboCount !== 1 ? 's' : ''} actif{boboCount !== 1 ? 's' : ''}</span>
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
                <div className="loc-option-icon">📍</div>
                <div>
                  <h4>Voir la carte en direct</h4>
                  <p>Découvrez tous les livreurs dispos autour de vous en temps réel.</p>
                </div>
              </div>
              
              <div className="loc-option-btn-card" onClick={handleSectorsClick}>
                <div className="loc-option-icon">🏘️</div>
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
