// Application Logic for "Livraison Rapide"
// Powered by Vanilla JavaScript + Leaflet.js

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    const STATE = {
        currentCity: 'ouaga', // 'ouaga' or 'bobo'
        selectedRider: null,
        unlockedRiders: new Set(), // Set of rider IDs that have been unlocked
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
        riders: {
            ouaga: [
                { id: 'o1', name: 'Idrissa Sawadogo', vehicle: 'Moto 135cc', distance: '0.4 km', phone: '+226 76 45 82 10', lat: 12.3685, lng: -1.5152, initial: 'IS', contactsCount: 4, subscriptionPaid: false },
                { id: 'o2', name: 'Moussa Kaboré', vehicle: 'Scooter Crypton', distance: '1.8 km', phone: '+226 70 89 41 23', lat: 12.3552, lng: -1.5024, initial: 'MK', contactsCount: 2, subscriptionPaid: false },
                { id: 'o3', name: 'Alassane Diallo', vehicle: 'Moto 150cc', distance: '3.2 km', phone: '+226 77 12 34 56', lat: 12.3391, lng: -1.5304, initial: 'AD', contactsCount: 5, subscriptionPaid: false },
                { id: 'o4', name: 'Abdoulaye Ouédraogo', vehicle: 'Moto 135cc', distance: '4.1 km', phone: '+226 65 77 88 99', lat: 12.3854, lng: -1.5412, initial: 'AO', contactsCount: 1, subscriptionPaid: false },
                { id: 'o5', name: 'Adama Sanou', vehicle: 'Scooter Crypton', distance: '3.9 km', phone: '+226 71 50 60 70', lat: 12.3920, lng: -1.4985, initial: 'AS', contactsCount: 5, subscriptionPaid: true },
                { id: 'o6', name: 'Yacouba Traoré', vehicle: 'Vélo / VTT', distance: '2.5 km', phone: '+226 76 99 88 77', lat: 12.3582, lng: -1.5540, initial: 'YT', contactsCount: 0, subscriptionPaid: false },
                { id: 'o7', name: 'Cheick Barry', vehicle: 'Moto 135cc', distance: '0.9 km', phone: '+226 72 11 22 33', lat: 12.3732, lng: -1.5285, initial: 'CB', contactsCount: 3, subscriptionPaid: false },
                { id: 'o8', name: 'Boubacar Sidibé', vehicle: 'Scooter', distance: '1.1 km', phone: '+226 66 55 44 33', lat: 12.3601, lng: -1.5212, initial: 'BS', contactsCount: 4, subscriptionPaid: false }
            ],
            bobo: [
                { id: 'b1', name: 'Sékou Sangaré', vehicle: 'Moto 135cc', distance: '0.6 km', phone: '+226 76 11 22 99', lat: 11.1812, lng: -4.2924, initial: 'SS', contactsCount: 4, subscriptionPaid: false },
                { id: 'b2', name: 'Drissa Barro', vehicle: 'Scooter Crypton', distance: '2.2 km', phone: '+226 70 54 87 21', lat: 11.1685, lng: -4.2854, initial: 'DB', contactsCount: 1, subscriptionPaid: false },
                { id: 'b3', name: 'Issouf Dao', vehicle: 'Moto 150cc', distance: '2.8 km', phone: '+226 77 98 65 32', lat: 11.1942, lng: -4.3120, initial: 'ID', contactsCount: 5, subscriptionPaid: false },
                { id: 'b4', name: 'Hamidou Coulibaly', vehicle: 'Scooter', distance: '1.1 km', phone: '+226 65 33 22 11', lat: 11.1714, lng: -4.3054, initial: 'HC', contactsCount: 2, subscriptionPaid: false },
                { id: 'b5', name: 'Karim Sanogo', vehicle: 'Vélo / VTT', distance: '1.9 km', phone: '+226 71 88 55 44', lat: 11.1852, lng: -4.3214, initial: 'KS', contactsCount: 3, subscriptionPaid: false },
                { id: 'b6', name: 'Ousmane Ouattara', vehicle: 'Moto 135cc', distance: '1.5 km', phone: '+226 72 32 11 00', lat: 11.1620, lng: -4.2995, initial: 'OO', contactsCount: 5, subscriptionPaid: true }
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
    const portalBtnFind = document.getElementById('portal-btn-find');
    const portalBtnRegister = document.getElementById('portal-btn-register');
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
    const btnAdminFloating = document.getElementById('btn-admin-floating');
    const adminChatBadge = document.getElementById('admin-chat-badge');
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

    // Onboarding file inputs & vehicle selection
    const uploadCni = document.getElementById('upload-cni');
    const uploadSelfie = document.getElementById('upload-selfie');
    const previewCni = document.getElementById('preview-cni');
    const previewSelfie = document.getElementById('preview-selfie');
    const boxUploadCni = document.getElementById('box-upload-cni');
    const boxUploadSelfie = document.getElementById('box-upload-selfie');
    const btnRemoveCni = document.getElementById('btn-remove-cni');
    const btnRemoveSelfie = document.getElementById('btn-remove-selfie');
    const vehicleOptions = document.querySelectorAll('.vehicle-option');

    let driverSelectedVehicle = 'Moto'; // Default selected vehicle
    let mapInitialized = false;

    // --- INITIALIZE MAPS ---
    function initMainMap() {
        const defaultCenter = STATE.cityCenters[STATE.currentCity];
        
        // Leaflet options - disabled inertia for snap responses on mobile
        STATE.map = L.map('map', {
            zoomControl: false, // Custom position or fallback
            attributionControl: false // Styled minimal foot
        }).setView([defaultCenter.lat, defaultCenter.lng], 13);

        // CartoDB Positron - Beautiful minimalist Light gray tiles (ideal for Wave UI look)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            minZoom: 10
        }).addTo(STATE.map);

        // Add standard zoom control at top-right
        L.control.zoom({
            position: 'topleft'
        }).addTo(STATE.map);

        // Load riders markers
        renderRiders();
    }

    function renderRiders() {
        // Clear old markers
        STATE.markers.forEach(m => STATE.map.removeLayer(m));
        STATE.markers = [];

        const cityRiders = STATE.riders[STATE.currentCity];
        
        // Filter out suspended drivers (5+ contacts without subscription paid)
        const visibleRiders = cityRiders.filter(rider => {
            const count = rider.contactsCount || 0;
            const paid = rider.subscriptionPaid || false;
            return count < 5 || paid;
        });
        
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

    // Initialize Map Picker for driver registration
    function initPickerMap() {
        if (STATE.pickerMap) return; // Prevent double init
        
        const center = STATE.cityCenters[STATE.currentCity];
        
        STATE.pickerMap = L.map('map-picker', {
            zoomControl: false,
            attributionControl: false
        }).setView([center.lat, center.lng], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(STATE.pickerMap);

        // Add a red terracotta draggable pin for the driver location selector
        const redPinIcon = L.divIcon({
            className: 'custom-marker-picker',
            html: `<div class="rider-pin rider-pin-active"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        STATE.pickerMarker = L.marker([center.lat, center.lng], {
            draggable: true,
            icon: redPinIcon
        }).addTo(STATE.pickerMap);

        // Drag events
        STATE.pickerMarker.on('dragend', function (event) {
            const position = STATE.pickerMarker.getLatLng();
            updateGpsLabel(position.lat, position.lng);
        });

        // Click on map to place pin
        STATE.pickerMap.on('click', function (e) {
            STATE.pickerMarker.setLatLng(e.latlng);
            updateGpsLabel(e.latlng.lat, e.latlng.lng);
        });

        updateGpsLabel(center.lat, center.lng);
    }

    function updateGpsLabel(lat, lng) {
        gpsStatusDesc.innerHTML = `<strong>Position enregistrée :</strong> Secteur défini (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        gpsStatusDesc.style.color = 'var(--color-green-soft)';
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

    // --- RIDER DETAILS MANAGEMENT ---
    function selectRider(rider) {
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

        // Check if unlocked
        if (STATE.unlockedRiders.has(rider.id)) {
            sheetPhoneMasked.innerText = rider.phone;
            sheetPhoneMasked.classList.remove('phone-masked');
            btnUnlockContact.classList.add('hidden');
            btnCallRider.classList.remove('hidden');
            btnChatRider.classList.remove('hidden');
            btnCallRider.setAttribute('href', `tel:${rider.phone.replace(/\s+/g, '')}`);
        } else {
            sheetPhoneMasked.innerText = '+226 ' + rider.phone.substring(5, 7) + ' •• •• ••';
            sheetPhoneMasked.classList.add('phone-masked');
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
        if (!STATE.selectedRider) return;

        // Reset to first step
        paymentFormStep.style.display = 'block';
        paymentUssdStep.style.display = 'none';
        paymentSuccessStep.style.display = 'none';
        
        momoPhoneInput.value = '';
        ussdPinInput.value = '';
        btnSubmitMomo.disabled = false;
        btnSubmitMomo.innerText = 'Lancer le paiement';
        
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

            // Save rider as unlocked
            if (STATE.selectedRider) {
                STATE.unlockedRiders.add(STATE.selectedRider.id);
                
                // Increment contact count for the rider
                const rider = findRiderById(STATE.selectedRider.id);
                if (rider) {
                    if (rider.contactsCount === undefined) rider.contactsCount = 0;
                    rider.contactsCount++;
                }
                
                // Track Admin Statistics
                STATE.totalUnlocks++;
                STATE.totalRevenue += 200;
                updateAdminDashboardStats();
                if (typeof updateAdminDashboardDrivers === 'function') {
                    updateAdminDashboardDrivers();
                }
            }
        }, 1800);
    }

    function completePaymentFlow() {
        closePaymentModal();
        if (STATE.selectedRider) {
            // Re-select rider to show changes (unlocked number)
            selectRider(STATE.selectedRider);
        }
    }

    // --- ONBOARDING REGISTRATION DRIVER DRAWER ---
    function openDriverDrawer() {
        driverDrawer.classList.add('open');
        
        // Reset forms
        driverForm.style.display = 'block';
        driverSuccessPanel.style.display = 'none';
        driverForm.reset();
        
        // Clear uploaded files previews
        resetUploadBox(boxUploadCni, previewCni);
        resetUploadBox(boxUploadSelfie, previewSelfie);

        // Make nav buttons visible
        navBtnFind.classList.remove('hidden');
        navBtnRegister.classList.remove('hidden');

        // Highlight "Devenir livreur" nav button
        navBtnRegister.classList.add('active');
        navBtnFind.classList.remove('active');

        // Init/Resize Picker Map
        setTimeout(() => {
            initPickerMap();
            STATE.pickerMap.invalidateSize();
        }, 300);
    }

    function closeDriverDrawer() {
        driverDrawer.classList.remove('open');
        
        // If map is active, show the map. Otherwise, return to welcome portal!
        if (mapInitialized) {
            navBtnRegister.classList.remove('active');
            navBtnFind.classList.add('active');
            welcomePortal.classList.add('hidden');
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
        }
        
        // Apply map blur depending on payment/unlock state
        updateMapBlurState();
    }

    function returnToWelcomePortal() {
        welcomePortal.classList.remove('hidden');
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

    // --- ADMIN MONITORING & TRACKING MODULE CONTROLLERS ---
    
    function openAdminModal() {
        adminModal.classList.add('open');
        
        // Reset unread notifications
        STATE.unreadAdminCount = 0;
        adminChatBadge.classList.add('hidden');
        
        // Show defaults: discussions tab
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
        const listContainer = document.getElementById('admin-drivers-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        
        const allRiders = [...STATE.riders.ouaga, ...STATE.riders.bobo];
        
        allRiders.forEach(rider => {
            const count = rider.contactsCount || 0;
            const paid = rider.subscriptionPaid || false;
            
            let statusBadgeHTML = '';
            let actionButtonHTML = '';
            
            if (count < 5) {
                statusBadgeHTML = `<span class="driver-status-badge badge-free">Gratuit (${count}/4 offerts)</span>`;
            } else if (paid) {
                statusBadgeHTML = `<span class="driver-status-badge badge-active">Abonné (Actif)</span>`;
            } else {
                statusBadgeHTML = `<span class="driver-status-badge badge-suspended">Abonnement Requis (500 FCFA)</span>`;
                actionButtonHTML = `<button class="btn-pay-sub" data-rider-id="${rider.id}">Simuler Paiement</button>`;
            }
            
            // Determine city label
            const isOuaga = STATE.riders.ouaga.some(r => r.id === rider.id);
            const cityName = isOuaga ? 'Ouaga' : 'Bobo';
            
            const card = document.createElement('div');
            card.className = 'driver-admin-card';
            card.innerHTML = `
                <div class="driver-admin-info">
                    <div class="driver-admin-avatar">${rider.initial}</div>
                    <div>
                        <div class="driver-admin-name">${rider.name} <span class="driver-city-lbl">${cityName}</span></div>
                        <div class="driver-admin-details">${rider.vehicle} • ${count} contact${count > 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="driver-admin-actions">
                    ${statusBadgeHTML}
                    ${actionButtonHTML}
                </div>
            `;
            
            listContainer.appendChild(card);
        });
        
        // Add event listeners to simulation buttons
        document.querySelectorAll('.btn-pay-sub').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const riderId = btn.getAttribute('data-rider-id');
                simulateRiderSubscriptionPayment(riderId);
            });
        });
    }

    function simulateRiderSubscriptionPayment(riderId) {
        const rider = findRiderById(riderId);
        if (!rider) return;
        
        rider.subscriptionPaid = true;
        
        // Add 500 FCFA weekly subscription to platform simulated revenue!
        STATE.totalRevenue += 500;
        updateAdminDashboardStats();
        
        // Redraw riders markers on Leaflet map (will bring them back online immediately!)
        renderRiders();
        
        // Refresh dashboard view
        updateAdminDashboardDrivers();
        
        // Premium sand alert / simulated transaction receipt
        alert(`Transaction réussie ! L'abonnement hebdomadaire de 500 FCFA a bien été crédité pour le compte de ${rider.name}. Le livreur est de nouveau visible en ligne pour les clients !`);
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
    }

    // --- EVENT BINDINGS ---
    
    // Welcome Portal options click events
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

    // Vehicle Option Cards selection
    vehicleOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            vehicleOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            driverSelectedVehicle = opt.getAttribute('data-vehicle');
        });
    });

    // Bind uploads
    setupUploadPreview(uploadCni, boxUploadCni, previewCni);
    setupUploadPreview(uploadSelfie, boxUploadSelfie, previewSelfie);

    btnRemoveCni.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUploadBox(boxUploadCni, previewCni);
    });

    btnRemoveSelfie.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUploadBox(boxUploadSelfie, previewSelfie);
    });

    // Registration submit handler
    driverForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get Form Values (simulating submission)
        const name = document.getElementById('driver-name').value;
        const phone = document.getElementById('driver-phone').value;
        
        // Hide Form, Show confirmation
        driverForm.style.display = 'none';
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
            subscriptionPaid: false
        };

        // Add to active city list
        STATE.riders[STATE.currentCity].unshift(newRider);
        
        // Redraw markers with the newly added rider
        renderRiders();
        
        // Return to map view to visually see the newly created driver!
        closeDriverDrawer();
        showMapView();
    });

    // --- LIVE CHAT DRAWER & ADMIN PANEL EVENT BINDINGS ---
    
    // Chat button trigger
    btnChatRider.addEventListener('click', () => {
        if (STATE.selectedRider) {
            openChatDrawer(STATE.selectedRider);
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

    // Floating Admin Dashboard toggle
    btnAdminFloating.addEventListener('click', () => {
        if (adminModal.classList.contains('open')) {
            closeAdminModal();
        } else {
            openAdminModal();
        }
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
        switchCity(portalSelectedCity);
        showMapView();
        closeLocationPortal();
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
});
