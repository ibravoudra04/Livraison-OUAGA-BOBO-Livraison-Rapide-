import React, { useState } from 'react';
import { useDriverOnboarding } from '@/hooks/useDriverOnboarding';

const ouagaQuartiers = [
  { name: "Sélectionnez votre quartier...", lat: 0, lng: 0 },
  { name: "Centre-ville (Koulouba / ZACA)", lat: 12.3714, lng: -1.5197 },
  { name: "Ouaga 2000", lat: 12.3167, lng: -1.4988 },
  { name: "Patte d'Oie", lat: 12.3333, lng: -1.5167 },
  { name: "Gounghin", lat: 12.3619, lng: -1.5458 },
  { name: "Pissy", lat: 12.3556, lng: -1.5644 },
  { name: "Zogona", lat: 12.3833, lng: -1.4981 },
  { name: "Dassasgho", lat: 12.3789, lng: -1.4883 },
  { name: "Tampouy", lat: 12.4083, lng: -1.5583 },
  { name: "Somgandé", lat: 12.4167, lng: -1.4833 },
  { name: "Cissin", lat: 12.3422, lng: -1.5411 },
  { name: "Kalgondé", lat: 12.3486, lng: -1.5033 },
  { name: "Karpala", lat: 12.3333, lng: -1.4667 },
  { name: "Rayongo / Zone 1", lat: 12.3500, lng: -1.4500 },
];

interface DriverRegistrationProps {
  onGoToLogin: () => void;
  onSuccess: () => void;
}

export default function DriverRegistration({ onGoToLogin, onSuccess }: DriverRegistrationProps) {
  const { registerDriver, loading, progress, error } = useDriverOnboarding();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pin: '',
    vehicle: 'Moto',
  });

  const [location, setLocation] = useState({ lat: 12.3714, lng: -1.5197 });
  const [geoStatus, setGeoStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const [showPin, setShowPin] = useState(false);

  const [files, setFiles] = useState<{
    cniRecto?: File;
    cniVerso?: File;
    selfie?: File;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cniRecto' | 'cniVerso' | 'selfie') => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles({ ...files, [type]: e.target.files[0] });
    }
  };

  const handleGeolocation = () => {
    setGeoStatus('loading');
    
    const requestLocation = (highAccuracy: boolean) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            setGeoStatus('success');
          },
          (error) => {
            if (error.code === 3 && highAccuracy) {
              // Retry with lower accuracy if high accuracy times out
              requestLocation(false);
              return;
            }
            let errorMessage = "Géolocalisation refusée ou impossible.";
            if (error.code === 1) errorMessage = "Permission refusée. Veuillez activer le GPS et autoriser le navigateur.";
            if (error.code === 2) errorMessage = "Position introuvable (GPS désactivé ou signal faible).";
            if (error.code === 3) errorMessage = "Délai d'attente dépassé. Réessayez à l'extérieur.";
            
            alert(`${errorMessage}\n\nVeuillez sélectionner votre quartier manuellement.`);
            setGeoStatus('error');
          },
          { enableHighAccuracy: highAccuracy, timeout: 8000, maximumAge: 60000 }
        );
      } else {
        alert("Géo-localisation non supportée. Veuillez sélectionner votre quartier manuellement.");
        setGeoStatus('error');
      }
    };
    
    requestLocation(true);
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (geoStatus === 'pending') {
      alert("Votre position GPS est obligatoire. Nous allons lancer la recherche, veuillez accepter l'autorisation.");
      handleGeolocation();
      return;
    }

    if (geoStatus === 'loading') {
      alert("Recherche GPS en cours, veuillez patienter...");
      return;
    }
    
    if (geoStatus !== 'success') {
      alert("Votre position est obligatoire. Veuillez sélectionner un quartier manuellement.");
      return;
    }
    
    if (!files.cniRecto || !files.cniVerso || !files.selfie) {
      alert("Veuillez fournir toutes les photos demandées (CNI Recto, CNI Verso, et Selfie).");
      return;
    }
    
    const dOuaga = getDistance(location.lat, location.lng, 12.3714, -1.5197);
    const dBobo = getDistance(location.lat, location.lng, 11.1771, -4.2968);
    const inferredCity = dBobo < dOuaga ? 'bobo' : 'ouaga';
    
    const result = await registerDriver({
      ...formData,
      city: inferredCity,
      lat: location.lat,
      lng: location.lng,
      ...files
    });

    if (result.success) {
      onSuccess();
    }
  };

  return (
    <div id="driver-register-panel">
      <form onSubmit={handleSubmit} id="driver-register-form">
        <p className="form-subtitle">Inscrivez-vous gratuitement pour commencer à recevoir des courses.</p>
        
        {error && <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>❌ {error}</div>}

        <div className="form-group">
          <label className="form-label">Nom complet *</label>
          <input type="text" name="name" className="form-input" placeholder="Ex: Souleymane Barry" required value={formData.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Numéro de téléphone *</label>
          <div className="input-wrapper">
            <span className="input-prefix">+226</span>
            <input type="tel" name="phone" className="form-input form-input-prefix" placeholder="70 00 00 00" required maxLength={11} value={formData.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mot de passe secret *</label>
          <div className="input-wrapper" style={{ position: 'relative' }}>
            <input 
              type={showPin ? "text" : "password"} 
              name="pin" 
              className="form-input form-input-password" 
              placeholder="Choisissez votre mot de passe secret" 
              required 
              value={formData.pin} 
              onChange={handleChange} 
              style={{ paddingRight: '40px' }}
            />
            <button 
              type="button"
              onMouseDown={() => setShowPin(true)}
              onMouseUp={() => setShowPin(false)}
              onMouseLeave={() => setShowPin(false)}
              onTouchStart={() => setShowPin(true)}
              onTouchEnd={() => setShowPin(false)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-charcoal-muted)' }}
              aria-label="Afficher le mot de passe"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Moyen de transport *</label>
          <div className="vehicle-selector">
            {['Moto', 'Tricycle', 'Voiture'].map(v => (
              <div 
                key={v} 
                className={`vehicle-option ${formData.vehicle === v ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, vehicle: v })}
              >
                <span className="vehicle-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {v === 'Moto' ? <img src="/icons/moto.png" alt="Moto" width="28" height="28" style={{ objectFit: 'contain' }} /> 
                  : v === 'Tricycle' ? <img src="/icons/tricycle.png" alt="Tricycle" width="28" height="28" style={{ objectFit: 'contain' }} /> 
                  : <img src="/icons/voiture.png" alt="Voiture" width="28" height="28" style={{ objectFit: 'contain' }} />}
                </span>
                <span className="vehicle-label">{v}</span>
              </div>
            ))}
          </div>
        </div>




        <div className="form-group">
          <label className="form-label">Localisation GPS (Point d'attente) *</label>
          <div className="geo-status-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div className="geo-status-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div className="geo-status-details" style={{ flex: 1 }}>
                <h4>{geoStatus === 'success' ? 'Position enregistrée' : geoStatus === 'error' ? 'Saisie manuelle requise' : 'Détection GPS requise'}</h4>
                <p>{geoStatus === 'success' ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}` : 'Pour apparaître sur la carte, nous devons enregistrer votre position.'}</p>
              </div>
              {geoStatus !== 'error' && (
                <button type="button" className="btn btn-primary" onClick={handleGeolocation} style={{ width:'auto', padding:'8px 12px', fontSize:'0.8rem' }}>
                  {geoStatus === 'loading' ? 'Recherche...' : 'Me géolocaliser'}
                </button>
              )}
            </div>
            
            {geoStatus === 'error' && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-primary-red)', marginBottom: '8px' }}>
                  Échec du GPS. Veuillez sélectionner votre quartier :
                </p>
                <select 
                  className="form-input" 
                  style={{ width: '100%', padding: '12px' }}
                  onChange={(e) => {
                    const selected = ouagaQuartiers.find(q => q.name === e.target.value);
                    if (selected && selected.lat !== 0) {
                      setLocation({ lat: selected.lat, lng: selected.lng });
                      setGeoStatus('success');
                    }
                  }}
                  defaultValue=""
                >
                  {ouagaQuartiers.map(q => (
                    <option key={q.name} value={q.name} disabled={q.lat === 0}>{q.name}</option>
                  ))}
                </select>
                <button type="button" onClick={handleGeolocation} style={{ background: 'none', border: 'none', color: '#3498db', textDecoration: 'underline', marginTop: '10px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Réessayer la localisation automatique
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '15px' }}>
          <label className="form-label">Documents de vérification *</label>
          <div className="file-upload-grid">
            <div className="upload-box">
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cniRecto')} />
              <span className="upload-icon">🪪</span>
              <span className="upload-text">{files.cniRecto ? files.cniRecto.name : 'CNI Recto'}</span>
            </div>
            <div className="upload-box">
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'cniVerso')} />
              <span className="upload-icon">🪪</span>
              <span className="upload-text">{files.cniVerso ? files.cniVerso.name : 'CNI Verso'}</span>
            </div>
            <div className="upload-box">
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie')} />
              <span className="upload-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </span>
              <span className="upload-text">{files.selfie ? files.selfie.name : 'Selfie'}</span>
            </div>
          </div>
        </div>

        {error && !loading && (
          <div style={{ color: 'red', fontWeight: 'bold', marginTop: '15px', fontSize: '0.9rem' }}>
            ❌ {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:'16px', fontSize:'1rem', marginTop:'15px' }}>
          {loading ? (progress || 'Inscription en cours...') : 'Soumettre mon inscription'}
        </button>
      </form>
      
      <p className="driver-login-link" style={{ marginTop: '15px', textAlign: 'center' }}>
        Déjà inscrit ? <a href="#" onClick={(e) => { e.preventDefault(); onGoToLogin(); }}>Se connecter</a>
      </p>
    </div>
  );
}
