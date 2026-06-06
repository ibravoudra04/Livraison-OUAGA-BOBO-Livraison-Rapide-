'use client';

import React, { useState } from 'react';
import Header from '@/components/Header/Header';
import MapWrapper from '@/components/Map/MapWrapper';
import BottomSheet from '@/components/BottomSheet/BottomSheet';
import LivreurCard from '@/components/LivreurCard/LivreurCard';
import CustomToast, { ToastType } from '@/components/CustomToast/CustomToast';
import WelcomePortal from '@/components/WelcomePortal/WelcomePortal';
import LocationPortal from '@/components/LocationPortal/LocationPortal';
import DriverDrawer from '@/components/DriverDrawer/DriverDrawer';
import ClientDrawer from '@/components/ClientDrawer/ClientDrawer';
import PaymentSimulator from '@/components/PaymentSimulator/PaymentSimulator';
import ChatDrawer from '@/components/ChatDrawer/ChatDrawer';
import PwaInstallPrompt from '@/components/PwaInstallPrompt/PwaInstallPrompt';
import ReviewsModal from '@/components/ReviewsModal/ReviewsModal';
import AdminDashboard from '@/components/AdminDashboard/AdminDashboard';
import AuthDrawer from '@/components/AuthDrawer/AuthDrawer';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useLivreursRealtime } from '@/hooks/useLivreursRealtime';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function Home() {
  const { user, session, role, supabase } = useSupabaseAuth();
  const [selectedCity, setSelectedCity] = useState<string>('Ouagadougou');
  const { livreurs, loading: livreursLoading } = useLivreursRealtime(selectedCity);
  usePushNotifications();

  const [selectedLivreur, setSelectedLivreur] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLocationPortal, setShowLocationPortal] = useState(false);
  const [isDriverDrawerOpen, setIsDriverDrawerOpen] = useState(false);
  const [driverDrawerInitialView, setDriverDrawerInitialView] = useState<'login' | 'register'>('login');
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(200);
  const [paymentReason, setPaymentReason] = useState("");
  const [paymentCallback, setPaymentCallback] = useState<(() => Promise<void>) | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);
  const [hasPaidMapService, setHasPaidMapService] = useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const paid = sessionStorage.getItem('hasPaidMapService');
      if (paid === 'true') {
        setHasPaidMapService(true);
      }
    }
  }, []);

  const cityCenters = {
    'Ouagadougou': { lat: 12.3714, lng: -1.5197 },
    'Bobo-Dioulasso': { lat: 11.1771, lng: -4.2968 }
  };

  const handleMarkerClick = (livreur: any) => {
    setSelectedLivreur(livreur);
    setIsSheetOpen(true);
  };

  const handleLoginClick = () => {
    if (!user) {
      setIsAuthDrawerOpen(true);
    } else {
      if (role === 'admin') {
        setIsAdminDashboardOpen(true);
      } else if (role === 'rider') {
        setIsDriverDrawerOpen(true);
      } else {
        setIsClientDrawerOpen(true);
      }
    }
  };

  const handleCitySelect = (city: string, lat?: number, lng?: number) => {
    setSelectedCity(city);
    if (lat && lng) {
      setMapCenter({ lat, lng });
    } else {
      setMapCenter(null);
    }
    setShowLocationPortal(false);
    setShowWelcome(false);
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleLocateUser = () => {
    setIsLocating(true);
    
    const requestLocation = (highAccuracy: boolean) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setUserLocation({ lat, lng });
            setMapCenter({ lat, lng });
            const dOuaga = getDistance(lat, lng, cityCenters['Ouagadougou'].lat, cityCenters['Ouagadougou'].lng);
            const dBobo = getDistance(lat, lng, cityCenters['Bobo-Dioulasso'].lat, cityCenters['Bobo-Dioulasso'].lng);
            if (dBobo < dOuaga) {
              setSelectedCity('Bobo-Dioulasso');
            } else {
              setSelectedCity('Ouagadougou');
            }
            setToast({ message: "Position trouvée !", type: "success" });
            setIsLocating(false);
          },
          (error) => {
            if (error.code === 3 && highAccuracy) {
              requestLocation(false);
              return;
            }
            let errorMessage = "Localisation refusée ou introuvable";
            if (error.code === 1) errorMessage = "Permission refusée. Activez le GPS et autorisez le navigateur.";
            if (error.code === 2) errorMessage = "Position introuvable (signal faible).";
            if (error.code === 3) errorMessage = "Délai d'attente dépassé.";
            setToast({ message: errorMessage, type: "error" });
            setIsLocating(false);
          },
          { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 60000 }
        );
      } else {
        setToast({ message: "Géo-localisation non supportée", type: "error" });
        setIsLocating(false);
      }
    };
    
    requestLocation(true);
  };

  const handleDetectDriver = () => {
    if (livreurs.length === 0) {
      setToast({ message: "Aucun livreur disponible pour le moment.", type: "warning" });
      return;
    }
    
    // Position de référence : userLocation ou mapCenter ou le centre de la ville
    const refLat = userLocation?.lat || mapCenter?.lat || cityCenters[selectedCity as keyof typeof cityCenters].lat;
    const refLng = userLocation?.lng || mapCenter?.lng || cityCenters[selectedCity as keyof typeof cityCenters].lng;
    
    // Trouver le livreur le plus proche (parmi tous les livreurs connectés)
    let closest = livreurs[0];
    let minDist = getDistance(refLat, refLng, closest.lat, closest.lng);
    
    for(let i=1; i<livreurs.length; i++) {
      const d = getDistance(refLat, refLng, livreurs[i].lat, livreurs[i].lng);
      if (d < minDist) {
        minDist = d;
        closest = livreurs[i];
      }
    }
    
    // Rediriger la carte et ouvrir le profil
    setMapCenter({ lat: closest.lat, lng: closest.lng });
    setSelectedLivreur(closest);
    setIsSheetOpen(true);
  };

  const filteredLivreurs = livreurs.map(livreur => {
    if (!userLocation) return livreur;
    const dist = getDistance(userLocation.lat, userLocation.lng, livreur.lat, livreur.lng);
    return { ...livreur, distanceToUser: dist };
  }).filter(livreur => {
    if (!userLocation) return true;
    
    // Check if user is actually near Ouaga or Bobo
    const dOuaga = getDistance(userLocation.lat, userLocation.lng, cityCenters['Ouagadougou'].lat, cityCenters['Ouagadougou'].lng);
    const dBobo = getDistance(userLocation.lat, userLocation.lng, cityCenters['Bobo-Dioulasso'].lat, cityCenters['Bobo-Dioulasso'].lng);
    
    // If testing from abroad (> 100km away from any city), don't filter out by 5km so the map isn't empty
    if (dOuaga > 100 && dBobo > 100) return true;
    
    return livreur.distanceToUser <= 5;
  });

  React.useEffect(() => {
    const fetchAnnonce = async () => {
      try {
        const { data } = await supabase.from('annonces').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1);
        if (data && data.length > 0 && !sessionStorage.getItem('annonce_seen_' + data[0].id)) {
          setTimeout(() => {
            setToast({ message: "📢 " + data[0].message, type: "info" });
            sessionStorage.setItem('annonce_seen_' + data[0].id, 'true');
          }, 2000);
        }
      } catch (err) {
        // Ignore errors if table doesn't exist yet
      }
    };
    fetchAnnonce();
  }, [supabase]);

  const handleReportProblem = async () => {
    if (!user) {
      setToast({ message: "Veuillez vous connecter pour signaler un problème.", type: "warning" });
      setIsAuthDrawerOpen(true);
      return;
    }
    const reason = window.prompt("Veuillez décrire le problème rencontré avec ce livreur :");
    if (reason && reason.trim() !== '') {
      try {
        const { error } = await supabase.from('tickets_support').insert([{
          client_id: user.id,
          rider_id: selectedLivreur?.id,
          description: reason
        }]);
        if (error) throw error;
        setToast({ message: "Signalement envoyé. L'administrateur a été notifié.", type: "success" });
      } catch (err: any) {
        setToast({ message: "Erreur lors de l'envoi du signalement.", type: "error" });
      }
    }
  };

  const handlePayMapService = () => {
    setPaymentAmount(200);
    setPaymentReason("Accès complet à la carte des livreurs");
    setPaymentCallback(() => async () => {
      setHasPaidMapService(true);
      sessionStorage.setItem('hasPaidMapService', 'true');
      setToast({ message: "Paiement réussi ! Vous avez maintenant accès à tous les livreurs.", type: 'success' });
    });
    setIsPaymentOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {showWelcome && (
        <header className="main-header" style={{ position: 'relative', zIndex: 2000 }}>
          <a href="#" className="logo-container" id="logo-home" onClick={(e) => { e.preventDefault(); setShowWelcome(true); }}>
            <div className="logo-icon">
              <img src="/delivery_logo_premium.jpg" alt="Livraison Rapide Logo" className="logo-image" />
            </div>
            <h1 className="logo-text">Livraison<span>Rapide</span></h1>
          </a>
          <nav className="nav-buttons">
            {user ? (
              <button className="btn btn-secondary" onClick={handleLoginClick} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>Mon Compte</span>
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setIsAuthDrawerOpen(true)}>Se connecter</button>
            )}
          </nav>
        </header>
      )}

      <div style={{ flex: 1, position: 'relative' }}>
        
        {showWelcome && (
          <WelcomePortal 
            onStartSearch={() => {
              setShowWelcome(false);
              setShowLocationPortal(true);
            }}
            onRegisterClick={() => {
              setDriverDrawerInitialView('register');
              setIsDriverDrawerOpen(true);
            }}
          />
        )}

        {/* Switcher de ville (Ouaga / Bobo) avec le design d'origine */}
        {!showWelcome && (
          <>
            <button 
              onClick={() => setShowWelcome(true)}
              style={{ 
                position: 'absolute', 
                top: '15px', 
                left: '15px', 
                zIndex: 1000, 
                backgroundColor: 'rgba(255,255,255,0.95)', 
                border: '1px solid rgba(0,0,0,0.05)', 
                borderRadius: '12px', 
                width: '45px', 
                height: '45px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                color: '#8D5537',
                transition: 'transform 0.2s'
              }}
              aria-label="Retour à l'accueil"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </button>
            <div style={{ position: 'absolute', top: '15px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, pointerEvents: 'none' }}>
            <div className="city-switcher" id="city-selector" style={{ pointerEvents: 'auto', margin: 0, top: 0 }}>
              {Object.keys(cityCenters).map(city => (
                <button 
                  key={city}
                  className={`city-btn ${selectedCity === city ? 'active' : ''}`}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          </>
        )}

        {showLocationPortal && (
        <LocationPortal 
          onClose={() => {
            setShowLocationPortal(false);
            setShowWelcome(true);
          }} 
          onCitySelect={handleCitySelect}
          onAutoDetect={() => {
            return new Promise<void>((resolve) => {
              const requestLocation = (highAccuracy: boolean) => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const lat = position.coords.latitude;
                      const lng = position.coords.longitude;
                      setUserLocation({ lat, lng });
                      const dOuaga = getDistance(lat, lng, cityCenters['Ouagadougou'].lat, cityCenters['Ouagadougou'].lng);
                      const dBobo = getDistance(lat, lng, cityCenters['Bobo-Dioulasso'].lat, cityCenters['Bobo-Dioulasso'].lng);
                      if (dBobo < dOuaga) {
                        setSelectedCity('Bobo-Dioulasso');
                      } else {
                        setSelectedCity('Ouagadougou');
                      }
                      setToast({ message: "Position trouvée !", type: "success" });
                      setShowLocationPortal(false);
                      setShowWelcome(false);
                      resolve();
                    },
                    (error) => {
                      if (error.code === 3 && highAccuracy) {
                        requestLocation(false);
                        return;
                      }
                      let errorMessage = "Localisation refusée ou introuvable";
                      if (error.code === 1) errorMessage = "Permission refusée. Activez le GPS et autorisez le navigateur.";
                      if (error.code === 2) errorMessage = "Position introuvable (signal faible).";
                      if (error.code === 3) errorMessage = "Délai d'attente dépassé.";
                      setToast({ message: errorMessage, type: "error" });
                      resolve();
                    },
                    { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 60000 }
                  );
                } else {
                  setToast({ message: "Géo-localisation non supportée", type: "error" });
                  resolve();
                }
              };
              requestLocation(true);
            });
          }}
        />
      )}

        {/* Indicateur de livreurs en ligne */}
        {!showWelcome && (
          <div className="map-info-badge" id="online-counter-badge">
            <div className="pulse-dot"></div>
            <span id="online-counter-text">{livreurs?.length || 0} livreurs disponibles</span>
          </div>
        )}

        {/* Bouton de recalibrage de position sur la carte */}
        {!showWelcome && (
          <button className="map-locate-btn" id="map-locate-btn" aria-label="Ma position actuelle" onClick={handleLocateUser} style={{ opacity: isLocating ? 0.5 : 1 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>
          </button>
        )}

        {/* Bouton "Détecter un livreur" et "Me localiser" */}
        {!showWelcome && !showLocationPortal && (
          <div style={{ position: 'absolute', bottom: '110px', left: '0', right: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 1000, pointerEvents: 'none' }}>
            
            <button 
              className="btn btn-primary pulse"
              onClick={handleDetectDriver}
              style={{ pointerEvents: 'auto', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 8px 25px rgba(232, 92, 74, 0.4)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', background: 'var(--color-primary-red)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>Détecter un livreur</span>
            </button>

            <button 
              className="btn btn-secondary"
              onClick={handleLocateUser}
              disabled={isLocating}
              style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', color: 'var(--color-charcoal)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
              <span>{isLocating ? "Recherche..." : "Me localiser"}</span>
            </button>
            
          </div>
        )}

        <div style={{ width: '100%', height: '100%', filter: (!hasPaidMapService && role !== 'admin' && role !== 'rider') ? 'blur(12px) saturate(150%)' : 'none', pointerEvents: (!hasPaidMapService && role !== 'admin' && role !== 'rider') ? 'none' : 'auto', transition: 'filter 0.5s' }}>
          <MapWrapper 
            livreurs={filteredLivreurs} 
            cityCenter={mapCenter || cityCenters[selectedCity as keyof typeof cityCenters] || cityCenters['Ouagadougou']} 
            onMarkerClick={handleMarkerClick} 
          />
        </div>

        {(!hasPaidMapService && role !== 'admin' && role !== 'rider' && !showWelcome && !showLocationPortal) && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.1)' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(20px)', padding: '30px', borderRadius: '24px', boxShadow: '0 24px 70px rgba(54, 42, 33, 0.2)', border: '1px solid rgba(255, 255, 255, 0.6)', textAlign: 'center', maxWidth: '90%', width: '340px' }}>
              <div style={{ width: '60px', height: '60px', background: 'var(--color-primary-brown)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'white', boxShadow: '0 4px 15px rgba(141, 85, 55, 0.4)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <h2 style={{ color: 'var(--color-primary-brown)', fontSize: '1.4rem', marginBottom: '10px' }}>Service Premium</h2>
              <p style={{ color: 'var(--color-charcoal)', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5', fontWeight: '500' }}>Découvrez en temps réel tous les livreurs disponibles autour de vous et accédez à leurs contacts.</p>
              
              <button 
                className="btn pulse" 
                onClick={handlePayMapService}
                style={{ width: '100%', background: 'var(--color-primary-green)', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 25px rgba(39, 174, 96, 0.4)', cursor: 'pointer' }}
              >
                Utiliser le service 200 FCFA
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
        {selectedLivreur && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 5px' }}>
            {/* Header: Photo, Info, Status */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                {selectedLivreur.selfie ? (
                  <img src={selectedLivreur.selfie} alt={selectedLivreur.first_name || selectedLivreur.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-primary-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {(selectedLivreur.first_name || selectedLivreur.name || 'L').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-brown)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selectedLivreur.first_name || selectedLivreur.name}
                    {selectedLivreur.is_verified && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#3498db" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><title>Profil Vérifié</title><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    )}
                  </h3>
                  <span style={{ backgroundColor: '#e6f4ea', color: '#1e8e3e', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div className="pulse-dot" style={{ width: '6px', height: '6px', background: '#1e8e3e' }}></div>
                    Disponible
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-charcoal)', fontSize: '0.85rem', marginTop: '4px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px' }}>
                    {(selectedLivreur.transport_type || selectedLivreur.vehicle || 'Moto').toLowerCase().includes('moto') ? <img src="/icons/moto.png" alt="Moto" width="20" height="20" style={{ objectFit: 'contain' }} /> : 
                     (selectedLivreur.transport_type || selectedLivreur.vehicle || '').toLowerCase().includes('tricycle') ? <img src="/icons/tricycle.png" alt="Tricycle" width="20" height="20" style={{ objectFit: 'contain' }} /> : 
                     (selectedLivreur.transport_type || selectedLivreur.vehicle || '').toLowerCase().includes('voiture') ? <img src="/icons/voiture.png" alt="Voiture" width="20" height="20" style={{ objectFit: 'contain' }} /> : <span style={{fontSize: '14px'}}>🚚</span>}
                  </span>
                  {selectedLivreur.transport_type || selectedLivreur.vehicle || 'Moto 135cc'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }} onClick={() => setIsReviewsModalOpen(true)}>
                  <span style={{ color: 'var(--color-primary-yellow)', fontSize: '0.9rem' }}>{'★'.repeat(Math.round(selectedLivreur.average_rating || 5))}{'☆'.repeat(5 - Math.round(selectedLivreur.average_rating || 5))}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem', marginLeft: '4px' }}>{Number(selectedLivreur.average_rating || 5).toFixed(1)}</span>
                  <span style={{ color: 'var(--color-charcoal-muted)', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}>({selectedLivreur.reviews_count || 0} avis)</span>
                </div>
              </div>
            </div>

            {/* Badges: Distance & Phone */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-charcoal-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Distance</div>
                <div style={{ fontWeight: 'bold', color: 'var(--color-charcoal)', fontSize: '0.9rem' }}>
                  {selectedLivreur.distanceToUser !== undefined ? `À ${selectedLivreur.distanceToUser.toFixed(1)} km` : 'À calculer...'}
                </div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-charcoal-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Téléphone</div>
                <div style={{ fontWeight: 'bold', color: 'var(--color-charcoal)', fontSize: '0.9rem' }}>{selectedLivreur.phone}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
              <button 
                style={{ flex: 1, padding: '14px', borderRadius: '50px', background: 'var(--color-primary-red)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.25)', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(232, 92, 74, 0.3)', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                onClick={() => { window.location.href = `tel:${selectedLivreur.phone}`; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Appeler
              </button>
              <button 
                style={{ flex: 1, padding: '14px', borderRadius: '50px', background: 'var(--color-primary-green)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.25)', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                onClick={() => {
                  if (!user) {
                    setToast({ message: "Veuillez créer un compte ou vous connecter pour discuter.", type: "warning" });
                    setIsAuthDrawerOpen(true);
                  } else {
                    setIsChatDrawerOpen(true);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Discuter (Chat)
              </button>
            </div>

            {/* Link to report problem */}
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button onClick={handleReportProblem} style={{ background: 'none', border: 'none', color: 'var(--color-charcoal-muted)', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}>
                Signaler un problème avec ce livreur
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      <DriverDrawer 
        isOpen={isDriverDrawerOpen}
        onClose={() => setIsDriverDrawerOpen(false)}
        initialView={driverDrawerInitialView}
      />

      <ClientDrawer 
        isOpen={isClientDrawerOpen}
        onClose={() => setIsClientDrawerOpen(false)}
        onSimulatePremium={() => {
          setPaymentAmount(5000);
          setPaymentReason("Abonnement Premium Client");
          setPaymentCallback(() => async () => {
             // Logic to upgrade client in DB
             const { error } = await supabase.from('clients_livraison')
               .update({ subscription_paid: true })
               .eq('id', user?.id);
             if (error) throw error;
             setToast({ message: "Abonnement Premium activé !", type: 'success' });
             setIsClientDrawerOpen(false);
          });
          setIsPaymentOpen(true);
        }}
        onSearch={() => {
          setIsClientDrawerOpen(false);
          setShowWelcome(false);
          setShowLocationPortal(true);
        }}
        onChatRider={(riderId, riderName) => {
          setSelectedLivreur({ id: riderId, name: riderName });
          setIsClientDrawerOpen(false);
          setIsChatDrawerOpen(true);
        }}
      />
      {showWelcome && (
        <footer style={{ flexShrink: 0, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderTop: '1px solid rgba(0,0,0,0.05)', padding: '12px 0' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="https://wa.me/22667370909" target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#66554D', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              WhatsApp Support
            </a>
            <a href="tel:+22667370909" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#66554D', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Support Téléphonique
            </a>
          </div>
        </footer>
      )}

      <PwaInstallPrompt />

      {selectedLivreur && user && (
        <ChatDrawer 
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          riderId={selectedLivreur.id}
          clientId={user.id}
          currentRole={role === 'client' ? 'client' : 'rider'}
          otherPartyName={selectedLivreur.name || selectedLivreur.first_name}
        />
      )}

      {selectedLivreur && (
        <ReviewsModal 
          isOpen={isReviewsModalOpen}
          onClose={() => setIsReviewsModalOpen(false)}
          riderId={selectedLivreur.id}
          riderRating={selectedLivreur.average_rating || 5.0}
          riderReviewsCount={selectedLivreur.reviews_count || 0}
          user={user}
        />
      )}

      <AdminDashboard 
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        isAdmin={role === 'admin'}
      />

      <AuthDrawer 
        isOpen={isAuthDrawerOpen}
        onClose={() => setIsAuthDrawerOpen(false)}
        onLoginSuccess={(userId, loggedInRole) => {
          setToast({ message: "Connexion réussie ! Bienvenue.", type: 'success' });
          if (loggedInRole === 'rider') {
             setIsDriverDrawerOpen(true);
          } else if (loggedInRole === 'admin') {
             setIsAdminDashboardOpen(true);
          } else {
             setIsClientDrawerOpen(true);
          }
        }}
      />

      <PaymentSimulator 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={paymentAmount}
        reasonText={paymentReason}
        onPaymentSuccess={async () => {
          if (paymentCallback) {
            await paymentCallback();
            setIsPaymentOpen(false);
          }
        }}
      />

      {toast && (
        <CustomToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
