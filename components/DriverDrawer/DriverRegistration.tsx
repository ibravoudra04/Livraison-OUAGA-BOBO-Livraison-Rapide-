import React, { useState } from 'react';
import { useDriverOnboarding } from '@/hooks/useDriverOnboarding';

interface DriverRegistrationProps {
  onGoToLogin: () => void;
  onSuccess: () => void;
}

export default function DriverRegistration({ onGoToLogin, onSuccess }: DriverRegistrationProps) {
  const { registerDriver, loading, error } = useDriverOnboarding();

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setGeoStatus('success');
        },
        () => setGeoStatus('error')
      );
    } else {
      setGeoStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (geoStatus !== 'success') {
      alert("Veuillez patienter ou relancer la géolocalisation. Votre position est obligatoire.");
      return;
    }
    
    if (!files.cniRecto || !files.cniVerso || !files.selfie) {
      alert("Veuillez fournir toutes les photos demandées (CNI Recto, CNI Verso, et Selfie).");
      return;
    }
    
    const result = await registerDriver({
      ...formData,
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
          <div className="geo-status-card">
            <div className="geo-status-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div className="geo-status-details">
              <h4>{geoStatus === 'success' ? 'Position enregistrée' : 'Détection GPS requise'}</h4>
              <p>{geoStatus === 'success' ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}` : 'Pour apparaître sur la carte, nous devons enregistrer votre position.'}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleGeolocation} style={{ width:'auto', padding:'8px 12px', fontSize:'0.8rem' }}>
              {geoStatus === 'loading' ? 'Recherche...' : 'Me géolocaliser'}
            </button>
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

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:'16px', fontSize:'1rem', marginTop:'15px' }}>
          {loading ? 'Inscription en cours...' : 'Soumettre mon inscription'}
        </button>
      </form>
      
      <p className="driver-login-link" style={{ marginTop: '15px', textAlign: 'center' }}>
        Déjà inscrit ? <a href="#" onClick={(e) => { e.preventDefault(); onGoToLogin(); }}>Se connecter</a>
      </p>
    </div>
  );
}
