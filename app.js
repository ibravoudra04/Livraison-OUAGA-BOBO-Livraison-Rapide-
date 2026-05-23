// Application Logic for "Livraison Rapide"
// Powered by Vanilla JavaScript + Leaflet.js

document.addEventListener('DOMContentLoaded', () => {

    const STATE = {
        currentCity: 'ouaga', // 'ouaga' or 'bobo'
        selectedRider: null,
        clientCoordinates: null, // Holds coordinates {lat, lng} of visitor if geolocated
        unlockedRiders: new Set(), // Set of rider IDs that have been unlocked
        clickedRiders: new Set(), // Set of unique rider IDs viewed this session (limit 5)
        pendingServiceUnlock: null, // Rider that triggered the 5-profile limit unlock modal
        pendingSubscriptionUnlock: false, // Flag when a driver is paying their subscription
        pendingClientSubscriptionUnlock: false, // Flag when a client is paying their subscription
        pendingWalletRecharge: false, // Flag when a driver is recharging their wallet balance
        activeOTPCode: null, // Store active SMS OTP code
        activeOTPPhone: null, // Store active SMS OTP phone
        loggedDriver: null, // The currently logged-in driver profile
        loggedClient: null, // The currently logged-in client profile
        isAdmin: false, // Flag showing if logged in as administrator
        totalViewedProfiles: 0, // Counter of profile clicks for stats
        selectedProvider: 'Orange Money', // Payment provider
        totalUnlocks: 0,
        totalRevenue: 0,
        totalMessages: 0,
        unreadAdminCount: 0,
        chats: {}, // riderId -> array of messages { sender: 'client'|'rider', text: string, time: string }
        map: null,
        pickerMap: null,
        pickerMarker: null,
        markers: [],
        clients: [
            { phone: '+226 76 00 00 01', password: '123', name: 'Zakarie Kaboré', subscriptionPaid: true, viewedDrivers: new Set(['o1', 'o2']), contactedDrivers: new Set(['o1']) },
            { phone: '+226 70 99 99 99', password: '123', name: 'Alida Sawadogo', subscriptionPaid: false, viewedDrivers: new Set(), contactedDrivers: new Set() }
        ],
        riders: {
            ouaga: [
                { id: 'o1', name: 'Idrissa Sawadogo', vehicle: 'Moto 135cc', distance: '0.4 km', phone: '+226 76 45 82 10', lat: 12.3685, lng: -1.5152, initial: 'IS', contactsCount: 4, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 15, rating: 4.8, reviews: [{ text: "Très rapide et courtois !", stars: 5, date: "Hier" }, { text: "Colis livré en bon état.", stars: 4.5, date: "Il y a 3 jours" }] },
                { id: 'o2', name: 'Moussa Kaboré', vehicle: 'Scooter Crypton', distance: '1.8 km', phone: '+226 70 89 41 23', lat: 12.3552, lng: -1.5024, initial: 'MK', contactsCount: 2, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 8, rating: 4.9, reviews: [{ text: "Super service ! Je recommande.", stars: 5, date: "Hier" }] },
                { id: 'o3', name: 'Alassane Diallo', vehicle: 'Moto 150cc', distance: '3.2 km', phone: '+226 77 12 34 56', lat: 12.3391, lng: -1.5304, initial: 'AD', contactsCount: 5, subscriptionPaid: false, status: 'suspendu', password: '1234', viewsCount: 22, rating: 4.2, reviews: [{ text: "Un peu de retard mais très poli.", stars: 4, date: "Il y a 1 semaine" }] },
                { id: 'o4', name: 'Abdoulaye Ouédraogo', vehicle: 'Moto 135cc', distance: '4.1 km', phone: '+226 65 77 88 99', lat: 12.3854, lng: -1.5412, initial: 'AO', contactsCount: 1, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 6, rating: 4.7, reviews: [{ text: "Excellent !", stars: 5, date: "Hier" }] },
                { id: 'o5', name: 'Adama Sanou', vehicle: 'Scooter Crypton', distance: '3.9 km', phone: '+226 71 50 60 70', lat: 12.3920, lng: -1.4985, initial: 'AS', contactsCount: 5, subscriptionPaid: true, status: 'actif', password: '1234', viewsCount: 30, rating: 5.0, reviews: [{ text: "Le meilleur livreur de Ouaga !", stars: 5, date: "Il y a 2 jours" }, { text: "Service impeccable.", stars: 5, date: "Il y a 5 jours" }] },
                { id: 'o6', name: 'Yacouba Traoré', vehicle: 'Vélo / VTT', distance: '2.5 km', phone: '+226 76 99 88 77', lat: 12.3582, lng: -1.5540, initial: 'YT', contactsCount: 0, subscriptionPaid: false, status: 'en attente', password: '1234', viewsCount: 3, rating: 4.6, reviews: [] },
                { id: 'o7', name: 'Cheick Barry', vehicle: 'Moto 135cc', distance: '0.9 km', phone: '+226 72 11 22 33', lat: 12.3732, lng: -1.5285, initial: 'CB', contactsCount: 3, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 12, rating: 4.5, reviews: [{ text: "Très bon service.", stars: 4.5, date: "Hier" }] },
                { id: 'o8', name: 'Boubacar Sidibé', vehicle: 'Scooter', distance: '1.1 km', phone: '+226 66 55 44 33', lat: 12.3601, lng: -1.5212, initial: 'BS', contactsCount: 4, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 19, rating: 4.9, reviews: [{ text: "Rapide et efficace.", stars: 5, date: "Hier" }] }
            ],
            bobo: [
                { id: 'b1', name: 'Sékou Sangaré', vehicle: 'Moto 135cc', distance: '0.6 km', phone: '+226 76 11 22 99', lat: 11.1812, lng: -4.2924, initial: 'SS', contactsCount: 4, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 14, rating: 4.8, reviews: [{ text: "Parfait pour Bobo-Dioulasso !", stars: 5, date: "Hier" }] },
                { id: 'b2', name: 'Drissa Barro', vehicle: 'Scooter Crypton', distance: '2.2 km', phone: '+226 70 54 87 21', lat: 11.1685, lng: -4.2854, initial: 'DB', contactsCount: 1, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 9, rating: 4.7, reviews: [] },
                { id: 'b3', name: 'Issouf Dao', vehicle: 'Moto 150cc', distance: '2.8 km', phone: '+226 77 98 65 32', lat: 11.1942, lng: -4.3120, initial: 'ID', contactsCount: 5, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 16, rating: 4.3, reviews: [{ text: "Bon service.", stars: 4, date: "Hier" }] },
                { id: 'b4', name: 'Hamidou Coulibaly', vehicle: 'Scooter', distance: '1.1 km', phone: '+226 65 33 22 11', lat: 11.1714, lng: -4.3054, initial: 'HC', contactsCount: 2, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 11, rating: 4.9, reviews: [{ text: "Super sympa et efficace.", stars: 5, date: "Hier" }] },
                { id: 'b5', name: 'Karim Sanogo', vehicle: 'Vélo / VTT', distance: '1.9 km', phone: '+226 71 88 55 44', lat: 11.1852, lng: -4.3214, initial: 'KS', contactsCount: 3, subscriptionPaid: false, status: 'actif', password: '1234', viewsCount: 13, rating: 4.6, reviews: [{ text: "Très courageux en vélo.", stars: 5, date: "Hier" }] },
                { id: 'b6', name: 'Ousmane Ouattara', vehicle: 'Moto 135cc', distance: '1.5 km', phone: '+226 72 32 11 00', lat: 11.1620, lng: -4.2995, initial: 'OO', contactsCount: 5, subscriptionPaid: true, status: 'actif', password: '1234', viewsCount: 25, rating: 5.0, reviews: [{ text: "Excellent service à Bobo !", stars: 5, date: "Hier" }] }
            ]
        },
        cityCenters: {
            ouaga: { lat: 12.3714, lng: -1.5197, name: 'Ouagadougou' },
            bobo: { lat: 11.1774, lng: -4.2983, name: 'Bobo-Dioulasso' }
        },
        sectors: {
            ouaga: [
                { name: 'Patte d\'Oie', lat: 12.3552, lng: -1.5024, riderId: 'o2' },
                { name: 'Wemtenga', lat: 12.3685, lng: -1.5152, riderId: 'o1' },
                { name: 'Somgandé', lat: 12.3920, lng: -1.4985, riderId: 'o5' },
                { name: 'Koulouba', lat: 12.3732, lng: -1.5285, riderId: 'o7' },
                { name: 'Gounghin', lat: 12.3601, lng: -1.5212, riderId: 'o8' },
                { name: 'Pissy', lat: 12.3582, lng: -1.5540, riderId: 'o6' },
                { name: 'Zogona', lat: 12.3391, lng: -1.5304, riderId: 'o3' },
                { name: 'Tampouy', lat: 12.3854, lng: -1.5412, riderId: 'o4' }
            ],
            bobo: [
                { name: 'Belleville', lat: 11.1852, lng: -4.3214, riderId: 'b5' },
                { name: 'Accart-ville', lat: 11.1812, lng: -4.2924, riderId: 'b1' },
                { name: 'Bolomakoté', lat: 11.1685, lng: -4.2854, riderId: 'b2' },
                { name: 'Colma', lat: 11.1620, lng: -4.2995, riderId: 'b6' },
                { name: 'Sarfalao', lat: 11.1942, lng: -4.3120, riderId: 'b3' },
                { name: 'Koko', lat: 11.1714, lng: -4.3054, riderId: 'b4' }
            ]
        }
    };

    // --- DOM ELEMENTS ---
    const welcomePortal = document.getElementById('welcome-portal');
    const mainFooter = document.getElementById('main-footer');
    const portalBtnFind = document.getElementById('portal-btn-find');
    const portalBtnRegister = document.getElementById('portal-btn-register');
    
    // Sleek Unified Auth modal elements
    const authModal = document.getElementById('auth-modal');
    const btnNavLogin = document.getElementById('btn-nav-login');
    const btnCloseAuth = document.getElementById('btn-close-auth');
    
    const authLoginPanel = document.getElementById('auth-login-panel');
    const authLoginForm = document.getElementById('auth-login-form');
    const authLoginPhone = document.getElementById('auth-login-phone');
    const authLoginPassword = document.getElementById('auth-login-password');
    const linkToClientRegister = document.getElementById('link-to-client-register');
    const linkToDriverRegister = document.getElementById('link-to-driver-register');
    
    const authClientRegisterSection = document.getElementById('auth-client-register-section');
    const authClientRegisterForm = document.getElementById('auth-client-register-form');
    const authClientRegisterPhone = document.getElementById('auth-client-register-phone');
    const authClientRegisterPassword = document.getElementById('auth-client-register-password');
    const linkToLoginPanel = document.getElementById('link-to-login-panel');

    // Espace Client Drawer elements
    const clientDrawer = document.getElementById('client-drawer');
    const btnCloseClientDrawer = document.getElementById('btn-close-client-drawer');
    const clientDashPhone = document.getElementById('client-dash-phone');
    const clientViewedList = document.getElementById('client-viewed-list');
    const clientContactedList = document.getElementById('client-contacted-list');
    const clientChatsList = document.getElementById('client-chats-list');
    const btnClientLogout = document.getElementById('btn-client-logout');
    
    // Sleek Admin Dashboard elements
    const adminDashboardView = document.getElementById('admin-dashboard-view');
    const btnAdminLogoutSession = document.getElementById('btn-admin-logout-session');
    
    // Espace Livreur DOM Elements
    const driverRegisterPanel = document.getElementById('driver-register-panel');
    const driverLoginPanel = document.getElementById('driver-login-panel');
    const driverDashboardPanel = document.getElementById('driver-dashboard-panel');
    const linkToLogin = document.getElementById('link-to-login');
    const linkToRegister = document.getElementById('link-to-register');
    const driverLoginForm = document.getElementById('driver-login-form');
    const btnDriverLogout = document.getElementById('btn-driver-logout');
    const btnDriverPaySub = document.getElementById('btn-driver-pay-sub');
    const btnDriverSimulateContact = document.getElementById('btn-driver-simulate-contact');
    
    const citySelector = document.getElementById('city-selector');
    const onlineCounterBadge = document.getElementById('online-counter-badge');

    const cityButtons = document.querySelectorAll('.city-btn');
    const onlineCounterText = document.getElementById('online-counter-text');
    const navBtnFind = document.getElementById('btn-nav-find');
    const navBtnRegister = document.getElementById('btn-nav-register');
    
    // Bottom Sheet (Rider details)
    const riderSheet = document.getElementById('rider-sheet');
    const btnCloseSheet = document.getElementById('btn-close-sheet');
    const sheetAvatar = document.getElementById('sheet-rider-avatar');
    const sheetName = document.getElementById('sheet-rider-name');
    const sheetVehicle = document.getElementById('sheet-rider-vehicle');
    const sheetDistance = document.getElementById('sheet-rider-distance');
    const sheetPhoneMasked = document.getElementById('sheet-rider-phone-masked');
    const btnUnlockContact = document.getElementById('btn-unlock-contact');
    const btnCallRider = document.getElementById('btn-call-rider');
    const btnChatRider = document.getElementById('btn-chat-rider');
    
    // Bottom Sheet Ratings & Reviews Modal Elements
    const sheetRiderRatingTrigger = document.getElementById('sheet-rider-rating-trigger');
    const sheetRiderStars = document.getElementById('sheet-rider-stars');
    const sheetRiderRatingVal = document.getElementById('sheet-rider-rating-val');
    const sheetRiderReviewsCount = document.getElementById('sheet-rider-reviews-count');
    const reviewsModal = document.getElementById('reviews-modal');
    const btnCloseReviews = document.getElementById('btn-close-reviews');
    const reviewsModalAvgVal = document.getElementById('reviews-modal-avg-val');
    const reviewsModalCountDesc = document.getElementById('reviews-modal-count-desc');
    const reviewsModalStars = document.getElementById('reviews-modal-stars');
    const reviewsModalList = document.getElementById('reviews-modal-list');

    // Chat Drawer elements
    const chatDrawer = document.getElementById('chat-drawer');
    const btnCloseChat = document.getElementById('btn-close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendForm = document.getElementById('chat-send-form');
    const chatDriverAvatar = document.getElementById('chat-driver-avatar');
    const chatDriverName = document.getElementById('chat-driver-name');
    const chatDriverNameSystem = document.getElementById('chat-driver-name-system');
    const chatTypingIndicator = document.getElementById('chat-typing-indicator');
    const chatTypingDriverName = document.getElementById('chat-typing-driver-name');

    // Admin Dashboard elements
    const btnAdminFloating = document.getElementById('btn-admin-floating') || document.createElement('div');
    const adminChatBadge = document.getElementById('admin-chat-badge') || document.createElement('div');
    const adminModal = document.getElementById('admin-modal');
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    const tabChats = document.getElementById('tab-chats');
    const tabDrivers = document.getElementById('tab-drivers');
    const tabStats = document.getElementById('tab-stats');
    const adminChatsSection = document.getElementById('admin-chats-section');
    const adminDriversSection = document.getElementById('admin-drivers-section');
    const adminStatsSection = document.getElementById('admin-stats-section');
    const adminChatSessions = document.getElementById('admin-chat-sessions');
    const adminInspector = document.getElementById('admin-inspector');
    const btnInspectorBack = document.getElementById('btn-inspector-back');
    const inspectorTitle = document.getElementById('inspector-title');
    const inspectorMessagesList = document.getElementById('inspector-messages-list');
    const statTotalUnlocks = document.getElementById('stat-total-unlocks');
    const statTotalRevenue = document.getElementById('stat-total-revenue');
    const statTotalDrivers = document.getElementById('stat-total-drivers');
    const statTotalMessages = document.getElementById('stat-total-messages');

    // Payment Modal
    const paymentModal = document.getElementById('payment-modal');
    const btnClosePaymentModal = document.getElementById('btn-close-payment-modal');
    const methodOrange = document.getElementById('method-orange');
    const methodMoov = document.getElementById('method-moov');
    const momoPhoneInput = document.getElementById('momo-phone');
    const btnSubmitMomo = document.getElementById('btn-submit-momo');
    
    // Payment Steps
    const paymentFormStep = document.getElementById('payment-form-step');
    const paymentUssdStep = document.getElementById('payment-ussd-step');
    const paymentSuccessStep = document.getElementById('payment-success-step');
    
    // USSD simulation Screen elements
    const ussdProviderTitle = document.getElementById('ussd-provider-title');
    const ussdPinInput = document.getElementById('ussd-pin');
    const btnUssdCancel = document.getElementById('btn-ussd-cancel');
    const btnUssdConfirm = document.getElementById('btn-ussd-confirm');
    const ussdLoader = document.getElementById('ussd-loader');
    const btnViewUnlockedRider = document.getElementById('btn-view-unlocked-rider');

    // Onboarding Drawer (Driver registration)
    const driverDrawer = document.getElementById('driver-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const driverForm = document.getElementById('driver-register-form');
    const driverSuccessPanel = document.getElementById('driver-success-panel');
    const btnReturnMap = document.getElementById('btn-return-map');
    const lblPickerCity = document.getElementById('lbl-picker-city');
    const gpsStatusDesc = document.getElementById('gps-status-desc');

    // Geolocation DOM elements
    const geoStatusCard = document.getElementById('geo-status-card');
    const btnGeoLocate = document.getElementById('btn-geo-locate');
    const geoLoader = document.getElementById('geo-loader');
    const mapPickerWrapper = document.getElementById('map-picker-wrapper');
    const gpsFallbackHint = document.getElementById('gps-fallback-hint');
    const lblPickerStatus = document.getElementById('lbl-picker-status');
    const driverLatInput = document.getElementById('driver-lat');
    const driverLngInput = document.getElementById('driver-lng');

    // Onboarding file inputs & vehicle selection
    const uploadCniRecto = document.getElementById('upload-cni-recto');
    const uploadCniVerso = document.getElementById('upload-cni-verso');
    const uploadSelfie = document.getElementById('upload-selfie');
    const previewCniRecto = document.getElementById('preview-cni-recto');
    const previewCniVerso = document.getElementById('preview-cni-verso');
    const previewSelfie = document.getElementById('preview-selfie');
    const boxUploadCniRecto = document.getElementById('box-upload-cni-recto');
    const boxUploadCniVerso = document.getElementById('box-upload-cni-verso');
    const boxUploadSelfie = document.getElementById('box-upload-selfie');
    const btnRemoveCniRecto = document.getElementById('btn-remove-cni-recto');
    const btnRemoveCniVerso = document.getElementById('btn-remove-cni-verso');
    const btnRemoveSelfie = document.getElementById('btn-remove-selfie');
    const vehicleOptions = document.querySelectorAll('.vehicle-option');

    // Premium enhancements handles
    const authMethodTabs = document.getElementById('auth-method-tabs');
    const tabAuthPassword = document.getElementById('tab-auth-password');
    const tabAuthOtp = document.getElementById('tab-auth-otp');
    const authOtpPanel = document.getElementById('auth-otp-panel');
    const authOtpForm = document.getElementById('auth-otp-form');
    const authOtpPhoneInput = document.getElementById('auth-otp-phone');
    const authOtpCodeInput = document.getElementById('auth-otp-code');
    const btnSendOtp = document.getElementById('btn-send-otp');
    const otpPhoneGroup = document.getElementById('otp-phone-group');
    const otpCodeGroup = document.getElementById('otp-code-group');
    
    const smsOtpToast = document.getElementById('sms-otp-toast');
    const smsOtpToastBody = document.getElementById('sms-otp-toast-body');
    
    const btnDriverRechargeWallet = document.getElementById('btn-driver-recharge-wallet');
    const btnDriverPaySubWallet = document.getElementById('btn-driver-pay-sub-wallet');
    const driverDashWalletVal = document.getElementById('driver-dash-wallet-val');
    
    const chatQuickReplies = document.getElementById('chat-quick-replies');

    let driverSelectedVehicle = 'Moto'; // Default selected vehicle
    let mapInitialized = false;

    // --- INITIALIZE MAPS ---
    function initMainMap() {
        let center = STATE.cityCenters[STATE.currentCity];
        let zoom = 13;

        if (STATE.clientCoordinates) {
            center = STATE.clientCoordinates;
            zoom = 14;
        }

        // Leaflet options - disabled inertia for snap responses on mobile
        STATE.map = L.map('map', {
            zoomControl: false, // Custom position or fallback
            attributionControl: false // Styled minimal foot
        }).setView([center.lat, center.lng], zoom);

        // CartoDB Positron - Beautiful minimalist Light gray tiles (ideal for Wave UI look)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            minZoom: 10
        }).addTo(STATE.map);

        // Add standard zoom control at top-right
        L.control.zoom({
            position: 'topleft'
        }).addTo(STATE.map);

        // Add pulsing blue location beacon representing the client
        if (STATE.clientCoordinates) {
            const beaconIcon = L.divIcon({
                className: 'client-location-beacon-container',
                html: `<div class="client-beacon-pulse"></div><div class="client-beacon-core"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            L.marker([STATE.clientCoordinates.lat, STATE.clientCoordinates.lng], {
                icon: beaconIcon
            }).addTo(STATE.map).bindPopup("<b>📍 Vous êtes ici</b><br>Recherche de livreurs autour de vous.");
        }

        // Load riders markers
        renderRiders();
    }

    function renderRiders() {
        // Clear old markers
        STATE.markers.forEach(m => STATE.map.removeLayer(m));
        STATE.markers = [];

        const cityRiders = STATE.riders[STATE.currentCity];
        
        // Filter out drivers based on active status
        let visibleRiders = cityRiders.filter(rider => {
            const count = rider.contactsCount || 0;
            const paid = rider.subscriptionPaid || false;
            
            // Auto update status if not set or modified
            if (!rider.status) {
                if (count >= 5 && !paid) {
                    rider.status = 'suspendu';
                } else {
                    rider.status = 'actif';
                }
            }
            
            return rider.status === 'actif';
        });

        // If client is geolocated, ONLY show drivers in proximity (e.g. within 5 km)
        if (STATE.clientCoordinates) {
            visibleRiders = visibleRiders.filter(rider => {
                const dist = getDistance(STATE.clientCoordinates.lat, STATE.clientCoordinates.lng, rider.lat, rider.lng);
                // Save computed distance dynamically for bottom sheet display
                rider.distance = `${dist.toFixed(1)} km`;
                return dist <= 5.0; // Proximity filter radius
            });
        }
        
        // Update Counter with active drivers
        onlineCounterText.innerText = `${visibleRiders.length} livreurs disponibles`;

        visibleRiders.forEach(rider => {
            // Elegant green glowing pulse dot
            const customIcon = L.divIcon({
                className: 'custom-marker-wrapper',
                html: `<div class="rider-pin" id="marker-${rider.id}"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([rider.lat, rider.lng], { icon: customIcon }).addTo(STATE.map);
            
            // Add click listener on rider pins
            marker.on('click', (e) => {
                selectRider(rider);
                
                // Center map slightly offset to look perfect with bottom sheet open
                const mapCenter = STATE.map.project(e.latlng, STATE.map.getZoom());
                // Offset by 150px vertically depending on screen size
                const offset = window.innerWidth < 768 ? 160 : 0;
                mapCenter.y += offset;
                
                STATE.map.panTo(STATE.map.unproject(mapCenter, STATE.map.getZoom()), {
                    animate: true,
                    duration: 0.6
                });
            });

            STATE.markers.push(marker);
        });
    }

    // Centering and switching between cities
    function switchCity(city) {
        if (STATE.currentCity === city) return;
        STATE.currentCity = city;

        // Close bottom drawer
        closeRiderSheet();

        // Active button styles
        cityButtons.forEach(btn => {
            if (btn.getAttribute('data-city') === city) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Pan map smoothly to the new city center
        const center = STATE.cityCenters[city];
        STATE.map.setView([center.lat, center.lng], 13, {
            animate: true,
            pan: { duration: 1 }
        });

        // Redraw riders
        renderRiders();

        // Update driver registration picker city text
        lblPickerCity.innerText = STATE.cityCenters[city].name;
        if (STATE.pickerMap) {
            STATE.pickerMap.setView([center.lat, center.lng], 13);
            if (STATE.pickerMarker) {
                STATE.pickerMarker.setLatLng([center.lat, center.lng]);
                updateGpsLabel(center.lat, center.lng);
            }
        }
    }

    let hasGpsLocation = false;

    // Initialize Map Picker for driver registration
    function initPickerMap(lat, lng, isLocked) {
        const targetLat = lat !== undefined ? lat : STATE.cityCenters[STATE.currentCity].lat;
        const targetLng = lng !== undefined ? lng : STATE.cityCenters[STATE.currentCity].lng;

        if (STATE.pickerMap) {
            // Already initialized, just center it and update pin
            STATE.pickerMap.setView([targetLat, targetLng], 15);
            if (STATE.pickerMarker) {
                STATE.pickerMarker.setLatLng([targetLat, targetLng]);
            }
            
            // Adjust dragging and map clicks depending on locked status
            if (STATE.pickerMarker) {
                if (isLocked) {
                    STATE.pickerMarker.dragging.disable();
                } else {
                    STATE.pickerMarker.dragging.enable();
                }
            }

            STATE.pickerMap.off('click');
            if (!isLocked) {
                STATE.pickerMap.on('click', function (e) {
                    STATE.pickerMarker.setLatLng(e.latlng);
                    updateGpsLabel(e.latlng.lat, e.latlng.lng);
                });
            }

            updateGpsLabel(targetLat, targetLng);
            STATE.pickerMap.invalidateSize();
            return;
        }
        
        STATE.pickerMap = L.map('map-picker', {
            zoomControl: false,
            attributionControl: false
        }).setView([targetLat, targetLng], 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(STATE.pickerMap);

        // Add a red terracotta pin
        const redPinIcon = L.divIcon({
            className: 'custom-marker-picker',
            html: `<div class="rider-pin rider-pin-active"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        STATE.pickerMarker = L.marker([targetLat, targetLng], {
            draggable: !isLocked,
            icon: redPinIcon
        }).addTo(STATE.pickerMap);

        // Drag events
        STATE.pickerMarker.on('dragend', function (event) {
            const position = STATE.pickerMarker.getLatLng();
            updateGpsLabel(position.lat, position.lng);
        });

        // Click on map to place pin
        if (!isLocked) {
            STATE.pickerMap.on('click', function (e) {
                STATE.pickerMarker.setLatLng(e.latlng);
                updateGpsLabel(e.latlng.lat, e.latlng.lng);
            });
        }

        updateGpsLabel(targetLat, targetLng);
    }

    function updateGpsLabel(lat, lng) {
        driverLatInput.value = lat;
        driverLngInput.value = lng;
        
        if (gpsStatusDesc) {
            gpsStatusDesc.innerHTML = `<strong>Position enregistrée :</strong> Secteur défini (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
            gpsStatusDesc.style.color = 'var(--color-green-soft)';
        }
    }

    // Dynamic map blur logic
    function updateMapBlurState() {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;
        
        if (STATE.selectedRider) {
            if (STATE.unlockedRiders.has(STATE.selectedRider.id)) {
                mapEl.classList.remove('map-blurred');
            } else {
                mapEl.classList.add('map-blurred');
            }
        } else {
            // Check if we have unlocked any rider in the current city/session
            const unlockedInCurrentCity = Array.from(STATE.unlockedRiders).some(id => {
                const r = findRiderById(id);
                return r && r.id.startsWith(STATE.currentCity === 'ouaga' ? 'o' : 'b');
            });
            
            if (unlockedInCurrentCity) {
                mapEl.classList.remove('map-blurred');
            } else {
                mapEl.classList.add('map-blurred');
            }
        }
    }

    function selectRider(rider) {
        // Increment views count on rider object
        rider.viewsCount = (rider.viewsCount || 0) + 1;

        // Increment Viewed Profiles count for admin statistics
        STATE.totalViewedProfiles = (STATE.totalViewedProfiles || 0) + 1;
        
        // Track viewed rider inside logged-in client account
        if (STATE.loggedClient) {
            if (!STATE.loggedClient.viewedDrivers) {
                STATE.loggedClient.viewedDrivers = new Set();
            }
            STATE.loggedClient.viewedDrivers.add(rider.id);
            updateClientDashboardView();
        }
        
        // Check if already unlocked (admins and subscribed clients access everything for free!)
        const isUnlocked = STATE.unlockedRiders.has(rider.id) || STATE.isAdmin || (STATE.loggedClient && STATE.loggedClient.subscriptionPaid === true);
        
        if (!isUnlocked && !STATE.clickedRiders.has(rider.id)) {
            if (STATE.clickedRiders.size >= 5) {
                // Trigger profile search limit payment lock
                STATE.pendingServiceUnlock = rider;
                openPaymentModal();
                return;
            } else {
                STATE.clickedRiders.add(rider.id);
            }
        }
        
        STATE.selectedRider = rider;

        // Reset highlights
        document.querySelectorAll('.rider-pin').forEach(pin => {
            pin.classList.remove('rider-pin-active');
        });

        // Highlight selected pin
        const markerEl = document.getElementById(`marker-${rider.id}`);
        if (markerEl) {
            markerEl.classList.add('rider-pin-active');
        }

        // Fill Bottom Sheet fields
        sheetAvatar.innerText = rider.initial;
        sheetName.innerText = rider.name;
        sheetVehicle.innerText = rider.vehicle;
        sheetDistance.innerText = `À ${rider.distance} de vous`;

        // Populate Bottom Sheet Stars Rating
        const avgRating = rider.rating || 5.0;
        const reviews = rider.reviews || [];
        const fullStars = Math.round(avgRating);
        sheetRiderStars.innerText = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
        sheetRiderRatingVal.innerText = avgRating.toFixed(1);
        sheetRiderReviewsCount.innerText = `(${reviews.length} avis)`;

        // Check if unlocked
        if (isUnlocked) {
            sheetPhoneMasked.innerText = rider.phone;
            sheetPhoneMasked.classList.remove('phone-masked');
            
            // Remove premium blur detail classes
            sheetAvatar.classList.remove('blur-detail');
            sheetName.classList.remove('blur-detail');
            sheetVehicle.classList.remove('blur-detail');
            sheetDistance.classList.remove('blur-detail');
            sheetPhoneMasked.classList.remove('blur-detail');
            
            btnUnlockContact.classList.add('hidden');
            btnCallRider.classList.remove('hidden');
            btnChatRider.classList.remove('hidden');
            btnCallRider.setAttribute('href', `tel:${rider.phone.replace(/\s+/g, '')}`);
        } else {
            sheetPhoneMasked.innerText = '+226 ' + rider.phone.substring(5, 7) + ' •• •• ••';
            sheetPhoneMasked.classList.add('phone-masked');
            
            // Add premium blur detail classes
            sheetAvatar.classList.add('blur-detail');
            sheetName.classList.add('blur-detail');
            sheetVehicle.classList.add('blur-detail');
            sheetDistance.classList.add('blur-detail');
            sheetPhoneMasked.classList.add('blur-detail');
            
            btnUnlockContact.classList.remove('hidden');
            btnCallRider.classList.add('hidden');
            btnChatRider.classList.add('hidden');
        }

        // Slide Open Bottom Sheet
        riderSheet.classList.add('open');
        
        // Update map blur state
        updateMapBlurState();
    }

    function closeRiderSheet() {
        riderSheet.classList.remove('open');
        STATE.selectedRider = null;
        document.querySelectorAll('.rider-pin').forEach(pin => {
            pin.classList.remove('rider-pin-active');
        });
        
        // Update map blur state
        updateMapBlurState();
    }

    // --- SIMULATED PAYMENT CONTROLLERS ---
    function openPaymentModal() {
        if (!STATE.selectedRider && !STATE.pendingServiceUnlock && !STATE.pendingSubscriptionUnlock && !STATE.pendingClientSubscriptionUnlock) return;

        // Reset to first step
        paymentFormStep.style.display = 'block';
        paymentUssdStep.style.display = 'none';
        paymentSuccessStep.style.display = 'none';
        
        momoPhoneInput.value = '';
        ussdPinInput.value = '';
        btnSubmitMomo.disabled = false;
        btnSubmitMomo.innerText = 'Lancer le paiement';
        
        const titleEl = document.querySelector('.payment-title');
        const amountEl = document.querySelector('.payment-amount');
        
        if (STATE.pendingClientSubscriptionUnlock) {
            titleEl.innerText = "Abonnement Client Premium (1 mois)";
            amountEl.innerText = "5 000 FCFA";
        } else if (STATE.pendingSubscriptionUnlock) {
            titleEl.innerText = "Abonnement Livreur (7 jours)";
            amountEl.innerText = "500 FCFA";
        } else if (STATE.pendingServiceUnlock) {
            titleEl.innerText = "Déblocage du Service de Recherche";
            amountEl.innerText = "200 FCFA";
        } else {
            titleEl.innerText = "Déverrouillage Contact Livreur";
            amountEl.innerText = "200 FCFA";
        }
        
        paymentModal.classList.add('open');
    }

    function closePaymentModal() {
        paymentModal.classList.remove('open');
    }

    function handleProviderSelect(element, provider) {
        document.querySelectorAll('.method-option').forEach(el => {
            el.classList.remove('selected');
        });
        element.classList.add('selected');
        STATE.selectedProvider = provider;
    }

    function startPaymentSimulation() {
        const phone = momoPhoneInput.value.trim().replace(/\s+/g, '');
        
        // Simple verification for Burkinabè numbers (8 digits usually)
        if (phone.length < 8) {
            alert('Veuillez saisir un numéro de téléphone valide à 8 chiffres.');
            return;
        }

        // Show USSD Screen Step
        paymentFormStep.style.display = 'none';
        paymentUssdStep.style.display = 'block';
        
        // Update titles depending on provider
        ussdProviderTitle.innerText = STATE.selectedProvider.toUpperCase() + ' PUSH';
        ussdPinInput.value = '';
        ussdPinInput.focus();

        // Autotype mock PIN for interactive feel when user clicks it
        ussdPinInput.removeAttribute('readonly');
    }

    function triggerUssdConfirmation() {
        const pin = ussdPinInput.value;
        if (pin.length < 4) {
            alert('Veuillez saisir un code PIN à 4 chiffres pour valider.');
            return;
        }

        // Show loading spinner on mock phone
        document.querySelector('.ussd-screen-content').style.display = 'none';
        document.querySelector('.ussd-buttons').style.display = 'none';
        ussdLoader.classList.remove('hidden');
        document.getElementById('ussd-action-hint').innerText = 'Transaction en cours de traitement sur les serveurs de l\'opérateur...';

        setTimeout(() => {
            // Transaction complete!
            ussdLoader.classList.add('hidden');
            document.querySelector('.ussd-screen-content').style.display = 'block';
            document.querySelector('.ussd-buttons').style.display = 'flex';
            document.getElementById('ussd-action-hint').innerText = 'Transaction réussie !';

            // Show Success step
            paymentUssdStep.style.display = 'none';
            paymentSuccessStep.style.display = 'block';

            // Save state
            if (STATE.pendingWalletRecharge) {
                if (STATE.loggedDriver) {
                    if (STATE.loggedDriver.walletBalance === undefined) STATE.loggedDriver.walletBalance = 2500;
                    STATE.loggedDriver.walletBalance += 2000;
                }
                STATE.totalRevenue += 2000;
            } else if (STATE.pendingClientSubscriptionUnlock) {
                if (STATE.loggedClient) {
                    STATE.loggedClient.subscriptionPaid = true;
                }
                STATE.totalRevenue += 5000;
            } else if (STATE.pendingSubscriptionUnlock) {
                if (STATE.loggedDriver) {
                    STATE.loggedDriver.subscriptionPaid = true;
                }
                STATE.totalRevenue += 500;
            } else if (STATE.pendingServiceUnlock) {
                STATE.unlockedRiders.add(STATE.pendingServiceUnlock.id);
                STATE.clickedRiders.clear(); // Offer a fresh 5 clicks
                
                const rider = findRiderById(STATE.pendingServiceUnlock.id);
                if (rider) {
                    if (rider.contactsCount === undefined) rider.contactsCount = 0;
                    rider.contactsCount++;
                }
                STATE.totalUnlocks++;
                STATE.totalRevenue += 200;
            } else if (STATE.selectedRider) {
                STATE.unlockedRiders.add(STATE.selectedRider.id);
                
                // Track contacted history if client is logged in
                if (STATE.loggedClient) {
                    if (!STATE.loggedClient.contactedDrivers) {
                        STATE.loggedClient.contactedDrivers = new Set();
                    }
                    STATE.loggedClient.contactedDrivers.add(STATE.selectedRider.id);
                    updateClientDashboardView();
                }

                // Increment contact count for the rider
                const rider = findRiderById(STATE.selectedRider.id);
                if (rider) {
                    if (rider.contactsCount === undefined) rider.contactsCount = 0;
                    rider.contactsCount++;
                }
                
                // Track Admin Statistics
                STATE.totalUnlocks++;
                STATE.totalRevenue += 200;
            }
            
            // Trigger map markers updates
            renderRiders();
            
            updateAdminDashboardStats();
            if (typeof updateAdminDashboardDrivers === 'function') {
                updateAdminDashboardDrivers();
            }
        }, 1800);
    }

    function completePaymentFlow() {
        closePaymentModal();
        if (STATE.pendingWalletRecharge) {
            STATE.pendingWalletRecharge = false;
            updateDriverDashboardView();
            openDriverDrawer();
        } else if (STATE.pendingClientSubscriptionUnlock) {
            STATE.pendingClientSubscriptionUnlock = false;
            // Successfully logged in as premium client!
            openClientDrawer();
        } else if (STATE.pendingSubscriptionUnlock) {
            STATE.pendingSubscriptionUnlock = false;
            updateDriverDashboardView();
            openDriverDrawer();
        } else if (STATE.pendingServiceUnlock) {
            const riderToView = STATE.pendingServiceUnlock;
            STATE.pendingServiceUnlock = null;
            selectRider(riderToView);
        } else if (STATE.selectedRider) {
            selectRider(STATE.selectedRider);
        }
    }

    // --- REVIEWS MODAL CONTROLLERS ---
    function openReviewsModal() {
        if (!STATE.selectedRider) return;
        const rider = STATE.selectedRider;

        // Populate rating summary
        const avgRating = rider.rating || 5.0;
        const reviews = rider.reviews || [];
        const fullStars = Math.round(avgRating);

        reviewsModalAvgVal.innerText = avgRating.toFixed(1);
        reviewsModalCountDesc.innerText = `Basé sur ${reviews.length} avis`;
        reviewsModalStars.innerText = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

        // Populate reviews list
        reviewsModalList.innerHTML = '';
        if (reviews.length === 0) {
            reviewsModalList.innerHTML = `
                <div style="text-align:center; padding:30px 20px; color:var(--color-charcoal-muted); font-style:italic; font-size:0.8rem;">
                    Aucun commentaire laissé pour ce livreur pour le moment.
                </div>
            `;
        } else {
            reviews.forEach(rev => {
                const card = document.createElement('div');
                card.className = 'review-entry-card';
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="color:var(--color-primary-yellow); font-weight:700; font-size:0.85rem;">${'★'.repeat(Math.round(rev.stars))}</span>
                        <span style="font-size:0.65rem; color:var(--color-charcoal-muted); font-weight:600;">${rev.date || 'Récemment'}</span>
                    </div>
                    <p style="margin:0; color:var(--color-charcoal-light); line-height:1.4; font-style:italic;">"${rev.text}"</p>
                `;
                reviewsModalList.appendChild(card);
            });
        }

        reviewsModal.classList.add('open');
    }

    function closeReviewsModal() {
        reviewsModal.classList.remove('open');
    }

    // --- ESPACE LIVREUR CONTROLLERS ---
    
    // Toggle Espace Livreur panels
    linkToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        driverRegisterPanel.classList.add('hidden');
        driverLoginPanel.classList.remove('hidden');
        driverDashboardPanel.classList.add('hidden');
        driverSuccessPanel.style.display = 'none';
    });
    
    linkToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        driverRegisterPanel.classList.remove('hidden');
        driverLoginPanel.classList.add('hidden');
        driverDashboardPanel.classList.add('hidden');
        driverSuccessPanel.style.display = 'none';
    });
    
    // Espace Livreur Login Submit
    driverLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phoneVal = document.getElementById('login-phone').value.trim();
        const phoneNormalized = '+226 ' + phoneVal;
        
        let driver = [...STATE.riders.ouaga, ...STATE.riders.bobo].find(r => r.phone === phoneNormalized || r.phone.replace(/\s+/g, '') === phoneNormalized.replace(/\s+/g, ''));
        
        if (!driver) {
            // Automatically spin up a mock test driver if not registered yet
            driver = {
                id: 'mock_logged_' + Date.now(),
                name: 'Souleymane Barry (Livreur)',
                vehicle: '🏍️ Moto 135cc',
                phone: phoneNormalized,
                contactsCount: 2,
                subscriptionPaid: false,
                initial: 'SB'
            };
            STATE.riders[STATE.currentCity].unshift(driver);
        }
        
        STATE.loggedDriver = driver;
        
        // Render Dashboard
        driverLoginPanel.classList.add('hidden');
        driverDashboardPanel.classList.remove('hidden');
        updateDriverDashboardView();
    });
    
    // Simulate Contacts for pricing rules test
    btnDriverSimulateContact.addEventListener('click', () => {
        if (!STATE.loggedDriver) return;
        
        if (STATE.loggedDriver.contactsCount === undefined) {
            STATE.loggedDriver.contactsCount = 0;
        }
        STATE.loggedDriver.contactsCount += 2;
        
        // Unpaid suspended drivers get hidden
        renderRiders();
        
        updateDriverDashboardView();
        updateAdminDashboardDrivers();
    });
    
    // Driver pays weekly sub button
    btnDriverPaySub.addEventListener('click', () => {
        STATE.pendingSubscriptionUnlock = true;
        openPaymentModal();
    });
    
    // Logout
    btnDriverLogout.addEventListener('click', () => {
        STATE.loggedDriver = null;
        driverDashboardPanel.classList.add('hidden');
        driverRegisterPanel.classList.remove('hidden');
    });

    function updateDriverDashboardView() {
        if (!STATE.loggedDriver) return;
        
        const driver = STATE.loggedDriver;
        document.getElementById('driver-dash-name').innerText = `Bonjour, ${driver.name.split(' ')[0]} !`;
        document.getElementById('driver-dash-vehicle').innerText = ` Moyen de transport : ${driver.vehicle}`;
        
        const contacts = driver.contactsCount || 0;
        const views = driver.viewsCount || 0;
        const isPaid = driver.subscriptionPaid || false;
        
        document.getElementById('driver-dash-contacts').innerText = `${contacts} / 4`;
        document.getElementById('driver-dash-views').innerText = views;

        // Initialize wallet balance on profile if not set
        if (driver.walletBalance === undefined) {
            driver.walletBalance = 2500; // default 2500 FCFA
        }
        
        // Update wallet DOM
        if (driverDashWalletVal) {
            driverDashWalletVal.innerText = `${driver.walletBalance} FCFA`;
        }
        
        const statusTextEl = document.getElementById('driver-dash-status');
        const visibilityEl = document.getElementById('driver-dash-visibility');
        const subTextEl = document.getElementById('driver-dash-sub-text');
        const payBtnEl = document.getElementById('btn-driver-pay-sub');
        
        if (contacts < 5) {
            statusTextEl.innerText = "Gratuit (Essai)";
            statusTextEl.className = "rider-status";
            statusTextEl.style.backgroundColor = "var(--color-green-light)";
            statusTextEl.style.color = "var(--color-green-soft)";
            
            visibilityEl.innerText = "🟢 En ligne & Visible";
            visibilityEl.style.color = "var(--color-green-soft)";
            
            subTextEl.innerHTML = `Votre compte est en période d'essai gratuite. Les 4 premières mises en relation sont offertes. Vous êtes à <strong>${contacts}/4</strong>.`;
            payBtnEl.style.display = "none";
            if (btnDriverPaySubWallet) btnDriverPaySubWallet.classList.add('hidden');
        } else if (isPaid) {
            statusTextEl.innerText = "Abonné (Actif)";
            statusTextEl.className = "rider-status";
            statusTextEl.style.backgroundColor = "var(--color-green-light)";
            statusTextEl.style.color = "var(--color-green-soft)";
            
            visibilityEl.innerText = "🟢 En ligne & Visible";
            visibilityEl.style.color = "var(--color-green-soft)";
            
            subTextEl.innerHTML = `Votre abonnement hebdomadaire de 500 FCFA est actif ! Merci de faire confiance à Livraison Rapide.`;
            payBtnEl.style.display = "none";
            if (btnDriverPaySubWallet) btnDriverPaySubWallet.classList.add('hidden');
        } else {
            statusTextEl.innerText = "Abonnement Requis";
            statusTextEl.className = "rider-status";
            statusTextEl.style.backgroundColor = "var(--color-primary-red-light)";
            statusTextEl.style.color = "var(--color-primary-red)";
            
            visibilityEl.innerText = "🔴 Hors ligne (Masqué)";
            visibilityEl.style.color = "var(--color-primary-red)";
            
            subTextEl.innerHTML = `Vous avez atteint <strong>${contacts} relations clients</strong> ! Pour réactiver votre visibilité sur la carte, veuillez régler votre abonnement hebdomadaire de 500 FCFA.`;
            payBtnEl.style.display = "block";

            // Wallet deduction option
            if (btnDriverPaySubWallet) {
                if (driver.walletBalance >= 500) {
                    btnDriverPaySubWallet.classList.remove('hidden');
                    btnDriverPaySubWallet.innerText = `Déduire de mon portefeuille (500 FCFA)`;
                } else {
                    btnDriverPaySubWallet.classList.add('hidden');
                }
            }
        }
        
        // Populate Reviews & Comments
        const ratingValEl = document.getElementById('driver-dash-rating-val');
        const reviewsCountEl = document.getElementById('driver-dash-reviews-count');
        const reviewsListEl = document.getElementById('driver-reviews-list');
        
        if (ratingValEl && reviewsListEl) {
            reviewsListEl.innerHTML = '';
            const rating = driver.rating || 4.8;
            const reviews = driver.reviews || [
                { text: "Très bon service.", stars: 5, date: "Hier" }
            ];
            
            ratingValEl.innerText = rating.toFixed(1);
            reviewsCountEl.innerText = `Basé sur ${reviews.length} avis`;
            
            if (reviews.length === 0) {
                reviewsListEl.innerHTML = '<p style="font-size:0.75rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucun avis pour le moment.</p>';
            } else {
                reviews.forEach(rev => {
                    const revEl = document.createElement('div');
                    revEl.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
                    revEl.style.paddingBottom = '6px';
                    revEl.style.fontSize = '0.75rem';
                    revEl.innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-weight:600;">
                            <span style="color:var(--color-primary-yellow)">${'★'.repeat(Math.round(rev.stars))}</span>
                            <span style="color:var(--color-charcoal-muted); font-size:0.6rem;">${rev.date}</span>
                        </div>
                        <p style="margin:0; color:var(--color-charcoal-light); font-style:italic;">"${rev.text}"</p>
                    `;
                    reviewsListEl.appendChild(revEl);
                });
            }
        }
        
        // Populate Messenger chat threads
        const chatsListEl = document.getElementById('driver-dash-chats-list');
        if (chatsListEl) {
            chatsListEl.innerHTML = '';
            
            // Check if there are active chats for this driver
            const activeChats = [];
            
            // For live simulator, let's look up if this driver has chats in STATE.chats
            if (STATE.chats[driver.id] && STATE.chats[driver.id].length > 0) {
                activeChats.push({
                    name: 'Client (+226 76 00 00 01)',
                    snippet: STATE.chats[driver.id][STATE.chats[driver.id].length - 1].text,
                    time: STATE.chats[driver.id][STATE.chats[driver.id].length - 1].time
                });
            }
            
            if (activeChats.length === 0) {
                chatsListEl.innerHTML = '<p style="font-size:0.8rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucun message reçu pour le moment.</p>';
            } else {
                activeChats.forEach(ch => {
                    const row = document.createElement('div');
                    row.className = 'session-item-row';
                    row.style.background = 'white';
                    row.style.borderRadius = '8px';
                    row.style.padding = '8px';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.cursor = 'pointer';
                    row.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                    row.innerHTML = `
                        <div>
                            <div style="font-weight:700; font-size:0.75rem;">${ch.name}</div>
                            <div style="font-size:0.7rem; color:var(--color-charcoal-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">${ch.snippet}</div>
                        </div>
                        <div style="font-size:0.65rem; color:var(--color-charcoal-muted);">${ch.time}</div>
                    `;
                    row.addEventListener('click', () => {
                        // Open chat drawer for the driver!
                        openChatDrawer(driver);
                    });
                    chatsListEl.appendChild(row);
                });
            }
        }
    }

    function updateClientDashboardView() {
        if (!STATE.loggedClient) return;
        
        const client = STATE.loggedClient;
        clientDashPhone.innerText = `Compte : ${client.phone}`;
        
        // Viewed Drivers
        clientViewedList.innerHTML = '';
        const viewedIds = Array.from(client.viewedDrivers || []);
        if (viewedIds.length === 0) {
            clientViewedList.innerHTML = '<p style="font-size:0.8rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucun livreur consulté pour le moment.</p>';
        } else {
            viewedIds.forEach(id => {
                const r = findRiderById(id);
                if (!r) return;
                const row = document.createElement('div');
                row.style.background = 'white';
                row.style.borderRadius = '8px';
                row.style.padding = '8px 12px';
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.cursor = 'pointer';
                row.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                row.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700; width:24px; height:24px; border-radius:50%; background:var(--color-primary-yellow-light); display:flex; align-items:center; justify-content:center; font-size:0.7rem;">${r.initial}</span>
                        <div>
                            <div style="font-weight:700; font-size:0.75rem;">${r.name}</div>
                            <div style="font-size:0.65rem; color:var(--color-charcoal-muted);">${r.vehicle}</div>
                        </div>
                    </div>
                    <span style="font-size: 0.85rem; color: var(--color-primary-brown); font-weight:700;">📍 Voir</span>
                `;
                row.addEventListener('click', () => {
                    // Center and select rider
                    closeClientDrawer();
                    
                    if (STATE.map) {
                        STATE.map.setView([r.lat, r.lng], 15);
                        setTimeout(() => {
                            selectRider(r);
                        }, 500);
                    }
                });
                clientViewedList.appendChild(row);
            });
        }

        // Contacted Drivers
        clientContactedList.innerHTML = '';
        const contactedIds = Array.from(client.contactedDrivers || []);
        if (contactedIds.length === 0) {
            clientContactedList.innerHTML = '<p style="font-size:0.8rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucun contact débloqué.</p>';
        } else {
            contactedIds.forEach(id => {
                const r = findRiderById(id);
                if (!r) return;
                const row = document.createElement('div');
                row.style.background = 'white';
                row.style.borderRadius = '8px';
                row.style.padding = '8px 12px';
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                row.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700; width:24px; height:24px; border-radius:50%; background:var(--color-primary-red-light); color:var(--color-primary-red); display:flex; align-items:center; justify-content:center; font-size:0.7rem;">${r.initial}</span>
                        <div>
                            <div style="font-weight:700; font-size:0.75rem;">${r.name}</div>
                            <div style="font-size:0.65rem; color:var(--color-charcoal-light); font-weight:600;">${r.phone}</div>
                        </div>
                    </div>
                    <a href="tel:${r.phone.replace(/\s+/g, '')}" style="background: var(--color-green-light); color:var(--color-green-soft); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; text-decoration:none; font-size:0.8rem;">📞</a>
                `;
                clientContactedList.appendChild(row);
            });
        }

        // Chat threads
        clientChatsList.innerHTML = '';
        const chatDriverIds = Object.keys(STATE.chats).filter(riderId => STATE.chats[riderId] && STATE.chats[riderId].length > 0);
        if (chatDriverIds.length === 0) {
            clientChatsList.innerHTML = '<p style="font-size:0.8rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucune discussion active.</p>';
        } else {
            chatDriverIds.forEach(riderId => {
                const r = findRiderById(riderId);
                if (!r) return;
                const messages = STATE.chats[riderId];
                const lastMsg = messages[messages.length - 1];
                const row = document.createElement('div');
                row.className = 'session-item-row';
                row.style.background = 'white';
                row.style.borderRadius = '8px';
                row.style.padding = '8px';
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.cursor = 'pointer';
                row.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                row.innerHTML = `
                    <div>
                        <div style="font-weight:700; font-size:0.75rem;">${r.name}</div>
                        <div style="font-size:0.7rem; color:var(--color-charcoal-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">${lastMsg.text}</div>
                    </div>
                    <div style="font-size:0.65rem; color:var(--color-charcoal-muted);">${lastMsg.time}</div>
                `;
                row.addEventListener('click', () => {
                    closeClientDrawer();
                    openChatDrawer(r);
                });
                clientChatsList.appendChild(row);
            });
        }
    }

    function openClientDrawer() {
        if (!STATE.loggedClient) return;
        clientDrawer.classList.add('open');
        mainFooter.classList.add('hidden');
        updateClientDashboardView();
    }

    function closeClientDrawer() {
        clientDrawer.classList.remove('open');
        if (welcomePortal.classList.contains('hidden')) {
            citySelector.classList.remove('hidden');
            onlineCounterBadge.classList.remove('hidden');
        } else {
            returnToWelcomePortal();
        }
    }

    // --- ONBOARDING REGISTRATION DRIVER DRAWER ---
    function openDriverDrawer() {
        driverDrawer.classList.add('open');
        mainFooter.classList.add('hidden');
        
        driverForm.style.display = 'block';
        driverSuccessPanel.style.display = 'none';
        driverForm.reset();
        
        // Reset upload elements
        resetUploadBox(boxUploadCniRecto, previewCniRecto);
        resetUploadBox(boxUploadCniVerso, previewCniVerso);
        resetUploadBox(boxUploadSelfie, previewSelfie);

        // Reset Geolocation card and inputs state
        hasGpsLocation = false;
        if (geoStatusCard) {
            geoStatusCard.className = 'geo-status-card';
            document.getElementById('geo-status-title').innerText = "Détection GPS requise";
            document.getElementById('geo-status-text').innerText = "Pour apparaître sur la carte des clients, nous devons enregistrer votre position exacte.";
        }
        if (btnGeoLocate) {
            btnGeoLocate.classList.remove('hidden');
            btnGeoLocate.innerText = "Me géolocaliser";
            btnGeoLocate.style.backgroundColor = "";
            btnGeoLocate.style.borderColor = "";
        }
        if (geoLoader) geoLoader.classList.add('hidden');
        if (mapPickerWrapper) mapPickerWrapper.classList.add('hidden');
        if (gpsFallbackHint) gpsFallbackHint.classList.add('hidden');
        if (driverLatInput) driverLatInput.value = '';
        if (driverLngInput) driverLngInput.value = '';

        if (STATE.pickerMap) {
            STATE.pickerMap.remove();
            STATE.pickerMap = null;
            STATE.pickerMarker = null;
        }

        // Manage views depending on logged-in state of the driver
        if (STATE.loggedDriver) {
            driverRegisterPanel.classList.add('hidden');
            driverLoginPanel.classList.add('hidden');
            driverDashboardPanel.classList.remove('hidden');
            updateDriverDashboardView();
        } else {
            driverRegisterPanel.classList.remove('hidden');
            driverLoginPanel.classList.add('hidden');
            driverDashboardPanel.classList.add('hidden');
        }

        // Make nav buttons visible
        navBtnFind.classList.remove('hidden');
        navBtnRegister.classList.remove('hidden');

        // Highlight "Devenir livreur" nav button
        navBtnRegister.classList.add('active');
        navBtnFind.classList.remove('active');
    }

    function closeDriverDrawer() {
        driverDrawer.classList.remove('open');
        
        // If map is active, show the map. Otherwise, return to welcome portal!
        if (welcomePortal.classList.contains('hidden')) {
            navBtnRegister.classList.remove('active');
            navBtnFind.classList.add('active');
            citySelector.classList.remove('hidden');
            onlineCounterBadge.classList.remove('hidden');
        } else {
            returnToWelcomePortal();
        }
    }

    // Handle Upload Preview files
    function setupUploadPreview(input, box, preview) {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    preview.src = event.target.result;
                    box.classList.add('has-file');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function resetUploadBox(box, preview) {
        const input = box.querySelector('input[type="file"]');
        if (input) input.value = '';
        preview.src = '';
        box.classList.remove('has-file');
    }

    function showMapView() {
        welcomePortal.classList.add('hidden');
        mainFooter.classList.add('hidden');
        citySelector.classList.remove('hidden');
        onlineCounterBadge.classList.remove('hidden');
        navBtnFind.classList.remove('hidden');
        navBtnRegister.classList.remove('hidden');
        
        navBtnFind.classList.add('active');
        navBtnRegister.classList.remove('active');
        
        if (!mapInitialized) {
            initMainMap();
            mapInitialized = true;
        } else {
            STATE.map.invalidateSize();
            // Centering on geolocated client position
            if (STATE.clientCoordinates) {
                STATE.map.setView([STATE.clientCoordinates.lat, STATE.clientCoordinates.lng], 14);
                
                // Add the pulsing beacon marker if not present
                if (!STATE.clientBeaconMarker) {
                    const beaconIcon = L.divIcon({
                        className: 'client-location-beacon-container',
                        html: `<div class="client-beacon-pulse"></div><div class="client-beacon-core"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    STATE.clientBeaconMarker = L.marker([STATE.clientCoordinates.lat, STATE.clientCoordinates.lng], {
                        icon: beaconIcon
                    }).addTo(STATE.map).bindPopup("<b>📍 Vous êtes ici</b><br>Recherche de livreurs autour de vous.");
                } else {
                    STATE.clientBeaconMarker.setLatLng([STATE.clientCoordinates.lat, STATE.clientCoordinates.lng]);
                }
            }
        }
        
        // Apply proximity filter
        renderRiders();
        
        // Apply map blur depending on payment/unlock state
        updateMapBlurState();
    }

    function returnToWelcomePortal() {
        welcomePortal.classList.remove('hidden');
        mainFooter.classList.remove('hidden');
        citySelector.classList.add('hidden');
        onlineCounterBadge.classList.add('hidden');
        navBtnFind.classList.add('hidden');
        navBtnRegister.classList.remove('hidden'); // Keep Devenir livreur visible at top-right
        navBtnRegister.classList.remove('active');
        
        closeRiderSheet();
        if (driverDrawer.classList.contains('open')) {
            driverDrawer.classList.remove('open');
        }
    }

    // --- LOCATION SELECTION PORTAL FLOW ---
    let portalSelectedCity = 'ouaga';
    
    function openLocationPortal() {
        // Reset steps
        document.getElementById('loc-step-city').classList.remove('hidden');
        document.getElementById('loc-step-options').classList.add('hidden');
        document.getElementById('loc-step-sectors').classList.add('hidden');
        
        // Open overlay
        document.getElementById('location-portal').classList.add('open');
    }
    
    function closeLocationPortal() {
        document.getElementById('location-portal').classList.remove('open');
    }
    
    function renderSectorChips(filterText = '') {
        const container = document.getElementById('loc-sectors-list');
        container.innerHTML = '';
        
        const citySectors = STATE.sectors[portalSelectedCity] || [];
        const normalizedFilter = filterText.toLowerCase().trim();
        
        citySectors.forEach(sector => {
            if (normalizedFilter && !sector.name.toLowerCase().includes(normalizedFilter)) {
                return;
            }
            
            const chip = document.createElement('div');
            chip.className = 'sector-chip';
            chip.innerText = sector.name;
            
            chip.addEventListener('click', () => {
                selectSector(sector);
            });
            
            container.appendChild(chip);
        });
        
        if (container.children.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.style.gridColumn = '1 / -1';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '20px 0';
            placeholder.style.color = 'var(--color-charcoal-muted)';
            placeholder.style.fontSize = '0.85rem';
            placeholder.innerText = 'Aucun quartier ne correspond à votre recherche.';
            container.appendChild(placeholder);
        }
    }
    
    function selectSector(sector) {
        // 1. Switch active city
        switchCity(portalSelectedCity);
        
        // 2. Open main map
        showMapView();
        
        // 3. Close location selection overlay
        closeLocationPortal();
        
        // 4. Center map on coordinates and zoom in to zoom 15
        if (STATE.map) {
            STATE.map.setView([sector.lat, sector.lng], 15, {
                animate: true,
                pan: { duration: 0.8 }
            });
        }
        
        // 5. Open sheet & highlight associated driver
        const rider = findRiderById(sector.riderId);
        if (rider) {
            setTimeout(() => {
                selectRider(rider);
            }, 600); // Small delay to let panning animation finish beautifully
        }
        
        // 6. Present dynamic active zone toast badge
        const toast = document.getElementById('sector-active-toast');
        document.getElementById('sector-toast-text').innerText = `📍 Zone active : ${sector.name}`;
        toast.classList.add('show');
    }

    // --- LIVE CHAT DRAWER & SIMULATION FUNCTIONS ---
    
    function openChatDrawer(rider) {
        closeRiderSheet();
        
        // Populate header details
        chatDriverAvatar.innerText = rider.initial;
        chatDriverName.innerText = rider.name;
        chatDriverNameSystem.innerText = rider.name;
        chatInput.value = '';
        
        // Open drawer
        chatDrawer.classList.add('open');
        
        // Load or initialize chat logs
        if (!STATE.chats[rider.id]) {
            STATE.chats[rider.id] = [];
        }
        
        renderChatMessages(rider.id);
        
        // If it's a completely new chat, trigger a realistic driver welcoming greeting
        if (STATE.chats[rider.id].length === 0) {
            triggerRiderWelcomeGreeting(rider);
        }
    }
    
    function renderChatMessages(riderId) {
        // Clear all except system message
        chatMessages.innerHTML = '';
        
        const rider = findRiderById(riderId);
        const riderName = rider ? rider.name : "Livreur";
        
        const systemMsg = document.createElement('div');
        systemMsg.className = 'chat-message message-system';
        systemMsg.innerHTML = `Début de votre discussion sécurisée avec <strong>${riderName}</strong>.`;
        chatMessages.appendChild(systemMsg);
        
        const messages = STATE.chats[riderId] || [];
        messages.forEach(msg => {
            const bubble = document.createElement('div');
            bubble.className = `chat-message ${msg.sender === 'client' ? 'sent' : 'received'}`;
            bubble.innerHTML = `${msg.text}<span class="message-time">${msg.time}</span>`;
            chatMessages.appendChild(bubble);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function triggerRiderWelcomeGreeting(rider) {
        // Simulate typing
        chatTypingDriverName.innerText = rider.name.split(' ')[0];
        chatTypingIndicator.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        setTimeout(() => {
            chatTypingIndicator.classList.add('hidden');
            
            const time = getFormattedTime();
            const welcomeText = `Bonjour ! Je suis ${rider.name.split(' ')[0]} et je suis actuellement sur ma ${rider.vehicle.toLowerCase()}. Vous êtes situé dans quel secteur pour la course ?`;
            
            const welcomeMsg = {
                sender: 'rider',
                text: welcomeText,
                time: time
            };
            
            STATE.chats[rider.id].push(welcomeMsg);
            STATE.totalMessages++;
            
            renderChatMessages(rider.id);
            updateAdminDashboardChats();
            updateAdminDashboardStats();
            
            // Trigger simulated admin notification badge
            STATE.unreadAdminCount++;
            adminChatBadge.innerText = STATE.unreadAdminCount;
            adminChatBadge.classList.remove('hidden');
        }, 1500);
    }
    
    function sendClientMessage() {
        const text = chatInput.value.trim();
        if (!text || !STATE.selectedRider) return;
        
        const rider = STATE.selectedRider;
        const time = getFormattedTime();
        
        const clientMsg = {
            sender: 'client',
            text: text,
            time: time
        };
        
        // Save & Render message
        if (!STATE.chats[rider.id]) {
            STATE.chats[rider.id] = [];
        }
        STATE.chats[rider.id].push(clientMsg);
        STATE.totalMessages++;
        
        chatInput.value = '';
        renderChatMessages(rider.id);
        
        // Update admin monitoring panels
        updateAdminDashboardChats();
        updateAdminDashboardStats();
        
        // Trigger simulated rider response
        triggerRiderResponse(rider, text);
    }
    
    function triggerRiderResponse(rider, clientText) {
        // Simulate typing delay
        chatTypingDriverName.innerText = rider.name.split(' ')[0];
        chatTypingIndicator.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        setTimeout(() => {
            chatTypingIndicator.classList.add('hidden');
            
            const time = getFormattedTime();
            let replyText = "";
            const lowerText = clientText.toLowerCase();
            
            // Localized Dynamic Reply Engine
            if (lowerText.includes('secteur') || 
                lowerText.includes('wemtenga') || 
                lowerText.includes('patte') || 
                lowerText.includes('somgandé') || 
                lowerText.includes('dassasgho') || 
                lowerText.includes('zogona') || 
                lowerText.includes('gounghin') || 
                lowerText.includes('pissy') || 
                lowerText.includes('tampouy') || 
                lowerText.includes('colma') || 
                lowerText.includes('bolomakoté') || 
                lowerText.includes('belleville') || 
                lowerText.includes('accart')) {
                
                replyText = `C'est noté ! Je connais très bien ce secteur. Je suis juste à côté, à environ 5 minutes de route. C'est pour livrer où exactement ?`;
            } else if (lowerText.includes('combien') || 
                       lowerText.includes('prix') || 
                       lowerText.includes('tarif') || 
                       lowerText.includes('argent') || 
                       lowerText.includes('coute') ||
                       lowerText.includes('coûte') || 
                       lowerText.includes('fcfa')) {
                       
                replyText = `Pour cette zone, mes courses habituelles varient entre 1000 FCFA et 1500 FCFA maximum selon l'urgence. Qu'est-ce qui vous arrange ?`;
            } else if (lowerText.includes('tricycle') || 
                       lowerText.includes('katakatani') || 
                       lowerText.includes('gros') || 
                       lowerText.includes('lourd') || 
                       lowerText.includes('bagage')) {
                       
                replyText = `Ah ! Si c'est un colis très volumineux ou des sacs de ciment, j'ai mon ami qui est dispo immédiatement avec un Tricycle Katakatani pour faire le transport pour vous.`;
            } else if (STATE.chats[rider.id].filter(m => m.sender === 'client').length <= 1) {
                replyText = `Super ! Donnez-moi juste le point exact pour récupérer le colis et le numéro de téléphone de la personne qui doit le recevoir.`;
            } else {
                replyText = `D'accord, c'est parfait ! Je démarre ma moto tout de suite et je vous rejoins. Gardez votre téléphone près de vous pour mon arrivée ! 🏍️`;
            }
            
            const riderMsg = {
                sender: 'rider',
                text: replyText,
                time: time
            };
            
            STATE.chats[rider.id].push(riderMsg);
            STATE.totalMessages++;
            
            renderChatMessages(rider.id);
            updateAdminDashboardChats();
            updateAdminDashboardStats();
            
            // If admin dashboard is closed, increment the live badge!
            if (!adminModal.classList.contains('open')) {
                STATE.unreadAdminCount++;
                adminChatBadge.innerText = STATE.unreadAdminCount;
                adminChatBadge.classList.remove('hidden');
            }
        }, 1800);
    }
    
    // Helper function to find a rider across all cities
    function findRiderById(id) {
        return STATE.riders.ouaga.find(r => r.id === id) || STATE.riders.bobo.find(r => r.id === id);
    }
    
    function getFormattedTime() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        return `${hrs}:${mins}`;
    }

    function openAdminModal() {
        adminModal.classList.add('open');
        
        // Reset unread notifications
        STATE.unreadAdminCount = 0;
        adminChatBadge.classList.add('hidden');
        
        // Render advanced dashboard stats & tables
        updateAdminDashboardDrivers();
        updateAdminDashboardStats();
        switchAdminTab('chats');
        
        // Close chats drawer if open to avoid visual overlaps
        chatDrawer.classList.remove('open');
    }
    
    function closeAdminModal() {
        adminModal.classList.remove('open');
    }
    
    function switchAdminTab(tab) {
        if (tab === 'chats') {
            tabChats.classList.add('active');
            tabDrivers.classList.remove('active');
            tabStats.classList.remove('active');
            adminChatsSection.classList.remove('hidden');
            adminDriversSection.classList.add('hidden');
            adminStatsSection.classList.add('hidden');
            
            // Go back in inspector if it was open
            closeAdminConversationInspector();
            
            // Populate chat sessions
            updateAdminDashboardChats();
        } else if (tab === 'drivers') {
            tabDrivers.classList.add('active');
            tabChats.classList.remove('active');
            tabStats.classList.remove('active');
            adminDriversSection.classList.remove('hidden');
            adminChatsSection.classList.add('hidden');
            adminStatsSection.classList.add('hidden');
            
            // Populate drivers list
            updateAdminDashboardDrivers();
        } else {
            tabStats.classList.add('active');
            tabChats.classList.remove('active');
            tabDrivers.classList.remove('active');
            adminStatsSection.classList.remove('hidden');
            adminChatsSection.classList.add('hidden');
            adminDriversSection.classList.add('hidden');
            
            // Populate stats
            updateAdminDashboardStats();
        }
    }

    function updateAdminDashboardDrivers() {
        const driversListContainer = document.getElementById('admin-table-drivers-list');
        const subsListContainer = document.getElementById('admin-table-subs-list');
        if (!driversListContainer || !subsListContainer) return;
        
        driversListContainer.innerHTML = '';
        subsListContainer.innerHTML = '';
        
        const allRiders = [...STATE.riders.ouaga, ...STATE.riders.bobo];
        
        // Render registered drivers list table
        allRiders.forEach(rider => {
            const count = rider.contactsCount || 0;
            const paid = rider.subscriptionPaid || false;
            
            if (!rider.status) {
                if (count >= 5 && !paid) {
                    rider.status = 'suspendu';
                } else {
                    rider.status = 'actif';
                }
            }
            
            let statusBadge = '';
            if (rider.status === 'actif') {
                statusBadge = '<span class="badge-status active">Actif</span>';
            } else if (rider.status === 'en attente') {
                statusBadge = '<span class="badge-status pending">En attente</span>';
            } else {
                statusBadge = '<span class="badge-status suspended">Suspendu</span>';
            }
            
            let actionButtons = '';
            if (rider.status === 'en attente') {
                actionButtons += `<button class="btn-table-action validate" data-id="${rider.id}">Valider</button>`;
            } else if (rider.status === 'actif') {
                actionButtons += `<button class="btn-table-action suspend" data-id="${rider.id}">Suspendre</button>`;
            } else if (rider.status === 'suspendu') {
                actionButtons += `<button class="btn-table-action validate" data-id="${rider.id}">Valider</button>`;
            }
            actionButtons += `<button class="btn-table-action delete" data-id="${rider.id}">Supprimer</button>`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700; width:28px; height:28px; border-radius:8px; background:var(--color-primary-brown-light); color:var(--color-charcoal); display:flex; align-items:center; justify-content:center; font-size:0.75rem;">${rider.initial}</span>
                        <div>
                            <div style="font-weight:700;">${rider.name}</div>
                            <div style="font-size:0.65rem; color:var(--color-charcoal-muted);">${rider.vehicle}</div>
                        </div>
                    </div>
                </td>
                <td style="font-weight:600;">${rider.phone}</td>
                <td style="font-weight:600;">${rider.vehicle.split(' ')[0]}</td>
                <td>${statusBadge}</td>
                <td><div style="display:flex;">${actionButtons}</div></td>
            `;
            driversListContainer.appendChild(tr);
            
            // Render subscriptions list table (show active subscriptions)
            if (paid || count > 0) {
                const subTr = document.createElement('tr');
                const subDate = paid ? "23 Mai 2026" : "N/A";
                const subStatus = paid ? '<span class="badge-status active">Payé (7j)</span>' : '<span class="badge-status suspended">Non payé</span>';
                
                subTr.innerHTML = `
                    <td style="font-weight:700; color:var(--color-primary-brown);">Livreur</td>
                    <td style="font-weight:700;">${rider.name}</td>
                    <td style="font-weight:600;">${rider.phone}</td>
                    <td style="font-weight:600; color:var(--color-charcoal-light);">${subDate}</td>
                    <td>${subStatus}</td>
                `;
                subsListContainer.appendChild(subTr);
            }
        });
        
        // Also render Client subscriptions in the same table
        STATE.clients.forEach(client => {
            const subTr = document.createElement('tr');
            const subDate = client.subscriptionPaid ? "23 Mai 2026" : "N/A";
            const subStatus = client.subscriptionPaid ? '<span class="badge-status active" style="background-color: var(--color-green-light); color: var(--color-green-soft);">Payé (30j)</span>' : '<span class="badge-status suspended">Non payé</span>';
            
            subTr.innerHTML = `
                <td style="font-weight:700; color:var(--color-primary-red);">Client</td>
                <td style="font-weight:700;">${client.name || 'Client'}</td>
                <td style="font-weight:600;">${client.phone}</td>
                <td style="font-weight:600; color:var(--color-charcoal-light);">${subDate}</td>
                <td>${subStatus}</td>
            `;
            subsListContainer.appendChild(subTr);
        });
        
        // Add event listeners on table actions
        document.querySelectorAll('.btn-table-action.validate').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const rider = findRiderById(id);
                if (rider) {
                    rider.status = 'actif';
                    if (rider.contactsCount >= 5) {
                        rider.subscriptionPaid = true; // Auto consider paid when validated
                    }
                    renderRiders();
                    updateAdminDashboardDrivers();
                    alert(`Profil de ${rider.name} validé et publié sur la carte !`);
                }
            });
        });
        
        document.querySelectorAll('.btn-table-action.suspend').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const rider = findRiderById(id);
                if (rider) {
                    rider.status = 'suspendu';
                    rider.subscriptionPaid = false;
                    renderRiders();
                    updateAdminDashboardDrivers();
                    alert(`Profil de ${rider.name} suspendu et masqué de la carte.`);
                }
            });
        });
        
        document.querySelectorAll('.btn-table-action.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("Voulez-vous vraiment supprimer définitivement ce livreur de la plateforme ?")) {
                    deleteRiderById(id);
                }
            });
        });
    }

    function deleteRiderById(id) {
        STATE.riders.ouaga = STATE.riders.ouaga.filter(r => r.id !== id);
        STATE.riders.bobo = STATE.riders.bobo.filter(r => r.id !== id);
        
        renderRiders();
        updateAdminDashboardDrivers();
        updateAdminDashboardStats();
        
        alert("Livreur supprimé définitivement de la plateforme.");
    }
    
    function updateAdminDashboardChats() {
        adminChatSessions.innerHTML = '';
        const activeChatIds = Object.keys(STATE.chats);
        
        if (activeChatIds.length === 0) {
            adminChatSessions.innerHTML = `
                <div class="no-session-placeholder">
                    Aucun échange de chat enregistré pour le moment dans cette session.
                </div>
            `;
            return;
        }
        
        activeChatIds.forEach(riderId => {
            const rider = findRiderById(riderId);
            if (!rider) return;
            
            const messages = STATE.chats[riderId];
            if (messages.length === 0) return;
            
            const lastMsg = messages[messages.length - 1];
            const msgSnippet = lastMsg.text;
            const msgTime = lastMsg.time;
            
            const row = document.createElement('div');
            row.className = 'session-item-row';
            row.innerHTML = `
                <div class="session-info">
                    <div class="session-avatar">${rider.initial}</div>
                    <div>
                        <div class="session-driver-name">${rider.name}</div>
                        <div class="session-last-msg">${msgSnippet}</div>
                    </div>
                </div>
                <div style="text-align: right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <span style="font-size: 0.65rem; color: var(--color-charcoal-muted);">${msgTime}</span>
                    <span class="session-badge-count">${messages.length}</span>
                </div>
            `;
            
            row.addEventListener('click', () => {
                openAdminConversationInspector(riderId);
            });
            
            adminChatSessions.appendChild(row);
        });
    }
    
    function openAdminConversationInspector(riderId) {
        const rider = findRiderById(riderId);
        if (!rider) return;
        
        // Hide list, show inspector pane
        adminChatSessions.classList.add('hidden');
        adminInspector.classList.remove('hidden');
        
        inspectorTitle.innerHTML = `Discussion avec <strong>${rider.name}</strong>`;
        
        renderInspectorMessages(riderId);
    }
    
    function renderInspectorMessages(riderId) {
        inspectorMessagesList.innerHTML = '';
        const messages = STATE.chats[riderId] || [];
        
        messages.forEach(msg => {
            const bubble = document.createElement('div');
            // If sender is client, it looks like a "sent" bubble to the viewer. Let's color-code appropriately
            bubble.className = `chat-message ${msg.sender === 'client' ? 'sent' : 'received'}`;
            // Prefix names to make monitoring transparent and ultra-premium
            const senderLabel = msg.sender === 'client' ? 'Client' : 'Livreur';
            bubble.innerHTML = `<strong>${senderLabel} :</strong> ${msg.text}<span class="message-time">${msg.time}</span>`;
            inspectorMessagesList.appendChild(bubble);
        });
        
        inspectorMessagesList.scrollTop = inspectorMessagesList.scrollHeight;
    }
    
    function closeAdminConversationInspector() {
        adminInspector.classList.add('hidden');
        adminChatSessions.classList.remove('hidden');
    }
    
    function updateAdminDashboardStats() {
        statTotalUnlocks.innerText = STATE.totalUnlocks;
        statTotalRevenue.innerText = `${STATE.totalRevenue} FCFA`;
        statTotalDrivers.innerText = STATE.riders.ouaga.length + STATE.riders.bobo.length;
        statTotalMessages.innerText = STATE.totalMessages;
        
        const viewedProfilesEl = document.getElementById('stat-total-viewed-profiles');
        if (viewedProfilesEl) {
            viewedProfilesEl.innerText = STATE.totalViewedProfiles || 0;
        }
    }

    function triggerGeolocation() {
        // Toggle loader and hide button
        btnGeoLocate.classList.add('hidden');
        geoLoader.classList.remove('hidden');

        // Reset any existing styling
        geoStatusCard.className = 'geo-status-card';
        document.getElementById('geo-status-title').innerText = "Recherche GPS...";
        document.getElementById('geo-status-text').innerText = "Demande d'autorisation de position et calcul de vos coordonnées...";

        if (!navigator.geolocation) {
            handleGeoError("Géolocalisation non supportée par votre navigateur.");
            return;
        }

        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Save coordinates into inputs
                driverLatInput.value = lat;
                driverLngInput.value = lng;
                hasGpsLocation = true;

                // Update Geolocation status card visual to success
                geoLoader.classList.add('hidden');
                btnGeoLocate.classList.remove('hidden');
                btnGeoLocate.innerText = "✓ Recalibrer";
                btnGeoLocate.style.backgroundColor = "var(--color-primary-green)";
                btnGeoLocate.style.borderColor = "var(--color-primary-green)";
                
                geoStatusCard.classList.add('success-style');
                document.getElementById('geo-status-title').innerText = "✓ Position GPS Enregistrée";
                document.getElementById('geo-status-text').innerText = `Vos coordonnées (${lat.toFixed(5)}, ${lng.toFixed(5)}) ont été verrouillées avec succès.`;

                // Present confirmation map wrapper
                mapPickerWrapper.classList.remove('hidden');
                gpsFallbackHint.classList.add('hidden');

                // Initialize picker map and center at this position
                setTimeout(() => {
                    initPickerMap(lat, lng, true); // true = locked/read-only
                }, 100);
            },
            (error) => {
                let errorMsg = "Impossible d'accéder à votre signal GPS.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = "Autorisation GPS refusée. Veuillez autoriser la localisation ou utiliser la sélection de secours.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = "Signal GPS indisponible. Veuillez utiliser le repérage de secours.";
                } else if (error.code === error.TIMEOUT) {
                    errorMsg = "Délai d'attente GPS dépassé. Veuillez utiliser le repérage de secours.";
                }
                handleGeoError(errorMsg);
            },
            geoOptions
        );
    }

    function handleGeoError(msg) {
        geoLoader.classList.add('hidden');
        btnGeoLocate.classList.remove('hidden');
        btnGeoLocate.innerText = "Réessayer";
        btnGeoLocate.style.backgroundColor = ""; // fallback to default CSS style
        btnGeoLocate.style.borderColor = "";

        geoStatusCard.className = 'geo-status-card error-style';
        document.getElementById('geo-status-title').innerText = "⚠️ Échec de la localisation";
        document.getElementById('geo-status-text').innerText = msg;

        // Show confirmation map unlocked as a graceful manual fallback
        mapPickerWrapper.classList.remove('hidden');
        gpsFallbackHint.classList.remove('hidden');
        
        hasGpsLocation = false;

        // Init picker map centered on the default city center and allow dragging/picking
        const center = STATE.cityCenters[STATE.currentCity];
        setTimeout(() => {
            initPickerMap(center.lat, center.lng, false); // false = unlocked
        }, 100);
    }

    function locateClientAndLaunchMap() {
        const btnMapCard = document.getElementById('loc-btn-map');
        let iconEl = null;
        let originalIcon = "📍";
        
        if (btnMapCard) {
            iconEl = btnMapCard.querySelector('.loc-option-icon');
            if (iconEl) {
                originalIcon = iconEl.innerHTML;
                iconEl.innerHTML = `<div class="geo-spinner" style="width: 24px; height: 24px; border-top-color: var(--color-primary-red); margin: 0 auto;"></div>`;
            }
            btnMapCard.style.pointerEvents = 'none'; // prevent double clicks
        }

        if (!navigator.geolocation) {
            if (iconEl) iconEl.innerHTML = originalIcon;
            if (btnMapCard) btnMapCard.style.pointerEvents = 'auto';
            STATE.clientCoordinates = null;
            switchCity(portalSelectedCity);
            showMapView();
            closeLocationPortal();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Save visitor coordinates
                STATE.clientCoordinates = { lat: lat, lng: lng };

                // Restore card status
                if (iconEl) iconEl.innerHTML = originalIcon;
                if (btnMapCard) btnMapCard.style.pointerEvents = 'auto';

                // Center on visitor position inside the selected city
                switchCity(portalSelectedCity);
                showMapView();
                closeLocationPortal();
            },
            (error) => {
                // If denied or failed, fall back gracefully to default city map
                if (iconEl) iconEl.innerHTML = originalIcon;
                if (btnMapCard) btnMapCard.style.pointerEvents = 'auto';
                
                STATE.clientCoordinates = null;
                alert("ℹ️ Autorisation GPS refusée ou indisponible. Chargement de la carte par défaut.");

                switchCity(portalSelectedCity);
                showMapView();
                closeLocationPortal();
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    function resetPortalSearchState() {
        const magnifierBtn = document.querySelector('.btn-portal-search-magnifier');
        const searchCaption = document.querySelector('.portal-search-caption');
        if (magnifierBtn) {
            magnifierBtn.disabled = false;
            magnifierBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        }
        if (searchCaption) {
            searchCaption.innerText = "Lancer la recherche";
        }
    }

    // Helper to calculate distance in km using Haversine formula
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2-lat1);
        const dLon = deg2rad(lon2-lon1); 
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    function syncCityButtonsState() {
        cityButtons.forEach(btn => {
            const city = btn.getAttribute('data-city');
            if (city === STATE.currentCity) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // --- EVENT BINDINGS ---
    
    // Welcome Portal options click events - opens manual city selection drawer
    portalBtnFind.addEventListener('click', () => {
        openLocationPortal();
    });

    if (portalBtnRegister) {
        portalBtnRegister.addEventListener('click', () => {
            openDriverDrawer();
        });
    }
    
    // City switcher
    cityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const city = btn.getAttribute('data-city');
            switchCity(city);
        });
    });

    // Nav Switchers
    navBtnFind.addEventListener('click', () => {
        closeDriverDrawer();
        openLocationPortal();
    });

    navBtnRegister.addEventListener('click', () => {
        openDriverDrawer();
    });

    // Bottom sheet close
    btnCloseSheet.addEventListener('click', closeRiderSheet);

    // Reviews modal events
    sheetRiderRatingTrigger.addEventListener('click', openReviewsModal);
    btnCloseReviews.addEventListener('click', closeReviewsModal);

    // Click on Logo returns to home state
    document.getElementById('logo-home').addEventListener('click', (e) => {
        e.preventDefault();
        returnToWelcomePortal();
    });

    // Payment interactions
    btnUnlockContact.addEventListener('click', openPaymentModal);
    btnClosePaymentModal.addEventListener('click', closePaymentModal);

    methodOrange.addEventListener('click', () => handleProviderSelect(methodOrange, 'Orange Money'));
    methodMoov.addEventListener('click', () => handleProviderSelect(methodMoov, 'Moov Money'));

    btnSubmitMomo.addEventListener('click', startPaymentSimulation);
    btnUssdCancel.addEventListener('click', () => {
        // Reset back to payment details step
        paymentFormStep.style.display = 'block';
        paymentUssdStep.style.display = 'none';
    });

    // Simulated PIN auto-fill or direct typing in simulation phone
    ussdPinInput.addEventListener('click', () => {
        // Automatically fills in typical code 1234 or lets them type
        if (!ussdPinInput.value) {
            ussdPinInput.value = '1234';
        }
    });

    btnUssdConfirm.addEventListener('click', triggerUssdConfirmation);
    btnViewUnlockedRider.addEventListener('click', completePaymentFlow);

    // Onboarding interactions
    btnCloseDrawer.addEventListener('click', closeDriverDrawer);
    btnReturnMap.addEventListener('click', closeDriverDrawer);
    btnGeoLocate.addEventListener('click', triggerGeolocation);

    // Vehicle Option Cards selection
    vehicleOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            vehicleOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            driverSelectedVehicle = opt.getAttribute('data-vehicle');
        });
    });

    // Bind uploads
    setupUploadPreview(uploadCniRecto, boxUploadCniRecto, previewCniRecto);
    setupUploadPreview(uploadCniVerso, boxUploadCniVerso, previewCniVerso);
    setupUploadPreview(uploadSelfie, boxUploadSelfie, previewSelfie);

    btnRemoveCniRecto.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUploadBox(boxUploadCniRecto, previewCniRecto);
    });

    btnRemoveCniVerso.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUploadBox(boxUploadCniVerso, previewCniVerso);
    });

    btnRemoveSelfie.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUploadBox(boxUploadSelfie, previewSelfie);
    });

    // Registration submit handler
    driverForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Geolocation validation check
        if (!driverLatInput.value || !driverLngInput.value) {
            alert("Veuillez d'abord enregistrer votre position GPS en cliquant sur « Me géolocaliser ».");
            return;
        }
        
        // Get Form Values (simulating submission)
        const name = document.getElementById('driver-name').value;
        const phone = document.getElementById('driver-phone').value;
        const password = document.getElementById('driver-password').value;
        
        // Hide Form panel, Show confirmation success panel
        driverRegisterPanel.classList.add('hidden');
        driverSuccessPanel.style.display = 'block';

        // Dynamically append the new driver onto our map list so it becomes visual instantly!
        const latLng = STATE.pickerMarker.getLatLng();
        const firstInitials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'L';
        const newRider = {
            id: 'mock_' + Date.now(),
            name: name,
            vehicle: driverSelectedVehicle,
            distance: 'à proximité',
            phone: '+226 ' + phone,
            lat: latLng.lat,
            lng: latLng.lng,
            initial: firstInitials,
            contactsCount: 0,
            subscriptionPaid: false,
            password: password,
            viewsCount: 0,
            rating: 5.0,
            reviews: [],
            status: 'actif' // Start active, but can't access Espace Livreur dashboard without weekly sub (500 FCFA)
        };

        // Add to active city list
        STATE.riders[STATE.currentCity].unshift(newRider);
        
        // Set logged-in session for the registered driver
        STATE.loggedDriver = newRider;
        
        // Redraw markers with the newly added rider
        renderRiders();
    });

    // --- LIVE CHAT DRAWER & ADMIN PANEL EVENT BINDINGS ---
    
    // Chat button trigger
    btnChatRider.addEventListener('click', () => {
        if (STATE.selectedRider) {
            if (STATE.loggedClient && STATE.loggedClient.subscriptionPaid === true) {
                openChatDrawer(STATE.selectedRider);
            } else {
                alert("💬 La messagerie directe intégrée est réservée aux clients abonnés Premium (5 000 FCFA/mois).\n\nVeuillez vous connecter et activer votre abonnement pour clavarder en direct. Les visiteurs standards peuvent utiliser les appels téléphoniques classiques.");
                openAuthModal();
            }
        }
    });

    // Close chat drawer
    btnCloseChat.addEventListener('click', () => {
        chatDrawer.classList.remove('open');
    });

    // Chat form submit
    chatSendForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendClientMessage();
    });

    // --- SLEEK UNIFIED AUTH MODAL CONTROLLERS & EVENT BINDINGS ---
    
    function switchAuthPanel(panel) {
        if (panel === 'login') {
            authLoginPanel.classList.remove('hidden');
            authClientRegisterSection.classList.add('hidden');
        } else if (panel === 'register') {
            authLoginPanel.classList.add('hidden');
            authClientRegisterSection.classList.remove('hidden');
        }
    }

    function openAuthModal() {
        if (STATE.isAdmin) {
            openAdminModal();
            return;
        }
        if (STATE.loggedDriver) {
            openDriverDrawer();
            return;
        }
        if (STATE.loggedClient) {
            openClientDrawer();
            return;
        }
        authModal.classList.add('open');
        switchAuthPanel('login');
        authLoginForm.reset();
        authClientRegisterForm.reset();
    }

    function closeAuthModal() {
        authModal.classList.remove('open');
    }

    // Toggle Unified Auth Modal
    btnNavLogin.addEventListener('click', () => {
        openAuthModal();
    });

    btnCloseAuth.addEventListener('click', () => {
        closeAuthModal();
    });

    // Panel redirects inside Auth modal
    linkToClientRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthPanel('register');
    });

    linkToDriverRegister.addEventListener('click', (e) => {
        e.preventDefault();
        closeAuthModal();
        openDriverDrawer();
    });

    linkToLoginPanel.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthPanel('login');
    });

    // Unified Login Form Submit (Credentials auto-detection)
    authLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const phoneInputVal = authLoginPhone.value.trim();
        const passwordInputVal = authLoginPassword.value.trim();
        
        // 1. Check if Admin
        if (phoneInputVal === "67370909" && passwordInputVal === "12345678") {
            STATE.isAdmin = true;
            closeAuthModal();
            openAdminModal();
            renderRiders();
            alert("👑 Bienvenue Ibrahim ! Mode Administrateur Activé. Accès total et gratuit.");
            return;
        }
        
        // Normalize phones for lookup
        const phoneNormalized = '+226 ' + phoneInputVal.replace(/\s+/g, '').replace(/^\+226/, '');
        
        // 2. Check if Livreur
        const allDrivers = [...STATE.riders.ouaga, ...STATE.riders.bobo];
        let driver = allDrivers.find(r => {
            const p1 = r.phone.replace(/\s+/g, '');
            const p2 = phoneNormalized.replace(/\s+/g, '');
            return p1 === p2 || p1.includes(p2) || p2.includes(p1);
        });
        
        if (driver) {
            if (driver.password === passwordInputVal) {
                STATE.loggedDriver = driver;
                closeAuthModal();
                
                // Weekly Subscription checking for Espace Livreur dashboard
                if (driver.subscriptionPaid === true || (driver.contactsCount || 0) < 5) {
                    // Force drawer dashboard view directly
                    driverRegisterPanel.classList.add('hidden');
                    driverLoginPanel.classList.add('hidden');
                    driverDashboardPanel.classList.remove('hidden');
                    openDriverDrawer();
                } else {
                    // Weekly sub required (500 FCFA).
                    STATE.pendingSubscriptionUnlock = true;
                    openPaymentModal();
                    alert("⚠️ Abonnement requis pour accéder à votre Espace Livreur. Une demande de paiement de 500 FCFA a été initiée.");
                }
                return;
            } else {
                alert("❌ Mot de passe incorrect pour ce compte livreur.");
                return;
            }
        }
        
        // 3. Check if Client
        let client = STATE.clients.find(c => {
            const p1 = c.phone.replace(/\s+/g, '');
            const p2 = phoneNormalized.replace(/\s+/g, '');
            return p1 === p2 || p1.includes(p2) || p2.includes(p1);
        });
        
        if (client) {
            if (client.password === passwordInputVal) {
                STATE.loggedClient = client;
                closeAuthModal();
                
                if (client.subscriptionPaid === true) {
                    openClientDrawer();
                } else {
                    // Client monthly premium payment required (5 000 FCFA)
                    STATE.pendingClientSubscriptionUnlock = true;
                    openPaymentModal();
                    alert("⚠️ Abonnement requis pour accéder à votre Espace Client. Une demande de paiement de 5 000 FCFA a été initiée.");
                }
                return;
            } else {
                alert("❌ Mot de passe incorrect pour ce compte client.");
                return;
            }
        }
        
        // Compte non trouvé
        alert("❌ Aucun compte trouvé avec ce numéro. Si vous êtes un client, veuillez cliquer sur 'Créer un compte Client'. Si vous êtes livreur, cliquez sur 'S'enregistrer comme livreur'.");
    });

    // Client Signup Submit Form
    authClientRegisterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const phoneVal = authClientRegisterPhone.value.trim();
        const passwordVal = authClientRegisterPassword.value.trim();
        
        const phoneNormalized = '+226 ' + phoneVal;
        
        // Verify if client already exists
        let exists = STATE.clients.find(c => c.phone.replace(/\s+/g, '') === phoneNormalized.replace(/\s+/g, ''));
        if (exists) {
            alert("❌ Un compte client avec ce numéro existe déjà. Veuillez vous connecter.");
            switchAuthPanel('login');
            return;
        }
        
        const newClient = {
            phone: phoneNormalized,
            password: passwordVal,
            name: 'Client ' + phoneVal,
            subscriptionPaid: false,
            viewedDrivers: new Set(),
            contactedDrivers: new Set()
        };
        
        STATE.clients.push(newClient);
        STATE.loggedClient = newClient;
        
        closeAuthModal();
        
        // Automatically launch 5 000 FCFA payment monthly sub
        STATE.pendingClientSubscriptionUnlock = true;
        openPaymentModal();
        alert("🎉 Compte Client créé ! Pour activer votre compte et accéder à la messagerie directe, veuillez régler votre abonnement mensuel de 5 000 FCFA.");
    });

    // Client Dashboard elements closers & logouts
    btnCloseClientDrawer.addEventListener('click', () => {
        closeClientDrawer();
    });

    btnClientLogout.addEventListener('click', () => {
        STATE.loggedClient = null;
        closeClientDrawer();
        alert("Espace Client déconnecté.");
    });

    // Driver Dashboard Logout override
    btnDriverLogout.addEventListener('click', () => {
        STATE.loggedDriver = null;
        driverDashboardPanel.classList.add('hidden');
        driverRegisterPanel.classList.remove('hidden');
        closeDriverDrawer();
        alert("Espace Livreur déconnecté.");
    });

    // Admin Session Logout override
    btnAdminLogoutSession.addEventListener('click', () => {
        STATE.isAdmin = false;
        renderRiders();
        alert("Session Administrateur déconnectée.");
        closeAdminModal();
    });

    // Close admin modal
    btnCloseAdmin.addEventListener('click', closeAdminModal);

    // Admin Tabs switcher
    tabChats.addEventListener('click', () => switchAdminTab('chats'));
    tabDrivers.addEventListener('click', () => switchAdminTab('drivers'));
    tabStats.addEventListener('click', () => switchAdminTab('stats'));

    // Inspector back button
    btnInspectorBack.addEventListener('click', closeAdminConversationInspector);

    // --- LOCATION SELECTION PORTAL EVENT BINDINGS ---
    
    // Close overlay button
    document.getElementById('btn-close-location-portal').addEventListener('click', closeLocationPortal);
    
    // Step 1: City options click events
    document.getElementById('loc-city-ouaga').addEventListener('click', () => {
        portalSelectedCity = 'ouaga';
        document.getElementById('loc-city-title').innerText = 'Ouagadougou';
        document.getElementById('loc-step-city').classList.add('hidden');
        document.getElementById('loc-step-options').classList.remove('hidden');
    });
    
    document.getElementById('loc-city-bobo').addEventListener('click', () => {
        portalSelectedCity = 'bobo';
        document.getElementById('loc-city-title').innerText = 'Bobo-Dioulasso';
        document.getElementById('loc-step-city').classList.add('hidden');
        document.getElementById('loc-step-options').classList.remove('hidden');
    });
    
    // Step 2: Access mode selection
    document.getElementById('loc-btn-map').addEventListener('click', () => {
        locateClientAndLaunchMap();
    });
    
    document.getElementById('loc-btn-sectors').addEventListener('click', () => {
        document.getElementById('loc-sectors-desc').innerText = `Quartiers disponibles à ${portalSelectedCity === 'ouaga' ? 'Ouagadougou' : 'Bobo-Dioulasso'}`;
        document.getElementById('loc-step-options').classList.add('hidden');
        document.getElementById('loc-step-sectors').classList.remove('hidden');
        renderSectorChips();
        document.getElementById('sectors-search-input').value = '';
    });
    
    document.getElementById('btn-loc-back-city').addEventListener('click', () => {
        document.getElementById('loc-step-options').classList.add('hidden');
        document.getElementById('loc-step-city').classList.remove('hidden');
    });
    
    // Step 3: Neighborhood chip interactions
    document.getElementById('sectors-search-input').addEventListener('input', (e) => {
        renderSectorChips(e.target.value);
    });
    
    document.getElementById('btn-loc-back-options').addEventListener('click', () => {
        document.getElementById('loc-step-sectors').classList.add('hidden');
        document.getElementById('loc-step-options').classList.remove('hidden');
    });
    
    // Active zone toast close action
    document.getElementById('btn-close-sector-toast').addEventListener('click', () => {
        document.getElementById('sector-active-toast').classList.remove('show');
    });

    // SMS OTP Tab Toggling
    if (tabAuthPassword && tabAuthOtp) {
        tabAuthPassword.addEventListener('click', () => {
            tabAuthPassword.classList.add('active');
            tabAuthOtp.classList.remove('active');
            authLoginPanel.classList.remove('hidden');
            authOtpPanel.classList.add('hidden');
        });

        tabAuthOtp.addEventListener('click', () => {
            tabAuthOtp.classList.add('active');
            tabAuthPassword.classList.remove('active');
            authOtpPanel.classList.remove('hidden');
            authLoginPanel.classList.add('hidden');
            
            // Reset OTP panel state
            otpPhoneGroup.classList.remove('hidden');
            otpCodeGroup.classList.add('hidden');
            authOtpPhoneInput.value = '';
            authOtpCodeInput.value = '';
        });
    }

    // Send OTP Simulated SMS Action
    if (btnSendOtp) {
        btnSendOtp.addEventListener('click', () => {
            const phoneVal = authOtpPhoneInput.value.trim();
            if (phoneVal.length < 8) {
                alert("Veuillez saisir un numéro de téléphone valide à 8 chiffres.");
                return;
            }

            const phoneNormalized = '+226 ' + phoneVal;
            
            // Generate simulated 4-digit code
            const mockOTPCode = String(Math.floor(1000 + Math.random() * 9000));
            STATE.activeOTPCode = mockOTPCode;
            STATE.activeOTPPhone = phoneNormalized;

            // Trigger simulated SMS Toast slide-in
            if (smsOtpToast && smsOtpToastBody) {
                smsOtpToastBody.innerHTML = `LIVRAISON RAPIDE : Votre code de vérification est <strong>${mockOTPCode}</strong>. Valide pendant 5 minutes. (Cliquez pour copier)`;
                smsOtpToast.classList.add('show');
                
                // Clicking on toast auto-fills and copies it
                smsOtpToast.onclick = () => {
                    authOtpCodeInput.value = mockOTPCode;
                    smsOtpToast.classList.remove('show');
                };

                // Auto-dismiss toast after 8 seconds
                setTimeout(() => {
                    smsOtpToast.classList.remove('show');
                }, 8000);
            }

            // Slide phone group out, code group in
            otpPhoneGroup.classList.add('hidden');
            otpCodeGroup.classList.remove('hidden');
            authOtpCodeInput.focus();
        });
    }

    // OTP Verification Submit Handler
    if (authOtpForm) {
        authOtpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const typedCode = authOtpCodeInput.value.trim();
            
            if (typedCode !== STATE.activeOTPCode) {
                alert("❌ Code OTP incorrect. Veuillez réessayer ou demander un nouveau code.");
                return;
            }

            // OTP verified! Auto-detect user role using phone
            const phoneNormalized = STATE.activeOTPPhone;
            
            // Check if admin
            if (phoneNormalized.replace(/\s+/g, '') === "+22667370909") {
                STATE.isAdmin = true;
                closeAuthModal();
                openAdminModal();
                renderRiders();
                alert("👑 Bienvenue Ibrahim (OTP) ! Mode Administrateur Activé. Accès total et gratuit.");
                return;
            }

            // Check if Driver
            const allDrivers = [...STATE.riders.ouaga, ...STATE.riders.bobo];
            let driver = allDrivers.find(r => r.phone.replace(/\s+/g, '') === phoneNormalized.replace(/\s+/g, ''));
            if (driver) {
                STATE.loggedDriver = driver;
                closeAuthModal();
                
                if (driver.subscriptionPaid === true || (driver.contactsCount || 0) < 5) {
                    driverRegisterPanel.classList.add('hidden');
                    driverLoginPanel.classList.add('hidden');
                    driverDashboardPanel.classList.remove('hidden');
                    openDriverDrawer();
                } else {
                    STATE.pendingSubscriptionUnlock = true;
                    openPaymentModal();
                    alert("⚠️ Abonnement requis pour accéder à votre Espace Livreur. Une demande de paiement de 500 FCFA a été initiée.");
                }
                return;
            }

            // Check if Client
            let client = STATE.clients.find(c => c.phone.replace(/\s+/g, '') === phoneNormalized.replace(/\s+/g, ''));
            if (client) {
                STATE.loggedClient = client;
                closeAuthModal();
                
                if (client.subscriptionPaid === true) {
                    openClientDrawer();
                } else {
                    STATE.pendingClientSubscriptionUnlock = true;
                    openPaymentModal();
                    alert("⚠️ Abonnement requis pour accéder à votre Espace Client. Une demande de paiement de 5 000 FCFA a été initiée.");
                }
                return;
            }

            // If new user, create a Client profile automatically
            const newClient = {
                phone: phoneNormalized,
                password: '123',
                name: 'Client ' + phoneNormalized.substring(5),
                subscriptionPaid: false,
                viewedDrivers: new Set(),
                contactedDrivers: new Set()
            };
            STATE.clients.push(newClient);
            STATE.loggedClient = newClient;
            
            closeAuthModal();
            
            // Pay Monthly sub
            STATE.pendingClientSubscriptionUnlock = true;
            openPaymentModal();
            alert("🎉 Nouveau compte client créé par SMS OTP ! Veuillez activer votre abonnement mensuel (5 000 FCFA) pour accéder à l'Espace Client.");
        });
    }

    // Chat Quick-Reply suggestion chips click bindings
    if (chatQuickReplies) {
        const chips = chatQuickReplies.querySelectorAll('.reply-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chatInput.value = chip.innerText;
                sendClientMessage();
            });
        });
    }

    // Driver Virtual Wallet click bindings
    if (btnDriverRechargeWallet) {
        btnDriverRechargeWallet.addEventListener('click', () => {
            STATE.pendingWalletRecharge = true;
            openPaymentModal();
            alert("⚡ Rechargement de votre Portefeuille Livreur : Une transaction Mobile Money de 2 000 FCFA a été initiée.");
        });
    }

    if (btnDriverPaySubWallet) {
        btnDriverPaySubWallet.addEventListener('click', () => {
            if (!STATE.loggedDriver) return;
            const driver = STATE.loggedDriver;
            
            if ((driver.walletBalance || 0) < 500) {
                alert("❌ Solde insuffisant dans votre portefeuille. Veuillez recharger par Mobile Money.");
                return;
            }

            // Deduct from wallet
            driver.walletBalance -= 500;
            driver.subscriptionPaid = true;
            
            // Add wallet payment entry for admin subscription logs
            STATE.totalRevenue += 500;
            
            // Refresh
            renderRiders();
            updateDriverDashboardView();
            updateAdminDashboardDrivers();
            updateAdminDashboardStats();
            
            alert("✓ Abonnement payé avec succès depuis votre portefeuille virtuel ! Visibilité réactivée sur la carte.");
        });
    }

    // Boot the main Leaflet map immediately in the background under the glass welcome card
    initMainMap();
    mapInitialized = true;
});
