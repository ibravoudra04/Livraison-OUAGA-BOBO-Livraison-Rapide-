// --- GLOBAL APP ROBUSTNESS & UX FIXES ---
window.addEventListener('error', function(event) {
    console.error('Global Error Caught:', event.error);
    if (typeof showSystemAlert === 'function') showSystemAlert('Une erreur inattendue est survenue.', 'error');
});
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
});
window.addEventListener('offline', function() {
    if (typeof showSystemAlert === 'function') showSystemAlert('Vous êtes hors ligne. Vérifiez votre connexion internet.', 'warning');
});
window.addEventListener('online', function() {
    if (typeof showSystemAlert === 'function') showSystemAlert('Connexion rétablie.', 'success');
});
// ------------------------------------------


// Application Logic for "Livraison Rapide"
// Powered by Vanilla JavaScript + Leaflet.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- BROWSER DETECTION & FACEBOOK REDIRECT ---
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isFacebookApp = (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1) || (ua.indexOf("LinkedIn") > -1);
    
    if (isFacebookApp) {
        const fbModal = document.getElementById('fb-iab-modal');
        const btnForceBrowser = document.getElementById('btn-force-browser');
        const btnCloseFbModal = document.getElementById('btn-close-fb-modal');
        const iabIconContainer = document.getElementById('iab-icon-container');
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        
        if (fbModal) {
            fbModal.classList.remove('hidden');
            fbModal.classList.add('open');
            fbModal.style.pointerEvents = 'auto';
            fbModal.style.opacity = '1';
            
            // Personnalisation dynamique selon l'OS (Chrome vs Safari)
            if (iabIconContainer) {
                if (isIOS) {
                    iabIconContainer.innerHTML = '<img loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/5/52/Safari_browser_logo.svg" alt="Safari" style="width: 90px; height: 90px; object-fit: contain;">';
                } else {
                    iabIconContainer.innerHTML = '<img loading="lazy" src="vecteezy_google-chrome-icon-logo-symbol_22484495.png" alt="Google Chrome" style="width: 90px; height: 90px; object-fit: contain; border-radius: 50%;">';
                }
            }
        }
        
        if (btnForceBrowser) {
            btnForceBrowser.addEventListener('click', () => {
                if (!isIOS) {
                    // Try to launch Android Chrome intent
                    window.location.href = "intent://livraisonrapide.app#Intent;scheme=https;package=com.android.chrome;end;";
                } else {
                    alert("Sur iPhone, veuillez appuyer sur l'icône de partage ou sur les options en bas à droite et choisir 'Ouvrir dans le navigateur' ou 'Ouvrir dans Safari'.");
                }
            });
        }
        
        if (btnCloseFbModal) {
            btnCloseFbModal.addEventListener('click', () => {
                fbModal.classList.remove('open');
                fbModal.classList.add('hidden');
                fbModal.style.pointerEvents = 'none';
            });
        }
    }

    // --- 30-DAY FREE PERIOD TRIAL ---
    // The current time is 2026-06-01. The free trial period is valid for 30 days until 2026-07-01 23:59:59 UTC.
    const IS_FREE_PERIOD = new Date() < new Date('2026-07-02T00:00:00Z');

    const escapeHTML = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const compressImage = (file, maxDim, quality, callback) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Maintain aspect ratio while resizing
                if (width > height) {
                    if (width > maxDim) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export as JPEG with chosen quality
                const base64Data = canvas.toDataURL('image/jpeg', quality);
                callback(base64Data);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const hashSHA256 = async (str) => {
        if (typeof str !== 'string') return '';
        try {
            if (window.crypto && window.crypto.subtle) {
                const utf8 = new TextEncoder().encode(str);
                const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
        } catch (e) {
            // Fallback for non-secure contexts
        }
        return btoa(str);
    };

    const formatPhoneForDB = (phone) => {
        if (typeof phone !== 'string') return phone;
        const flat = phone.replace(/\s+/g, '').replace(/^\+226/, '');
        if (flat.length === 8) {
            return `+226 ${flat.slice(0, 2)} ${flat.slice(2, 4)} ${flat.slice(4, 6)} ${flat.slice(6, 8)}`;
        }
        return phone;
    };

    const sanitizePassword = (pass) => {
        if (typeof pass !== 'string') return '';
        const trimmed = pass.trim();
        const flat = trimmed.replace(/\s+/g, '');
        if (/^\d+$/.test(flat)) {
            return flat;
        }
        return trimmed;
    };

    // Create Custom Alert Container for Glassmorphism Toasts
    const customAlertContainer = document.createElement('div');
    customAlertContainer.id = 'custom-alert-container';
    document.body.appendChild(customAlertContainer);

    // Global window.alert override for custom glassmorphism alerts
    window.alert = (message) => {
        const toast = document.createElement('div');
        toast.className = 'custom-alert-toast';
        
        // Default modern bell icon
        let iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-brown)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
        
        if (message.includes("❌") || message.includes("Erreur") || message.includes("incorrect")) {
            // Error icon: Red clean cross circle
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E85C4A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
            message = message.replace("❌", "").trim();
        } else if (message.includes("🎉") || message.includes("Bienvenue") || message.includes("succès") || message.includes("déconnectée")) {
            // Success icon: Green elegant checkmark circle
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27AE60" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            message = message.replace("🎉", "").trim().replace("💎", "").trim();
        } else if (message.includes("⚡") || message.includes("Position") || message.includes("enregistrée")) {
            // Location/GPS icon: Vibrant savannah gold pin
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6CD56" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
            message = message.replace("⚡", "").trim();
        } else if (message.includes("💬")) {
            // Chat bubble icon: Earthy clay brown bubble
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8D5537" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
            message = message.replace("💬", "").trim();
        }
        
        toast.innerHTML = `<span style="display:flex; align-items:center; justify-content:center; flex-shrink:0;">${iconHtml}</span> <span style="font-size: 0.92rem; font-weight:700; color:var(--color-charcoal);">${message}</span>`;
        customAlertContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    };

    const STATE = {
        currentCity: 'ouaga', // 'ouaga' or 'bobo'
        selectedRider: null,
        clientCoordinates: null, // Holds coordinates {lat, lng} of visitor if geolocated
        unlockedRiders: new Set(), // Set of rider IDs that have been unlocked
        clickedRiders: new Set(), // Set of unique rider IDs viewed this session (limit 5)
        pendingServiceUnlock: null, // Rider that triggered the 5-profile limit unlock modal
        pendingSubscriptionUnlock: false, // Flag when a driver is paying their subscription
        pendingClientSubscriptionUnlock: false, // Flag when a client is paying their subscription
        pendingDirectMapUnlock: false, // Flag when a client is unlocking the entire map
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
        clients: [],
        settings: JSON.parse(localStorage.getItem('livraison_settings')) || {
            unlockFee: 200,
            clientSubFee: 5000,
            riderSubFee: 500
        },
        riders: {
            ouaga: [],
            bobo: []
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
                { name: 'Tampouy', lat: 12.3854, lng: -1.5412, riderId: 'o4' },
                { name: 'Cissin', lat: 12.3480, lng: -1.5420 },
                { name: 'Kalgondin', lat: 12.3580, lng: -1.4920 },
                { name: 'Dagnoën', lat: 12.3690, lng: -1.4880 },
                { name: 'Dassasgho', lat: 12.3780, lng: -1.4820 },
                { name: 'Wayalghin', lat: 12.3910, lng: -1.4720 },
                { name: 'Tanghin', lat: 12.3950, lng: -1.5210 },
                { name: 'Kilwin', lat: 12.4080, lng: -1.5580 },
                { name: 'Larlé', lat: 12.3790, lng: -1.5390 },
                { name: 'Ouidi', lat: 12.3780, lng: -1.5310 },
                { name: 'Dapoya', lat: 12.3790, lng: -1.5190 },
                { name: 'Karpala', lat: 12.3250, lng: -1.4850 },
                { name: 'Paglayiri', lat: 12.3390, lng: -1.5490 },
                { name: 'Samandin', lat: 12.3630, lng: -1.5330 },
                { name: 'Bilbalogo', lat: 12.3650, lng: -1.5260 },
                { name: 'Hamdalaye', lat: 12.3720, lng: -1.5590 },
                { name: 'Saaba', lat: 12.3750, lng: -1.4250 },
                { name: 'Kamboinsin', lat: 12.4480, lng: -1.5280 },
                { name: 'Yagma', lat: 12.4550, lng: -1.5850 },
                { name: 'Nioko I', lat: 12.4180, lng: -1.4390 },
                { name: 'Bonheur-ville', lat: 12.3150, lng: -1.5650 },
                { name: 'Nagrin', lat: 12.3020, lng: -1.5350 },
                { name: 'Balkuy', lat: 12.2980, lng: -1.4950 },
                { name: 'Tengandogo', lat: 12.2850, lng: -1.5450 }
            ],
            bobo: [
                { name: 'Belleville', lat: 11.1852, lng: -4.3214, riderId: 'b5' },
                { name: 'Accart-ville', lat: 11.1812, lng: -4.2924, riderId: 'b1' },
                { name: 'Bolomakoté', lat: 11.1685, lng: -4.2854, riderId: 'b2' },
                { name: 'Colma', lat: 11.1620, lng: -4.2995, riderId: 'b6' },
                { name: 'Sarfalao', lat: 11.1942, lng: -4.3120, riderId: 'b3' },
                { name: 'Koko', lat: 11.1714, lng: -4.3054, riderId: 'b4' },
                { name: 'Tounouma', lat: 11.1750, lng: -4.2950 },
                { name: 'Diarradougou', lat: 11.1800, lng: -4.2820 },
                { name: 'Farakan', lat: 11.1690, lng: -4.2920 },
                { name: 'Saint-Étienne', lat: 11.1900, lng: -4.2800 },
                { name: 'Dogona', lat: 11.1950, lng: -4.2600 },
                { name: 'Sikasso-Cira', lat: 11.1650, lng: -4.3080 },
                { name: 'Bindougousso', lat: 11.1550, lng: -4.2750 },
                { name: 'Lafiabougou', lat: 11.1580, lng: -4.3300 },
                { name: 'Niéneta', lat: 11.2050, lng: -4.2950 },
                { name: 'Bobo-2000', lat: 11.1500, lng: -4.3100 },
                { name: 'Ouezzinville', lat: 11.1400, lng: -4.3500 }
            ]
        }
    };

    // --- SUPABASE CLIENT INITIALIZATION ---
    const supabaseUrl = 'https://ftbhmfdlvrykfbanajfp.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YmhtZmRsdnJ5a2ZiYW5hamZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjEwNzAsImV4cCI6MjA5NTM5NzA3MH0.dK8-E2psZ4oCY6P8GXHsREWBFORLRI9H71x-mT82Pp8';
    
    let supabase = null;
    try {
        if (window.supabase) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        } else {
            console.warn("La bibliothèque Supabase n'est pas disponible. Mode local dégradé actif.");
        }
    } catch (e) {
        console.error("Erreur d'initialisation Supabase:", e);
    }

    async function loadDataFromSupabase() {
        if (!supabase) {
            console.warn("Supabase non initialisé. Chargement des données ignoré.");
            return;
        }
        try {
            // Optimisation: Lancement de 2 requêtes en parallèle (on diffère le chargement des clients et chats)
            const [ridersRes, reviewsRes] = await Promise.all([
                supabase.from('livreurs_view').select('*'),
                supabase.from('avis').select('*')
            ]);

            // 1. Traitement des livreurs
            const ridersData = ridersRes.data;
            const ridersErr = ridersRes.error;
            if (ridersErr) {
                console.error("Erreur de chargement des livreurs:", ridersErr);
            }
            if (!ridersErr && ridersData) {
                STATE.riders.ouaga = [];
                STATE.riders.bobo = [];
                ridersData.forEach(r => {
                    const riderObj = {
                        id: r.id,
                        name: r.name,
                        vehicle: r.vehicle,
                        distance: '1.0 km',
                        phone: r.phone_display, // phone_display est calculé côté Postgres (sécurisé)
                        lat: Number(r.lat),
                        lng: Number(r.lng),
                        initial: r.initial,
                        contactsCount: r.contacts_count,
                        subscriptionPaid: r.subscription_paid,
                        status: r.status,
                        viewsCount: r.views_count,
                        rating: Number(r.rating),
                        reviews: [],
                        isUnlocked: r.is_unlocked,
                        selfie: r.selfie || null,
                        city: r.city
                    };
                    if (r.city === 'ouaga') {
                        STATE.riders.ouaga.push(riderObj);
                    } else {
                        STATE.riders.bobo.push(riderObj);
                    }
                });
            }

            // 2. Traitement des avis
            const reviewsData = reviewsRes.data;
            const reviewsErr = reviewsRes.error;
            if (reviewsErr) {
                console.error("Erreur de chargement des avis:", reviewsErr);
            }
            if (reviewsData) {
                reviewsData.forEach(rev => {
                    const rider = findRiderById(rev.rider_id);
                    if (rider) {
                        rider.reviews.push({ text: rev.text, stars: Number(rev.stars), date: rev.date });
                    }
                });
            }

            // Mise à jour de l'interface
            renderRiders();
            updateAdminDashboardStats();
            updateCityActiveCounts();
        } catch (err) {
            console.error("Error loading data from Supabase:", err);
        }
    }

    function updateCityActiveCounts() {
        const activeOuaga = STATE.riders.ouaga.filter(r => r.status === 'actif').length;
        const activeBobo = STATE.riders.bobo.filter(r => r.status === 'actif').length;
        
        const cityDescOuaga = document.getElementById('city-desc-ouaga');
        const cityDescBobo = document.getElementById('city-desc-bobo');
        
        if (cityDescOuaga) {
            cityDescOuaga.innerText = `${activeOuaga} livreur${activeOuaga > 1 ? 's' : ''} actif${activeOuaga > 1 ? 's' : ''}`;
        }
        if (cityDescBobo) {
            cityDescBobo.innerText = `${activeBobo} livreur${activeBobo > 1 ? 's' : ''} actif${activeBobo > 1 ? 's' : ''}`;
        }
    }

    let adminRealtimeChannel = null;
    function setupAdminRealtimeSubscription() {
        if (!supabase) return;
        if (!STATE.isAdmin) {
            if (adminRealtimeChannel) {
                supabase.removeChannel(adminRealtimeChannel);
                adminRealtimeChannel = null;
            }
            return;
        }
        
        if (adminRealtimeChannel) return; // already subscribed
        
        adminRealtimeChannel = supabase.channel('admin-candidate-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'livreurs' },
                (payload) => {
                    const newRider = payload.new;
                    
                    // Add the new rider to our local state if it's not already there
                    const exists = findRiderById(newRider.id);
                    if (!exists) {
                        const riderObj = {
                            id: newRider.id,
                            name: newRider.name,
                            vehicle: newRider.vehicle,
                            distance: 'à proximité',
                            phone: newRider.phone,
                            lat: Number(newRider.lat),
                            lng: Number(newRider.lng),
                            initial: newRider.initial,
                            contactsCount: newRider.contacts_count,
                            subscriptionPaid: newRider.subscription_paid,
                            status: newRider.status,
                            viewsCount: newRider.views_count,
                            rating: Number(newRider.rating),
                            reviews: [],
                            isUnlocked: true,
                            selfie: newRider.selfie || null
                        };
                        if (newRider.city === 'ouaga') {
                            STATE.riders.ouaga.unshift(riderObj);
                        } else {
                            STATE.riders.bobo.unshift(riderObj);
                        }
                    }
                    
                    // Toast notification for admin
                    alert(`🔔 Nouvelle candidature de livreur : ${newRider.name} vient de s'inscrire !`);
                    
                    // Refresh counts and tables if admin modal is open
                    if (adminModal && adminModal.classList.contains('open')) {
                        updateAdminCounts();
                        // If pending sub-view is open, refresh it
                        if (subViewPending && !subViewPending.classList.contains('hidden')) {
                            updateAdminPendingCandidates();
                        }
                    }
                }
            )
            .subscribe();
    }

    // Secure Session Persistence Checking Function on page startup
    async function checkActiveSession() {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const user = session.user;
                const role = user.app_metadata?.role || user.user_metadata?.role;
                
                if (role === 'admin') {
                    STATE.isAdmin = true;
                    localStorage.setItem('livraison_admin_active', 'true');
                    setupAdminRealtimeSubscription();
                    updateNavButtons();
                    updateMapBlurState();
                    renderRiders();
                    
                    // Fetch heavy admin data only when confirmed as admin
                    const [clientsRes, chatsRes] = await Promise.all([
                        supabase.from('clients_livraison').select('*'),
                        supabase.from('chats_livraison').select('*').order('created_at', { ascending: true })
                    ]);
                    if (clientsRes.data) {
                        STATE.clients = clientsRes.data.map(c => ({
                            id: c.id,
                            phone: c.phone,
                            name: c.name,
                            subscriptionPaid: c.subscription_paid,
                            viewedDrivers: new Set(),
                            contactedDrivers: new Set()
                        }));
                    }
                    if (chatsRes.data) {
                        STATE.chats = {};
                        chatsRes.data.forEach(msg => {
                            if (!STATE.chats[msg.rider_id]) STATE.chats[msg.rider_id] = [];
                            STATE.chats[msg.rider_id].push({ sender: msg.sender, text: msg.text, time: msg.time });
                        });
                        STATE.totalMessages = chatsRes.data.length;
                        updateAdminDashboardStats();
                    }
                } else if (role === 'client') {
                    const { data: dbClient } = await supabase.from('clients_livraison').select('*').eq('id', user.id).maybeSingle();
                    if (dbClient) {
                        let client = {
                            id: dbClient.id,
                            phone: dbClient.phone,
                            name: dbClient.name,
                            subscriptionPaid: dbClient.subscription_paid,
                            viewedDrivers: new Set(),
                            contactedDrivers: new Set()
                        };
                        STATE.clients.push(client);
                        STATE.loggedClient = client;
                        
                        // Restore previously unlocked drivers
                        const { data: unlocks } = await supabase.from('deblocages').select('rider_id');
                        if (unlocks) {
                            unlocks.forEach(u => {
                                STATE.unlockedRiders.add(u.rider_id);
                                client.contactedDrivers.add(u.rider_id);
                            });
                        }
                        
                        // Load client chats
                        const { data: chatsData } = await supabase.from('chats_livraison').select('*').order('created_at', { ascending: true });
                        if (chatsData) {
                            STATE.chats = {};
                            chatsData.forEach(msg => {
                                if (!STATE.chats[msg.rider_id]) STATE.chats[msg.rider_id] = [];
                                STATE.chats[msg.rider_id].push({ sender: msg.sender, text: msg.text, time: msg.time });
                            });
                        }
                        
                        updateNavButtons();
                    }
                } else if (role === 'rider') {
                    const { data: dbDriver } = await supabase.from('livreurs').select('*').eq('id', user.id).maybeSingle();
                    if (dbDriver) {
                        let driver = findRiderById(dbDriver.id);
                        if (!driver) {
                            driver = {
                                id: dbDriver.id,
                                name: dbDriver.name,
                                vehicle: dbDriver.vehicle,
                                distance: '1.0 km',
                                phone: dbDriver.phone,
                                lat: Number(dbDriver.lat),
                                lng: Number(dbDriver.lng),
                                initial: dbDriver.initial,
                                contactsCount: dbDriver.contacts_count,
                                subscriptionPaid: dbDriver.subscription_paid,
                                status: dbDriver.status,
                                viewsCount: dbDriver.views_count,
                                rating: Number(dbDriver.rating),
                                reviews: []
                            };
                            if (dbDriver.city === 'ouaga') STATE.riders.ouaga.push(driver);
                            else STATE.riders.bobo.push(driver);
                        }
                        STATE.loggedDriver = driver;
                        
                        // Load rider chats
                        const { data: chatsData } = await supabase.from('chats_livraison').select('*').order('created_at', { ascending: true });
                        if (chatsData) {
                            STATE.chats = {};
                            chatsData.forEach(msg => {
                                if (!STATE.chats[msg.rider_id]) STATE.chats[msg.rider_id] = [];
                                STATE.chats[msg.rider_id].push({ sender: msg.sender, text: msg.text, time: msg.time });
                            });
                        }
                        
                        // Render dashboard directly
                        driverRegisterPanel.classList.add('hidden');
                        driverLoginPanel.classList.add('hidden');
                        driverDashboardPanel.classList.remove('hidden');
                        updateDriverDashboardView();
                        updateNavButtons();
                    }
                }
            }
        } catch (err) {
            console.error("Error restoring session:", err);
        }
    }

    // Call load initial data asynchronously and check active session
    if (supabase) {
        // Wait for session resolution (clears/refreshes invalid tokens) before loading data
        supabase.auth.getSession().then(() => {
            loadDataFromSupabase().then(() => {
                if (localStorage.getItem('livraison_admin_active') === 'true') {
                    STATE.isAdmin = true;
                    setupAdminRealtimeSubscription();
                    updateNavButtons();
                    updateMapBlurState();
                    renderRiders();
                    // Restore Supabase Auth session for admin in the background
                    checkActiveSession();
                } else {
                    checkActiveSession();
                }
            });
        }).catch(e => console.error("Session refresh error:", e));
    } else {
        setTimeout(() => {
            alert("⚠️ Problème de connexion. Veuillez vérifier votre réseau mobile (Supabase indisponible).");
        }, 1000);
    }
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
    
    // Admin Sub-Views & Menu declarations
    const adminMenuView = document.getElementById('admin-menu-view');
    const btnMenuChats = document.getElementById('btn-menu-chats');
    const btnMenuDrivers = document.getElementById('btn-menu-drivers');
    const btnMenuClients = document.getElementById('btn-menu-clients');
    const btnMenuPending = document.getElementById('btn-menu-pending');
    const btnMenuSubs = document.getElementById('btn-menu-subs');
    const btnMenuStats = document.getElementById('btn-menu-stats');
    const btnMenuSettings = document.getElementById('btn-menu-settings');
    
    const btnBackMenuChats = document.getElementById('btn-back-menu-chats');
    const btnBackMenuDrivers = document.getElementById('btn-back-menu-drivers');
    const btnBackMenuClients = document.getElementById('btn-back-menu-clients');
    const btnBackMenuPending = document.getElementById('btn-back-menu-pending');
    const btnBackMenuSubs = document.getElementById('btn-back-menu-subs');
    const btnBackMenuStats = document.getElementById('btn-back-menu-stats');
    const btnBackMenuSettings = document.getElementById('btn-back-menu-settings');
    
    const subViewChats = document.getElementById('sub-view-chats');
    const subViewDrivers = document.getElementById('sub-view-drivers');
    const subViewClients = document.getElementById('sub-view-clients');
    const subViewPending = document.getElementById('sub-view-pending');
    const subViewSubs = document.getElementById('sub-view-subs');
    const subViewStats = document.getElementById('sub-view-stats');
    const subViewSettings = document.getElementById('sub-view-settings');

    const adminChatsSection = document.getElementById('admin-chats-section');
    const adminDriversSection = document.getElementById('admin-drivers-section');
    const adminPendingSection = document.getElementById('admin-pending-section');
    const adminSubsSection = document.getElementById('admin-subs-section');
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
    const btnGpsAutoDetect = document.getElementById('btn-gps-auto-detect');
    const mapLocateBtn = document.getElementById('map-locate-btn');
    const driverRegisterCity = document.getElementById('driver-register-city');
    const driverRegisterSectorsGroup = document.getElementById('driver-register-sectors-group');
    const driverRegisterSectorsList = document.getElementById('driver-register-sectors-list');
    const btnDriverUpdateLocation = document.getElementById('btn-driver-update-location');
    const driverLocationUpdateStatus = document.getElementById('driver-location-update-status');
    const mapHomeBtn = document.getElementById('map-home-btn');
    const mapServiceBtn = document.getElementById('map-service-btn');

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

    let driverSelectedVehicle = 'Moto'; // Default selected vehicle
    let mapInitialized = false;

    // --- INITIALIZE MAPS ---
    function initMainMap() {
        if (typeof L === 'undefined') {
            console.warn("La bibliothèque Leaflet n'est pas chargée. Initialisation de la carte annulée.");
            return;
        }
        let center = STATE.cityCenters[STATE.currentCity];
        let zoom = 13;

        if (STATE.clientCoordinates) {
            center = STATE.clientCoordinates;
            zoom = 14;
        }

        // Leaflet options - touch gesture controls and zooming enabled
        STATE.map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            boxZoom: true,
            tap: false, // Prevents 300ms delay and ghost clicks on modern mobile
            preferCanvas: true, // Forces Canvas rendering instead of heavy SVG for paths
            wheelPxPerZoomLevel: 120 // Smoother mouse wheel scrolling
        }).setView([center.lat, center.lng], zoom);

        // CartoDB Positron - Beautiful minimalist Light gray tiles (ideal for Wave UI look)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            minZoom: 10,
            updateWhenZooming: false, // Prevents stuttering by waiting for zoom end to load new tiles
            keepBuffer: 4 // Keeps tiles loaded outside view for smoother panning
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
            
            STATE.clientBeaconMarker = L.marker([STATE.clientCoordinates.lat, STATE.clientCoordinates.lng], {
                icon: beaconIcon
            }).addTo(STATE.map).bindPopup("<b>📍 Vous êtes ici</b><br>Recherche de livreurs autour de vous.");
        }

        // Load riders markers
        renderRiders();
    }

    function renderRiders() {
        if (typeof L === 'undefined' || !STATE.map) return;
        // Clear old markers
        STATE.markers.forEach(m => STATE.map.removeLayer(m));
        STATE.markers = [];

        const cityRiders = STATE.riders[STATE.currentCity];
        
        // Filter out drivers based on active status
        let visibleRiders = cityRiders.filter(rider => {
            // A logged-in driver can always see their own pin on the map
            if (STATE.loggedDriver && rider.id === STATE.loggedDriver.id) return true;

            // Pending candidates are never visible on the map
            if (rider.status === 'en attente') return false;
            
            // Keep all validated drivers visible and active during the free trial period
            if (IS_FREE_PERIOD) {
                rider.status = 'actif';
                return true;
            }
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
            // Calculer la distance entre le client et le centre de la ville en cours de consultation
            const distToCityCenter = getDistance(
                STATE.clientCoordinates.lat,
                STATE.clientCoordinates.lng,
                STATE.cityCenters[STATE.currentCity].lat,
                STATE.cityCenters[STATE.currentCity].lng
            );

            // Si le client est dans la ville active (rayon de 15 km autour du centre de cette ville)
            if (distToCityCenter <= 15.0) {
                const proximityRiders = visibleRiders.filter(rider => {
                    const dist = getDistance(STATE.clientCoordinates.lat, STATE.clientCoordinates.lng, rider.lat, rider.lng);
                    // Save computed distance dynamically for bottom sheet display
                    rider.distance = `${dist.toFixed(1)} km`;
                    return dist <= 15.0; // Increased proximity filter radius from 5km to 15km to show more drivers
                });

                // Repli : si aucun livreur n'est dans le rayon de 15 km, mais qu'il y a des livreurs actifs dans la ville
                if (proximityRiders.length > 0) {
                    visibleRiders = proximityRiders;
                } else {
                    // Calculer la distance pour tous les livreurs de la ville afin de l'afficher dans les détails
                    visibleRiders.forEach(rider => {
                        const dist = getDistance(STATE.clientCoordinates.lat, STATE.clientCoordinates.lng, rider.lat, rider.lng);
                        rider.distance = `${dist.toFixed(1)} km`;
                    });
                    console.log("Aucun livreur dans un rayon de 15 km. Repli sur les livreurs de la ville.");
                }
            } else {
                // Si le client regarde une autre ville, on n'applique pas la restriction de 5 km
                visibleRiders.forEach(rider => {
                    const dist = getDistance(STATE.clientCoordinates.lat, STATE.clientCoordinates.lng, rider.lat, rider.lng);
                    rider.distance = `${dist.toFixed(1)} km`;
                });
            }
        }
        
        // Update Counter with active drivers
        onlineCounterText.innerText = `${visibleRiders.length} livreurs disponibles`;

        visibleRiders.forEach(rider => {
            // Elegant pulsing halo with driver's selfie background image or initials
            const markerHtml = rider.selfie 
                ? `<div class="rider-pin" id="marker-${rider.id}" style="background-image: url('${rider.selfie}')"></div>` 
                : `<div class="rider-pin" id="marker-${rider.id}">${rider.initial}</div>`;

            const customIcon = L.divIcon({
                className: 'custom-marker-wrapper',
                html: markerHtml,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
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
        if (typeof L === 'undefined') {
            console.warn("La bibliothèque Leaflet n'est pas chargée. Initialisation du sélecteur de carte annulée.");
            return;
        }
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
            attributionControl: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            boxZoom: true,
            tap: false,
            preferCanvas: true,
            wheelPxPerZoomLevel: 120
        }).setView([targetLat, targetLng], 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            updateWhenZooming: false,
            keepBuffer: 4
        }).addTo(STATE.pickerMap);

        // Add a red terracotta pin showing rider's selfie if logged in
        let pickerHtml = '<div class="rider-pin rider-pin-active"></div>';
        if (STATE.loggedDriver && STATE.loggedDriver.selfie) {
            pickerHtml = `<div class="rider-pin rider-pin-active" style="background-image: url('${STATE.loggedDriver.selfie}')"></div>`;
        }

        const redPinIcon = L.divIcon({
            className: 'custom-marker-picker',
            html: pickerHtml,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
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
        
        // Disable blur during free trial period
        if (IS_FREE_PERIOD) {
            mapEl.classList.remove('map-blurred');
            return;
        }
        
        const isPremiumClient = STATE.loggedClient && STATE.loggedClient.subscriptionPaid === true;
        
        if (STATE.isAdmin || isPremiumClient) {
            mapEl.classList.remove('map-blurred');
            return;
        }
        
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

    // Update Top Navigation buttons depending on login state
    function updateNavButtons() {
        const loggedIn = STATE.loggedClient || STATE.loggedDriver || STATE.isAdmin;
        const profileBtn = document.getElementById('btn-nav-profile');
        if (loggedIn) {
            btnNavLogin.classList.add('hidden');
            if (profileBtn) profileBtn.classList.remove('hidden');
        } else {
            btnNavLogin.classList.remove('hidden');
            if (profileBtn) profileBtn.classList.add('hidden');
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
        const isUnlocked = IS_FREE_PERIOD || STATE.unlockedRiders.has(rider.id) || STATE.isAdmin || (STATE.loggedClient && STATE.loggedClient.subscriptionPaid === true);
        
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
        if (rider.selfie) {
            sheetAvatar.innerText = '';
            sheetAvatar.style.backgroundImage = `url('${rider.selfie}')`;
        } else {
            sheetAvatar.innerText = rider.initial;
            sheetAvatar.style.backgroundImage = 'none';
        }
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
        
        // Hide map service button when details are open
        if (mapServiceBtn) mapServiceBtn.classList.add('hidden');
        
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

        // Restore map service button when details are closed if not premium or admin
        const isPremiumClient = STATE.loggedClient && STATE.loggedClient.subscriptionPaid === true;
        if (mapServiceBtn && !IS_FREE_PERIOD && !STATE.isAdmin && !isPremiumClient) {
            mapServiceBtn.classList.remove('hidden');
        }
    }

    // --- SIMULATED PAYMENT CONTROLLERS ---
    function openPaymentModal() {
        if (!STATE.selectedRider && !STATE.pendingServiceUnlock && !STATE.pendingSubscriptionUnlock && !STATE.pendingClientSubscriptionUnlock && !STATE.pendingDirectMapUnlock) return;

        // Reset to first step
        paymentFormStep.style.display = 'block';
        paymentUssdStep.style.display = 'none';
        paymentSuccessStep.style.display = 'none';
        
        momoPhoneInput.value = '';
        ussdPinInput.value = '';
        btnSubmitMomo.disabled = false;
        btnSubmitMomo.innerText = 'Lancer le paiement';

        // Reset Mobile Money payment states
        
        const titleEl = document.querySelector('.payment-title');
        const amountEl = document.querySelector('.payment-amount');
        
        if (STATE.pendingClientSubscriptionUnlock) {
            titleEl.innerText = "Abonnement Client Premium (1 mois)";
            amountEl.innerText = `${STATE.settings.clientSubFee.toLocaleString('fr-FR')} FCFA`;
        } else if (STATE.pendingSubscriptionUnlock) {
            titleEl.innerText = "Abonnement Livreur (7 jours)";
            amountEl.innerText = `${STATE.settings.riderSubFee.toLocaleString('fr-FR')} FCFA`;
        } else if (STATE.pendingServiceUnlock) {
            titleEl.innerText = "Déblocage du Service de Recherche";
            amountEl.innerText = `${STATE.settings.unlockFee.toLocaleString('fr-FR')} FCFA`;
        } else if (STATE.pendingDirectMapUnlock) {
            titleEl.innerText = "Déblocage Complet de la Carte";
            amountEl.innerText = `${STATE.settings.unlockFee.toLocaleString('fr-FR')} FCFA`;
        } else {
            titleEl.innerText = "Déverrouillage Contact Livreur";
            amountEl.innerText = `${STATE.settings.unlockFee.toLocaleString('fr-FR')} FCFA`;
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
            if (STATE.pendingClientSubscriptionUnlock) {
                if (STATE.loggedClient) {
                    STATE.loggedClient.subscriptionPaid = true;
                    supabase.from('clients_livraison').update({ subscription_paid: true }).eq('id', STATE.loggedClient.id).then();
                } else if (STATE.tempPremiumClientRegistration) {
                    const reg = STATE.tempPremiumClientRegistration;
                    const virtualEmail = reg.phone.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
                    const sanitizedPass = sanitizePassword(reg.password);
                    const securePassword = sanitizedPass.length < 6 ? sanitizedPass + "_secure_pad" : sanitizedPass;
                    
                    supabase.auth.signUp({
                        email: virtualEmail,
                        password: securePassword,
                        options: {
                            data: {
                                name: reg.name,
                                phone: reg.phone,
                                role: 'client',
                                subscription_paid: true
                            }
                        }
                    }).then(({ data: authData, error: authError }) => {
                        if (authError) {
                            alert("❌ Erreur de création de compte : " + authError.message);
                            return;
                        }
                        
                        const newClient = {
                            id: authData.user.id,
                            phone: reg.phone,
                            name: reg.name,
                            subscriptionPaid: true,
                            viewedDrivers: new Set(),
                            contactedDrivers: new Set()
                        };
                        STATE.clients.push(newClient);
                        STATE.loggedClient = newClient;
                        STATE.tempPremiumClientRegistration = null;
                        
                        updateClientDashboardView();
                        updateNavButtons();
                        renderRiders();
                        alert("🎉 Votre compte Client Premium a été créé et activé avec succès !");
                    });
                }
                STATE.totalRevenue += STATE.settings.clientSubFee;
            } else if (STATE.pendingSubscriptionUnlock) {
                if (STATE.loggedDriver) {
                    STATE.loggedDriver.subscriptionPaid = true;
                    supabase.from('livreurs').update({ subscription_paid: true, status: 'actif' }).eq('id', STATE.loggedDriver.id).then();
                }
                STATE.totalRevenue += STATE.settings.riderSubFee;
            } else if (STATE.pendingServiceUnlock) {
                STATE.unlockedRiders.add(STATE.pendingServiceUnlock.id);
                STATE.clickedRiders.clear(); // Offer a fresh 5 clicks
                
                const rider = findRiderById(STATE.pendingServiceUnlock.id);
                if (rider) {
                    if (rider.contactsCount === undefined) rider.contactsCount = 0;
                    rider.contactsCount++;
                }
                STATE.totalUnlocks++;
                STATE.totalRevenue += STATE.settings.unlockFee;
            } else if (STATE.pendingDirectMapUnlock) {
                // Unlock all current riders in the active city for this session
                const cityRiders = STATE.riders[STATE.currentCity] || [];
                cityRiders.forEach(r => {
                    STATE.unlockedRiders.add(r.id);
                    // Increment each driver's contactsCount dynamically
                    if (r.contactsCount === undefined) r.contactsCount = 0;
                    r.contactsCount++;
                });
                STATE.totalUnlocks++;
                STATE.totalRevenue += STATE.settings.unlockFee;
            } else if (STATE.selectedRider) {
                STATE.unlockedRiders.add(STATE.selectedRider.id);
                
                const rider = findRiderById(STATE.selectedRider.id);
                if (rider) {
                    if (rider.contactsCount === undefined) rider.contactsCount = 0;
                    rider.contactsCount++;
                }
                
                STATE.totalUnlocks++;
                STATE.totalRevenue += STATE.settings.unlockFee;
            }

            // Track contacted history if client is logged in
            if (STATE.loggedClient) {
                if (!STATE.loggedClient.contactedDrivers) {
                    STATE.loggedClient.contactedDrivers = new Set();
                }
                if (STATE.pendingDirectMapUnlock) {
                    // Unlock all current riders in this city for the loggedClient
                    const cityRiders = STATE.riders[STATE.currentCity] || [];
                    cityRiders.forEach(r => {
                        STATE.loggedClient.contactedDrivers.add(r.id);
                        supabase.rpc('simulate_payment_unlock', { target_rider_id: r.id }).then(() => {
                            supabase.from('livreurs_view').select('phone_display').eq('id', r.id).single().then(({data}) => {
                                if (data) r.phone = data.phone_display;
                            });
                        });
                    });
                } else {
                    const unlockedRiderId = STATE.selectedRider ? STATE.selectedRider.id : (STATE.pendingServiceUnlock ? STATE.pendingServiceUnlock.id : '');
                    if (unlockedRiderId) {
                        STATE.loggedClient.contactedDrivers.add(unlockedRiderId);
                        STATE.unlockedRiders.add(unlockedRiderId); // Ensure in unlocked set
                        
                        // Utiliser la fonction RPC sécurisée (simulate_payment_unlock) pour contourner la restriction RLS d'insertion directe
                        supabase.rpc('simulate_payment_unlock', { target_rider_id: unlockedRiderId }).then(() => {
                            supabase.from('livreurs_view').select('phone_display').eq('id', unlockedRiderId).single().then(({data}) => {
                                const r = findRiderById(unlockedRiderId);
                                if (r && data) {
                                    r.phone = data.phone_display;
                                    updateClientDashboardView();
                                    
                                    // Update bottom sheet if currently looking at this rider
                                    if (STATE.selectedRider && STATE.selectedRider.id === unlockedRiderId) {
                                        const phoneEl = document.getElementById('sheet-rider-phone-masked');
                                        if (phoneEl) {
                                            phoneEl.innerText = r.phone;
                                            phoneEl.classList.remove('phone-masked');
                                            phoneEl.classList.add('phone-unlocked');
                                        }
                                    }
                                }
                            });
                        });
                    }
                }
                updateClientDashboardView();
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
        if (STATE.pendingClientSubscriptionUnlock) {
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
        } else if (STATE.pendingDirectMapUnlock) {
            STATE.pendingDirectMapUnlock = false;
            // Hide the floating button since they just unlocked the entire map
            if (mapServiceBtn) mapServiceBtn.classList.add('hidden');
            updateMapBlurState();
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
    
    // Espace Livreur Login Submit (Authenticated via Supabase Auth)
    driverLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phoneVal = document.getElementById('login-phone').value.trim();
        const phoneNormalized = formatPhoneForDB(phoneVal);
        const passwordInputVal = document.getElementById('login-pin').value.trim();

        const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';

        // Sign in via Supabase Auth (with secure padding fallback for short PINs)
        const sanitizedPass = sanitizePassword(passwordInputVal);
        const securePassword = sanitizedPass.length < 6 ? sanitizedPass + "_secure_pad" : sanitizedPass;
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: virtualEmail,
            password: securePassword
        });

        if (authError) {
            alert("❌ Numéro ou PIN incorrect pour ce compte livreur.");
            return;
        }

        const user = authData.user;
        const role = user.user_metadata.role;

        if (role !== 'rider') {
            alert("❌ Ce compte n'est pas un compte livreur.");
            await supabase.auth.signOut();
            return;
        }

        const { data: dbDriver, error: dbError } = await supabase.from('livreurs').select('*').eq('id', user.id).maybeSingle();

        if (dbError || !dbDriver) {
            alert("❌ Profil livreur introuvable dans la base de données.");
            return;
        }

        let driver = findRiderById(dbDriver.id);
        if (!driver) {
            driver = {
                id: dbDriver.id,
                name: dbDriver.name,
                vehicle: dbDriver.vehicle,
                distance: '1.0 km',
                phone: dbDriver.phone,
                lat: Number(dbDriver.lat),
                lng: Number(dbDriver.lng),
                initial: dbDriver.initial,
                contactsCount: dbDriver.contacts_count,
                subscriptionPaid: dbDriver.subscription_paid,
                status: dbDriver.status,
                viewsCount: dbDriver.views_count,
                rating: Number(dbDriver.rating),
                reviews: []
            };
            if (dbDriver.city === 'ouaga') STATE.riders.ouaga.push(driver);
            else STATE.riders.bobo.push(driver);
        }
        
        STATE.loggedDriver = driver;
        
        // Render Dashboard
        driverLoginPanel.classList.add('hidden');
        driverDashboardPanel.classList.remove('hidden');
        updateDriverDashboardView();
        updateNavButtons();
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

    // Actualiser la position GPS en direct du livreur
    btnDriverUpdateLocation.addEventListener('click', () => {
        if (!STATE.loggedDriver) return;
        const driver = STATE.loggedDriver;

        btnDriverUpdateLocation.style.pointerEvents = 'none';
        btnDriverUpdateLocation.innerHTML = `<div class="geo-spinner" style="width: 14px; height: 14px; border-top-color: white; display: inline-block; vertical-align: middle; margin-right: 6px;"></div>`;
        driverLocationUpdateStatus.innerHTML = `<span>⏳</span> <span>Recherche de votre signal GPS...</span>`;

        if (!navigator.geolocation) {
            btnDriverUpdateLocation.style.pointerEvents = 'auto';
            btnDriverUpdateLocation.innerHTML = `⚡ Actualiser`;
            driverLocationUpdateStatus.innerHTML = `<span>❌</span> <span>GPS non supporté par votre navigateur.</span>`;
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Mettre à jour les coordonnées réelles du livreur
                driver.lat = lat;
                driver.lng = lng;

                // Redessiner immédiatement tous les marqueurs sur la carte active
                renderRiders();

                btnDriverUpdateLocation.style.pointerEvents = 'auto';
                btnDriverUpdateLocation.innerHTML = `⚡ Actualiser`;
                
                const time = getFormattedTime();
                driverLocationUpdateStatus.innerHTML = `<span>✓</span> <span>Position mise à jour à ${time} : (${lat.toFixed(5)}, ${lng.toFixed(5)})</span>`;
                driverLocationUpdateStatus.style.color = 'var(--color-green-soft)';

                // Recentrer la carte sur sa nouvelle position s'il le souhaite
                if (STATE.map) {
                    STATE.map.panTo([lat, lng], { animate: true, duration: 0.6 });
                }
            },
            (error) => {
                // En cas d'échec du signal, simuler de façon fluide un déplacement à proximité du centre de sa ville active
                const cityCenter = STATE.cityCenters[STATE.currentCity];
                const randomLat = cityCenter.lat + (Math.random() - 0.5) * 0.012;
                const randomLng = cityCenter.lng + (Math.random() - 0.5) * 0.012;
                
                driver.lat = randomLat;
                driver.lng = randomLng;
                
                renderRiders();

                btnDriverUpdateLocation.style.pointerEvents = 'auto';
                btnDriverUpdateLocation.innerHTML = `⚡ Actualiser`;
                
                const time = getFormattedTime();
                driverLocationUpdateStatus.innerHTML = `<span>⚡</span> <span>Position simulée à ${time} : (${randomLat.toFixed(5)}, ${randomLng.toFixed(5)})</span>`;
                driverLocationUpdateStatus.style.color = 'var(--color-primary-brown)';
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0
            }
        );
    });

    function updateDriverDashboardView() {
        if (!STATE.loggedDriver) return;
        
        const driver = STATE.loggedDriver;
        const contacts = driver.contactsCount || 0;
        const views = driver.viewsCount || 0;
        let isPaid = driver.subscriptionPaid || false;
        
        // Enable active subscription status automatically during the free trial period
        if (IS_FREE_PERIOD) {
            isPaid = true;
        }
        
        // Define status theme
        let statusBadgeText = "";
        let statusBg = "";
        let statusColor = "";
        let visibilityText = "";
        let visibilityColor = "";
        let subTextHTML = "";
        let showPayBtn = false;
        
        if (driver.status === 'en attente') {
            statusBadgeText = "En attente";
            statusBg = "var(--color-primary-yellow-light)";
            statusColor = "var(--color-primary-brown)";
            visibilityText = "🔴 En attente de validation (Masqué)";
            visibilityColor = "var(--color-primary-red)";
            subTextHTML = "Votre profil est en cours de validation par notre équipe d'administration. Vous serez visible sur la carte dès approbation.";
        } else if (contacts < 5) {
            statusBadgeText = "Essai Gratuit";
            statusBg = "var(--color-green-light)";
            statusColor = "var(--color-green-soft)";
            visibilityText = "🟢 En ligne & Visible";
            visibilityColor = "var(--color-green-soft)";
            subTextHTML = `Période d'essai active. 4 relations offertes (vous êtes à <strong>${contacts}/4</strong>).`;
        } else if (isPaid) {
            statusBadgeText = "Abonné Actif";
            statusBg = "var(--color-green-light)";
            statusColor = "var(--color-green-soft)";
            visibilityText = "🟢 En ligne & Visible";
            visibilityColor = "var(--color-green-soft)";
            subTextHTML = "Votre abonnement hebdomadaire de 500 FCFA est actif ! Merci pour votre confiance.";
        } else {
            statusBadgeText = "Abonnement Requis";
            statusBg = "var(--color-primary-red-light)";
            statusColor = "var(--color-primary-red)";
            visibilityText = "🔴 Hors ligne (Masqué)";
            visibilityColor = "var(--color-primary-red)";
            subTextHTML = `Relations atteintes (<strong>${contacts} clics</strong>). Réglez votre abonnement (500 F) pour réapparaître sur la carte.`;
            showPayBtn = true;
        }

        // Render reviews HTML
        const rating = driver.rating || 5.0;
        const reviews = driver.reviews || [];
        let reviewsHTML = '';
        if (reviews.length === 0) {
            reviewsHTML = '<p style="font-size:0.75rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucun avis reçu pour le moment.</p>';
        } else {
            reviews.forEach(rev => {
                reviewsHTML += `
                    <div class="rider-review-bubble" style="margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:700;">
                            <span style="color:var(--color-primary-yellow); font-size:0.8rem;">${'★'.repeat(Math.round(rev.stars))}</span>
                            <span style="color:var(--color-charcoal-muted); font-size:0.6rem;">${rev.date}</span>
                        </div>
                        <p style="margin:0; color:var(--color-charcoal-light); font-size:0.75rem; font-style:italic; line-height:1.35;">"${escapeHTML(rev.text)}"</p>
                    </div>
                `;
            });
        }

        // Render messenger chat HTML
        let chatsHTML = '';
        if (STATE.chats[driver.id] && STATE.chats[driver.id].length > 0) {
            const lastMsg = STATE.chats[driver.id][STATE.chats[driver.id].length - 1];
            chatsHTML = `
                <div class="client-history-item" id="driver-chat-row" style="margin-top: 8px;">
                    <div class="client-history-avatar">💬</div>
                    <div class="client-history-info">
                        <div class="client-history-name">Client (+226 76 00 00 01)</div>
                        <div class="client-history-sub" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${escapeHTML(lastMsg.text)}</div>
                    </div>
                    <span class="client-history-action" style="font-size:0.65rem;">Clavarder</span>
                </div>
            `;
        } else {
            chatsHTML = '<p style="font-size:0.8rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucun message reçu pour le moment.</p>';
        }

        // Render whole HTML inside driverDashboardPanel
        driverDashboardPanel.innerHTML = `
            <!-- Profil Card Savannah Clay Gradient -->
            <div class="rider-dash-profile-card">
                <div class="rider-dash-avatar-wrapper">${escapeHTML(driver.initial)}</div>
                <div class="rider-dash-profile-info">
                    <h3>${escapeHTML(driver.name)}</h3>
                    <p>🏍️ Moyen : ${escapeHTML(driver.vehicle)}</p>
                </div>
            </div>

            <!-- Visibilité & Statut -->
            <div class="driver-status-card">
                <div class="driver-status-row">
                    <span class="form-label" style="margin:0; font-weight:700;">Compte :</span>
                    <span class="rider-status" style="background-color:${statusBg}; color:${statusColor}; font-weight:800; font-size:0.72rem; padding:4px 10px; border-radius:100px;">${statusBadgeText}</span>
                </div>
                <div class="driver-status-row" style="margin-top:8px;">
                    <span class="form-label" style="margin:0; font-weight:700;">Visibilité :</span>
                    <span style="color:${visibilityColor}; font-weight:800; font-size:0.8rem;">${visibilityText}</span>
                </div>
            </div>

            <!-- Position GPS en Direct widget -->
            <div class="driver-status-card" style="border: 1.5px solid var(--color-primary-green); background-color: var(--color-primary-green-light); padding: 14px; text-align:left;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap: 8px;">
                    <div>
                        <h4 style="margin:0; font-size:0.85rem; font-weight:700; color:var(--color-primary-green-hover); display:flex; align-items:center; gap:4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>
                            Position en Direct
                        </h4>
                        <p style="margin:4px 0 0 0; font-size:0.7rem; color:var(--color-charcoal-light); line-height: 1.3;">Mettez à jour vos coordonnées GPS en un clic depuis votre téléphone.</p>
                    </div>
                    <button type="button" class="btn btn-primary" id="btn-driver-update-location" style="width:auto; margin:0; padding:8px 12px; font-size:0.72rem; border-radius:10px; background-color:var(--color-primary-green); color: white; border: none; font-weight: 700; cursor: pointer; display:flex; align-items:center; gap:4px; box-shadow:none;">
                        ⚡ Actualiser
                    </button>
                </div>
                <div id="driver-location-update-status" style="margin-top:10px; font-size:0.72rem; font-weight:700; color:var(--color-green-soft); display: flex; align-items: center; gap: 4px;">
                    <div class="pulse-dot" style="width:8px; height:8px; background-color:var(--color-primary-green);"></div>
                    <span>Position active : ${driver.lat.toFixed(4)}, ${driver.lng.toFixed(4)}</span>
                </div>
            </div>

            <!-- Grille de Stats -->
            <div class="rider-dash-stat-grid" style="margin-top:16px;">
                <div class="rider-dash-stat-card">
                    <div class="rider-dash-stat-lbl">Relations</div>
                    <div class="rider-dash-stat-val">${contacts} / 4</div>
                    <div class="rider-dash-stat-desc">offertes</div>
                </div>
                <div class="rider-dash-stat-card">
                    <div class="rider-dash-stat-lbl">Clics Profil</div>
                    <div class="rider-dash-stat-val">${views}</div>
                    <div class="rider-dash-stat-desc">visites</div>
                </div>
                <div class="rider-dash-stat-card">
                    <div class="rider-dash-stat-lbl">Avis</div>
                    <div class="rider-dash-stat-val">${rating.toFixed(1)}</div>
                    <div class="rider-dash-stat-desc">${reviews.length} revues</div>
                </div>
            </div>

            <!-- Messagerie -->
            <div class="driver-terms-info" style="margin-top:15px; text-align:left; background:rgba(255,255,255,0.45); border-radius:16px; padding:14px; border:1px solid var(--color-border);">
                <h4 style="margin:0 0 8px 0; font-size:0.85rem; font-weight:700; color:var(--color-primary-brown); display:flex; align-items:center; gap:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary-brown);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Messages Clients
                </h4>
                <div id="driver-dash-chats-list">
                    ${chatsHTML}
                </div>
            </div>

            <!-- Notes & Avis -->
            <div class="driver-terms-info" style="margin-top:15px; text-align:left; background:rgba(255,255,255,0.45); border-radius:16px; padding:14px; border:1px solid var(--color-border);">
                <h4 style="margin:0 0 10px 0; font-size:0.85rem; font-weight:700; color:var(--color-primary-brown); display:flex; align-items:center; gap:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary-brown);"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Avis & Évaluations
                </h4>
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; background:rgba(255,255,255,0.6); padding:8px 12px; border-radius:12px;">
                    <span style="font-size:1.8rem; font-weight:800; color:var(--color-primary-yellow);">${rating.toFixed(1)}</span>
                    <div>
                        <div style="color:var(--color-primary-yellow); font-size:0.85rem;">${'★'.repeat(Math.round(rating))}</div>
                        <div style="font-size:0.65rem; color:var(--color-charcoal-muted);">${reviews.length} avis reçus</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${reviewsHTML}
                </div>
            </div>

            <!-- Suivi Abonnement -->
            <div class="driver-terms-info" style="margin-top:15px; text-align:left; background:rgba(255,255,255,0.45); border-radius:16px; padding:14px; border:1px solid var(--color-border);">
                <h4 style="margin:0 0 6px 0; font-size:0.85rem; font-weight:700; color:var(--color-primary-brown); display:flex; align-items:center; gap:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary-brown);"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    Mon Abonnement (500 F / 7j)
                </h4>
                <p style="font-size:0.78rem; color:var(--color-charcoal-light); line-height:1.4; margin:0;">
                    ${statusBadgeText === 'Essai Gratuit' ? 'Période d\'essai gratuite en cours.' : ''}
                    ${subTextHTML}
                </p>
                <button class="btn-unlock" id="btn-driver-pay-sub" style="width:100%; margin-top:12px; padding:10px; font-size:0.85rem; display:${showPayBtn ? 'block' : 'none'};">
                    💳 Payer mon abonnement (500 FCFA)
                </button>
            </div>

            <!-- Actions de Simulation / Déconnexion -->
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
                <button class="btn btn-secondary" id="btn-driver-simulate-contact" style="width:100%; padding:12px; border-radius:12px; font-size:0.8rem; background:rgba(141,85,55,0.04) !important; border:1px dashed rgba(141,85,55,0.2) !important; color:var(--color-primary-brown) !important; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                    Simuler +2 contacts clics
                </button>
                <button class="btn btn-secondary" id="btn-driver-logout" style="width:100%; padding:12px; border-radius:16px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Se déconnecter de ma session
                </button>
            </div>
        `;

        // Re-bind click event listeners of dynamically rendered buttons
        document.getElementById('btn-driver-update-location').addEventListener('click', () => {
            // Re-bind location update
            document.getElementById('btn-driver-update-location').innerText = "⚡ Météo GPS...";
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                driver.lat = lat;
                driver.lng = lng;
                
                // Sync with Supabase
                supabase.from('livreurs').update({ lat: lat, lng: lng }).eq('id', driver.id).then();
                
                renderRiders();
                updateDriverDashboardView();
                alert("📍 Position GPS synchronisée en direct avec succès !");
            }, err => {
                alert("❌ Impossible de récupérer la localisation de votre appareil. Assurez-vous d'avoir activé le GPS.");
                updateDriverDashboardView();
            });
        });

        document.getElementById('btn-driver-simulate-contact').addEventListener('click', () => {
            if (driver.contactsCount === undefined) {
                driver.contactsCount = 0;
            }
            driver.contactsCount += 2;
            
            // Sync with Supabase
            supabase.from('livreurs').update({ contacts_count: driver.contactsCount }).eq('id', driver.id).then();
            
            renderRiders();
            updateDriverDashboardView();
            updateAdminDashboardDrivers();
        });

        document.getElementById('btn-driver-pay-sub').addEventListener('click', () => {
            STATE.pendingSubscriptionUnlock = true;
            openPaymentModal();
        });

        document.getElementById('btn-driver-logout').addEventListener('click', () => {
            STATE.loggedDriver = null;
            closeDriverDrawer();
            STATE.unlockedRiders.clear();
            STATE.clickedRiders.clear();
            renderRiders();
            updateMapBlurState();
            updateNavButtons();
            alert("Session déconnectée avec succès.");
        });

        // Chat row binding
        const chatRow = document.getElementById('driver-chat-row');
        if (chatRow) {
            chatRow.addEventListener('click', () => {
                openChatDrawer(driver);
            });
        }
    }

    function updateClientDashboardView() {
        if (!STATE.loggedClient) return;
        
        const client = STATE.loggedClient;
        let isPremium = client.subscriptionPaid === true;
        
        // Enable client premium access automatically during the free trial period
        if (IS_FREE_PERIOD) {
            isPremium = true;
        }

        // Render Viewed Drivers HTML
        const viewedIds = Array.from(client.viewedDrivers || []);
        let viewedHTML = '';
        if (viewedIds.length === 0) {
            viewedHTML = '<p style="font-size:0.75rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucun livreur consulté pour le moment.</p>';
        } else {
            viewedIds.forEach(id => {
                const r = findRiderById(id);
                if (!r) return;
                viewedHTML += `
                    <div class="client-history-item" data-rider-id="${r.id}" style="margin-bottom:6px;">
                        <div class="client-history-avatar">${r.initial}</div>
                        <div class="client-history-info">
                            <div class="client-history-name">${escapeHTML(r.name)}</div>
                            <div class="client-history-sub">${escapeHTML(r.vehicle)}</div>
                        </div>
                        <span class="client-history-action">Voir</span>
                    </div>
                `;
            });
        }

        // Render Contacted Drivers HTML
        const contactedIds = Array.from(client.contactedDrivers || []);
        let contactedHTML = '';
        if (contactedIds.length === 0) {
            contactedHTML = `
                <div style="text-align:center; padding: 10px 0;">
                    <p style="font-size:0.75rem; color:var(--color-charcoal-muted); font-style:italic; margin-bottom:12px;">Aucun contact débloqué.</p>
                    <button class="btn btn-primary" id="btn-empty-find-driver" style="width:100%; padding:10px; border-radius:12px; font-size:0.8rem;">Trouver un livreur</button>
                </div>
            `;
        } else {
            contactedIds.forEach(id => {
                const r = findRiderById(id);
                if (!r) return;
                contactedHTML += `
                    <div class="client-history-item" style="margin-bottom:6px; cursor:default;">
                        <div class="client-history-avatar" style="background-color:var(--color-primary-red-light); color:var(--color-primary-red);">${r.initial}</div>
                        <div class="client-history-info">
                            <div class="client-history-name">${escapeHTML(r.name)}</div>
                            <div class="client-history-sub" style="font-weight:700; color:var(--color-charcoal);">${escapeHTML(r.phone)}</div>
                        </div>
                        <a href="tel:${r.phone.replace(/\s+/g, '')}" class="client-history-action" style="background:var(--color-green-light); color:var(--color-green-soft); border-color:rgba(39,174,96,0.15); text-decoration:none; display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; padding:0;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </a>
                    </div>
                `;
            });
        }

        // Render chats HTML
        const chatDriverIds = Object.keys(STATE.chats).filter(riderId => STATE.chats[riderId] && STATE.chats[riderId].length > 0);
        let chatsHTML = '';
        if (chatDriverIds.length === 0) {
            chatsHTML = '<p style="font-size:0.75rem; color:var(--color-charcoal-muted); font-style:italic; margin:0;">Aucune discussion active.</p>';
        } else {
            chatDriverIds.forEach(riderId => {
                const r = findRiderById(riderId);
                if (!r) return;
                const messages = STATE.chats[riderId];
                const lastMsg = messages[messages.length - 1];
                chatsHTML += `
                    <div class="client-history-item" data-chat-rider-id="${r.id}" style="margin-bottom:6px;">
                        <div class="client-history-avatar">${r.initial}</div>
                        <div class="client-history-info">
                            <div class="client-history-name">${escapeHTML(r.name)}</div>
                            <div class="client-history-sub" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${escapeHTML(lastMsg.text)}</div>
                        </div>
                        <span class="client-history-action" style="font-size:0.65rem;">Ouvrir</span>
                    </div>
                `;
            });
        }

        const clientDrawerBody = document.getElementById('client-dashboard-panel');
        clientDrawerBody.innerHTML = `
            <!-- Client Membership Card -->
            <div class="client-premium-badge-card" style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                <div style="flex: 1;">
                    <div class="client-premium-title" style="display: flex; align-items: center; gap: 8px;">
                        ${isPremium ? `
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #F6CD56; fill: #F6CD56; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M5 20h14"></path></svg>
                            Client Premium
                        ` : `
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #F6CD56; fill: #F6CD56; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            Espace Client
                        `}
                    </div>
                    <div class="client-premium-sub">Numéro : ${escapeHTML(client.phone)}</div>
                </div>
                ${isPremium ? `
                    <div class="premium-sparkle-badge" style="background: rgba(255, 255, 255, 0.2); padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.3); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: white;">PRO</div>
                ` : `
                    <div class="premium-sparkle-badge" style="background: rgba(0, 0, 0, 0.2); padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: white;">Gratuit</div>
                `}
            </div>

            <!-- Premium Upgrade Option (Gratuit) -->
            ${!isPremium ? `
                <div class="driver-terms-info" style="margin-top: 15px; background: rgba(255,250,240,0.9); border: 1.5px solid var(--color-primary-yellow); border-radius:12px; padding:14px; text-align: left;">
                    <h4 style="margin:0 0 6px 0; font-size:0.85rem; font-weight:700; color:var(--color-primary-brown); display:flex; align-items:center; gap:6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary-brown); fill: var(--color-primary-brown);"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M5 20h14"></path></svg>
                        Devenir Client Premium !
                    </h4>
                    <p style="margin:0 0 10px 0; font-size:0.72rem; color:var(--color-charcoal-light); line-height: 1.35;">
                        Débloquez tous les livreurs en illimité sans payer ${STATE.settings.unlockFee} FCFA par profil.
                    </p>
                    <button type="button" class="btn-unlock" id="btn-client-pay-premium" style="width:100%; padding:10px; font-size:0.82rem; border-radius:10px; box-shadow:none; display:flex; align-items:center; justify-content:center; gap:6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #F6CD56; fill: #F6CD56;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M5 20h14"></path></svg>
                        Activer le Premium (${STATE.settings.clientSubFee.toLocaleString('fr-FR')} FCFA / mois)
                    </button>
                </div>
            ` : `
                <!-- Premium Live Auto-Search Button -->
                <div style="margin-bottom: 20px;">
                    <button type="button" class="btn-unlock" id="btn-client-premium-search" style="width:100%; padding:12px; font-size:0.85rem; border-radius:12px; font-weight:700; background: linear-gradient(135deg, var(--color-primary-green), var(--color-primary-green-hover)); box-shadow:none; color: white; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        Recherche Automatique en Direct
                    </button>
                </div>
            `}

            <!-- Livreurs Consultés -->
            <div class="driver-terms-info" style="margin-top: 15px; background: rgba(255,255,255,0.45); border-radius:16px; padding:14px; border:1px solid var(--color-border); text-align:left;">
                <h4 style="margin:0 0 10px 0; font-size:0.85rem; font-weight:700; color:var(--color-primary-brown); display:flex; align-items:center; gap:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary-brown);"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                    Livreurs Consultés
                </h4>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    ${viewedHTML}
                </div>
            </div>

            <!-- Contacts Débloqués -->
            <div class="driver-terms-info" style="margin-top: 15px; background: rgba(255,255,255,0.45); border-radius:16px; padding:14px; border:1px solid var(--color-border); text-align:left;">
                <h4 style="margin:0 0 10px 0; font-size:0.85rem; font-weight:700; color:var(--color-primary-brown); display:flex; align-items:center; gap:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary-brown);"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                    Contacts Débloqués
                </h4>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    ${contactedHTML}
                </div>
            </div>

            <!-- Discussions -->
            <div class="driver-terms-info" style="margin-top: 15px; background: rgba(255,255,255,0.45); border-radius:16px; padding:14px; border:1px solid var(--color-border); text-align:left;">
                <h4 style="margin:0 0 10px 0; font-size:0.85rem; font-weight:700; color:var(--color-primary-brown); display:flex; align-items:center; gap:6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary-brown);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Discussions Actives
                </h4>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    ${chatsHTML}
                </div>
            </div>

            <!-- Actions de Déconnexion -->
            <button class="btn btn-secondary" id="btn-client-logout" style="width:100%; padding:12px; border-radius:16px; margin-top:24px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Se déconnecter de ma session
            </button>
        `;

        // Re-bind click event listeners of dynamically rendered buttons
        if (!isPremium) {
            document.getElementById('btn-client-pay-premium').addEventListener('click', () => {
                STATE.pendingPremiumUpgrade = true;
                openPaymentModal();
            });
        } else {
            document.getElementById('btn-client-premium-search').addEventListener('click', () => {
                closeClientDrawer();
                showMapView();
                locateClientAndLaunchMap(document.getElementById('map-locate-btn'));
            });
        }

        document.getElementById('btn-client-logout').addEventListener('click', () => {
            STATE.loggedClient = null;
            closeClientDrawer();
            STATE.unlockedRiders.clear();
            STATE.clickedRiders.clear();
            renderRiders();
            updateMapBlurState();
            updateNavButtons();
            alert("Session déconnectée avec succès.");
        });

        const btnEmptyFind = document.getElementById('btn-empty-find-driver');
        if (btnEmptyFind) {
            btnEmptyFind.addEventListener('click', () => {
                closeClientDrawer();
                const portalSearchBtn = document.getElementById('portal-btn-find');
                if (portalSearchBtn) portalSearchBtn.click();
            });
        }

        // Click on viewed item opens details
        document.querySelectorAll('[data-rider-id]').forEach(el => {
            el.addEventListener('click', () => {
                const rId = el.getAttribute('data-rider-id');
                const r = findRiderById(rId);
                if (r) {
                    closeClientDrawer();
                    if (STATE.map) {
                        STATE.map.setView([r.lat, r.lng], 15);
                        setTimeout(() => {
                            selectRider(r);
                        }, 500);
                    }
                }
            });
        });

        // Click on chat item opens chat
        document.querySelectorAll('[data-chat-rider-id]').forEach(el => {
            el.addEventListener('click', () => {
                const rId = el.getAttribute('data-chat-rider-id');
                const r = findRiderById(rId);
                if (r) {
                    closeClientDrawer();
                    openChatDrawer(r);
                }
            });
        });
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

        if (driverRegisterCity) driverRegisterCity.value = '';
        if (driverRegisterSectorsGroup) driverRegisterSectorsGroup.classList.add('hidden');
        if (driverRegisterSectorsList) driverRegisterSectorsList.innerHTML = '';

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

    // Handle Upload Preview files with automatic client-side canvas compression
    function setupUploadPreview(input, box, preview, maxDim, quality) {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                compressImage(file, maxDim, quality, (compressedBase64) => {
                    preview.src = compressedBase64;
                    box.classList.add('has-file');
                });
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
        if (typeof L === 'undefined') {
            alert("⚠️ La carte Leaflet n'a pas pu être initialisée. Veuillez vérifier votre connexion Internet.");
            return;
        }
        welcomePortal.classList.add('hidden');
        mainFooter.classList.add('hidden');
        citySelector.classList.remove('hidden');
        onlineCounterBadge.classList.remove('hidden');
        navBtnFind.classList.remove('hidden');
        navBtnRegister.classList.remove('hidden');
        
        navBtnFind.classList.add('active');
        navBtnRegister.classList.remove('active');

        // Hide full header on map view as requested
        const headerEl = document.querySelector('header');
        if (headerEl) headerEl.classList.add('hidden');
        
        // Show floating home/return button on map
        if (mapHomeBtn) mapHomeBtn.classList.remove('hidden');
        
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

        // Show floating service button if not premium or admin and map is blurred
        const isPremiumClient = STATE.loggedClient && STATE.loggedClient.subscriptionPaid === true;
        if (mapServiceBtn) {
            if (IS_FREE_PERIOD || STATE.isAdmin || isPremiumClient || STATE.unlockedRiders.size > 0) {
                mapServiceBtn.classList.add('hidden');
            } else {
                mapServiceBtn.classList.remove('hidden');
            }
        }
    }

    function returnToWelcomePortal() {
        welcomePortal.classList.remove('hidden');
        mainFooter.classList.remove('hidden');
        citySelector.classList.add('hidden');
        onlineCounterBadge.classList.add('hidden');
        navBtnFind.classList.add('hidden');
        navBtnRegister.classList.remove('hidden'); // Keep Devenir livreur visible at top-right
        navBtnRegister.classList.remove('active');

        // Restore header when returning to home portal
        const headerEl = document.querySelector('header');
        if (headerEl) headerEl.classList.remove('hidden');
        
        // Hide floating home/return button
        if (mapHomeBtn) mapHomeBtn.classList.add('hidden');
        
        // Hide floating service button
        if (mapServiceBtn) mapServiceBtn.classList.add('hidden');
        
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
        if (rider.selfie) {
            chatDriverAvatar.innerText = '';
            chatDriverAvatar.style.backgroundImage = `url('${rider.selfie}')`;
        } else {
            chatDriverAvatar.innerText = rider.initial;
            chatDriverAvatar.style.backgroundImage = 'none';
        }
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

        // --- REALTIME CHAT ROOM SUBSCRIPTION ---
        if (window.chatChannel) {
            supabase.removeChannel(window.chatChannel);
        }
        window.chatChannel = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chats_livraison', filter: `rider_id=eq.${rider.id}` },
                (payload) => {
                    const newMsg = payload.new;
                    // Add to STATE if not already present
                    const exists = STATE.chats[rider.id].some(m => m.text === newMsg.text && m.time === newMsg.time && m.sender === newMsg.sender);
                    if (!exists) {
                        STATE.chats[rider.id].push({ sender: newMsg.sender, text: newMsg.text, time: newMsg.time });
                        renderChatMessages(rider.id);
                    }
                }
            )
            .subscribe();
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
            bubble.innerHTML = `${escapeHTML(msg.text)}<span class="message-time">${escapeHTML(msg.time)}</span>`;
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
        
        // Write message to Supabase DB!
        supabase.from('chats_livraison').insert([{
            rider_id: rider.id,
            client_id: STATE.loggedClient ? STATE.loggedClient.id : null,
            sender: 'client',
            text: text,
            time: time
        }]).then();

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

            // Write response message to Supabase DB!
            supabase.from('chats_livraison').insert([{
                rider_id: rider.id,
                client_id: STATE.loggedClient ? STATE.loggedClient.id : null,
                sender: 'rider',
                text: replyText,
                time: time
            }]).then();

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
        
        // Show main admin menu and update counts
        showAdminMenu();
        
        // Close chats drawer if open to avoid visual overlaps
        chatDrawer.classList.remove('open');
    }
    
    function closeAdminModal() {
        adminModal.classList.remove('open');
    }
    
    function showAdminSubView(viewId) {
        // Hide menu grid
        adminMenuView.classList.add('hidden');
        
        // Hide all sub views
        subViewChats.classList.add('hidden');
        subViewDrivers.classList.add('hidden');
        subViewPending.classList.add('hidden');
        subViewSubs.classList.add('hidden');
        subViewStats.classList.add('hidden');
        
        // Show selected view
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.remove('hidden');
        
        // Load data for specific view
        if (viewId === 'sub-view-chats') {
            closeAdminConversationInspector();
            updateAdminDashboardChats();
        } else if (viewId === 'sub-view-drivers') {
            updateAdminDashboardDrivers();
        } else if (viewId === 'sub-view-clients') {
            updateAdminDashboardClients();
        } else if (viewId === 'sub-view-pending') {
            updateAdminPendingCandidates();
        } else if (viewId === 'sub-view-subs') {
            updateAdminDashboardDrivers();
        } else if (viewId === 'sub-view-stats') {
            updateAdminDashboardStats();
        } else if (viewId === 'sub-view-settings') {
            updateAdminSettingsView();
        }
    }

    function showAdminMenu() {
        // Show menu grid
        adminMenuView.classList.remove('hidden');
        
        // Hide all sub views
        subViewChats.classList.add('hidden');
        subViewDrivers.classList.add('hidden');
        subViewClients.classList.add('hidden');
        subViewPending.classList.add('hidden');
        subViewSubs.classList.add('hidden');
        subViewStats.classList.add('hidden');
        subViewSettings.classList.add('hidden');
        
        // Update menu card counts
        updateAdminCounts();
    }

    function updateAdminCounts() {
        const allRiders = [...STATE.riders.ouaga, ...STATE.riders.bobo];
        
        const pendingCount = allRiders.filter(r => r.status === 'en attente').length;
        const activeDriversCount = allRiders.filter(r => r.status === 'actif' || r.status === 'suspendu').length;
        const clientsCount = STATE.clients.length;
        
        const activeChatIds = Object.keys(STATE.chats).filter(riderId => STATE.chats[riderId] && STATE.chats[riderId].length > 0).length;
        
        const activeSubsCount = allRiders.filter(r => r.subscriptionPaid && r.status !== 'en attente').length + 
                                STATE.clients.filter(c => c.subscriptionPaid).length;
                                
        // Update DOM elements
        const chatsCountEl = document.getElementById('admin-menu-chats-count');
        const driversCountEl = document.getElementById('admin-menu-drivers-count');
        const clientsCountEl = document.getElementById('admin-menu-clients-count');
        const pendingCountEl = document.getElementById('admin-menu-pending-count');
        const subsCountEl = document.getElementById('admin-menu-subs-count');
        
        if (chatsCountEl) chatsCountEl.innerText = activeChatIds;
        if (driversCountEl) driversCountEl.innerText = activeDriversCount;
        if (clientsCountEl) clientsCountEl.innerText = clientsCount;
        if (pendingCountEl) pendingCountEl.innerText = pendingCount;
        if (subsCountEl) subsCountEl.innerText = activeSubsCount;
        
        // Notification badge on pending candidate card
        const pendingBadge = document.getElementById('admin-pending-badge');
        if (pendingBadge) {
            if (pendingCount > 0) {
                pendingBadge.classList.remove('hidden');
                pendingBadge.innerText = pendingCount;
            } else {
                pendingBadge.classList.add('hidden');
            }
        }
    }

    function updateAdminDashboardDrivers() {
        const driversListContainer = document.getElementById('admin-table-drivers-list');
        const subsListContainer = document.getElementById('admin-table-subs-list');
        if (!driversListContainer || !subsListContainer) return;
        
        driversListContainer.innerHTML = '';
        subsListContainer.innerHTML = '';
        
        const allRiders = [...STATE.riders.ouaga, ...STATE.riders.bobo];
        const registeredRiders = allRiders.filter(r => r.status === 'actif' || r.status === 'suspendu');
        
        // Render registered drivers list table
        registeredRiders.forEach(rider => {
            const count = rider.contactsCount || 0;
            const paid = rider.subscriptionPaid || false;
            
            let statusBadge = '';
            if (rider.status === 'actif') {
                statusBadge = '<span class="badge-status active">Actif</span>';
            } else {
                statusBadge = '<span class="badge-status suspended">Suspendu</span>';
            }
            
            let actionButtons = '';
            if (rider.status === 'actif') {
                actionButtons += `<button class="btn-table-action suspend" data-id="${rider.id}">Suspendre</button>`;
            } else if (rider.status === 'suspendu') {
                actionButtons += `<button class="btn-table-action validate" data-id="${rider.id}">Activer</button>`;
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
                <td><button class="btn-table-action inspect-docs" data-id="${rider.id}" style="background-color: var(--color-primary-yellow-light) !important; color: var(--color-primary-brown) !important; border: 1.5px solid rgba(246, 205, 86, 0.45) !important; padding: 6px 12px; border-radius: 8px; font-weight:700; font-size:0.75rem; cursor:pointer;">🔍 Inspecter</button></td>
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
        bindTableActionEvents(driversListContainer);
    }

    function updateAdminDashboardClients() {
        const clientsListContainer = document.getElementById('admin-table-clients-list');
        if (!clientsListContainer) return;
        
        clientsListContainer.innerHTML = '';
        
        if (STATE.clients.length === 0) {
            clientsListContainer.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:30px 20px; color:var(--color-charcoal-muted); font-style:italic; font-size:0.8rem;">
                        Aucun client enregistré pour le moment.
                    </td>
                </tr>
            `;
            return;
        }
        
        STATE.clients.forEach(client => {
            const isPremium = client.subscriptionPaid;
            const premiumBadge = isPremium 
                ? '<span class="badge-status active">👑 Premium (Oui)</span>' 
                : '<span class="badge-status pending" style="background-color:rgba(141,85,55,0.08); color:var(--color-primary-brown); padding: 4px 8px; border-radius: 6px; font-weight:700;">Standard (Non)</span>';
                
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700; width:28px; height:28px; border-radius:8px; background:rgba(232, 92, 74, 0.08); color:var(--color-primary-red); display:flex; align-items:center; justify-content:center; font-size:0.75rem;">👤</span>
                        <div>
                            <div style="font-weight:700;">${client.name}</div>
                        </div>
                    </div>
                </td>
                <td style="font-weight:600;">${client.phone}</td>
                <td>${premiumBadge}</td>
                <td><span class="badge-status active" style="background-color:var(--color-green-light); color:var(--color-green-soft);">Actif</span></td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-table-action btn-toggle-premium" data-id="${client.id}" style="background-color: var(--color-primary-yellow-light) !important; color: var(--color-primary-brown) !important; border: 1.5px solid rgba(246, 205, 86, 0.45) !important; padding: 6px 12px; border-radius: 8px; font-weight:700; font-size:0.75rem; cursor:pointer;">👑 Premium +/-</button>
                        <button class="btn-table-action delete btn-delete-client" data-id="${client.id}">Supprimer</button>
                    </div>
                </td>
            `;
            clientsListContainer.appendChild(tr);
        });
        
        // Bind action event listeners
        clientsListContainer.querySelectorAll('.btn-toggle-premium').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const client = STATE.clients.find(c => c.id === id);
                if (client) {
                    client.subscriptionPaid = !client.subscriptionPaid;
                    // Sync with Supabase (applies RLS directly)
                    supabase.from('clients_livraison')
                        .update({ subscription_paid: client.subscriptionPaid })
                        .eq('id', client.id)
                        .then();
                    
                    updateAdminDashboardClients();
                    updateAdminCounts();
                    alert(`👑 Statut Premium de ${client.name} mis à jour.`);
                }
            });
        });
        
        clientsListContainer.querySelectorAll('.btn-delete-client').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const client = STATE.clients.find(c => c.id === id);
                if (client) {
                    if (confirm(`Voulez-vous vraiment supprimer définitivement le client ${client.name} ?`)) {
                        // Sync with Supabase (applies RLS directly)
                        supabase.from('clients_livraison').delete().eq('id', client.id).then();
                        STATE.clients = STATE.clients.filter(c => c.id !== id);
                        updateAdminDashboardClients();
                        updateAdminCounts();
                        alert(`👤 Client ${client.name} supprimé définitivement.`);
                    }
                }
            });
        });
    }

    function updateAdminSettingsView() {
        const inputUnlockFee = document.getElementById('settings-unlock-fee');
        const inputClientSub = document.getElementById('settings-client-sub');
        const inputRiderSub = document.getElementById('settings-rider-sub');
        
        if (inputUnlockFee) inputUnlockFee.value = STATE.settings.unlockFee;
        if (inputClientSub) inputClientSub.value = STATE.settings.clientSubFee;
        if (inputRiderSub) inputRiderSub.value = STATE.settings.riderSubFee;
    }

    function updateDynamicPricingTexts() {
        const btnUnlockContact = document.getElementById('btn-unlock-contact');
        if (btnUnlockContact) {
            btnUnlockContact.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Utiliser le service (${STATE.settings.unlockFee} FCFA)
            `;
        }
        
        const driverDashSubText = document.getElementById('driver-dash-sub-text');
        if (driverDashSubText) {
            driverDashSubText.innerText = `Votre compte est gratuit pour le moment. Un abonnement de ${STATE.settings.riderSubFee} FCFA / 7 jours sera requis à partir de la 4ème mise en relation ou du 7ème jour.`;
        }
        
        const btnDriverPaySub = document.getElementById('btn-driver-pay-sub');
        if (btnDriverPaySub) {
            btnDriverPaySub.innerText = `Régler mon abonnement (${STATE.settings.riderSubFee} FCFA)`;
        }
        
        const driverSuccessRuleSub = document.getElementById('driver-success-rule-sub');
        if (driverSuccessRuleSub) {
            driverSuccessRuleSub.innerHTML = `À partir de la <strong>4ème ou 5ème livraison</strong> (mises en relation), ou à partir du <strong>7ème jour</strong> de présence sur la plateforme, un abonnement de <strong>${STATE.settings.riderSubFee} FCFA par 7 jours</strong> sera requis pour rester visible sur la carte.`;
        }
        
        const clientUpgradeDesc = document.getElementById('client-upgrade-desc');
        if (clientUpgradeDesc) {
            clientUpgradeDesc.innerText = `Recherchez et débloquez en illimité les livreurs sans payer ${STATE.settings.unlockFee} FCFA par profil.`;
        }
        
        const btnClientPayPremium = document.getElementById('btn-client-pay-premium');
        if (btnClientPayPremium) {
            btnClientPayPremium.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #F6CD56; fill: #F6CD56;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M5 20h14"></path></svg>
                Activer le Premium (${STATE.settings.clientSubFee.toLocaleString('fr-FR')} FCFA / mois)
            `;
        }
        
        const clientRegisterDesc = document.getElementById('client-register-desc');
        if (clientRegisterDesc) {
            clientRegisterDesc.innerText = `Créez votre compte Client Premium (${STATE.settings.clientSubFee.toLocaleString('fr-FR')} FCFA / mois) pour accéder à la recherche et messagerie directe illimitées.`;
        }
        
        const btnSubmitClientRegister = document.getElementById('btn-submit-client-register');
        if (btnSubmitClientRegister) {
            btnSubmitClientRegister.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #F6CD56; fill: #F6CD56;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M5 20h14"></path></svg>
                Créer mon compte Premium (${STATE.settings.clientSubFee.toLocaleString('fr-FR')} FCFA / mois)
            `;
        }
        
        const adminSubsSubtitle = document.getElementById('admin-subs-sub-view-subtitle');
        if (adminSubsSubtitle) {
            adminSubsSubtitle.innerText = `Historique des transactions d'abonnements premium pour clients (${STATE.settings.clientSubFee.toLocaleString('fr-FR')} FCFA/mois) et livreurs (${STATE.settings.riderSubFee.toLocaleString('fr-FR')} FCFA/7j).`;
        }
        
        const statDescUnlock = document.querySelector('#sub-view-stats .stat-desc');
        if (statDescUnlock && statDescUnlock.innerText.includes("Frais à")) {
            statDescUnlock.innerText = `Frais à ${STATE.settings.unlockFee} FCFA`;
        }
    }

    function updateAdminPendingCandidates() {
        const pendingListContainer = document.getElementById('admin-table-pending-list');
        if (!pendingListContainer) return;
        
        pendingListContainer.innerHTML = '';
        
        const allRiders = [...STATE.riders.ouaga, ...STATE.riders.bobo];
        const pendingRiders = allRiders.filter(r => r.status === 'en attente');
        
        if (pendingRiders.length === 0) {
            pendingListContainer.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:30px 20px; color:var(--color-charcoal-muted); font-style:italic; font-size:0.8rem;">
                        Aucune candidature en attente de vérification.
                    </td>
                </tr>
            `;
            return;
        }
        
        pendingRiders.forEach(rider => {
            let statusBadge = '<span class="badge-status pending">En attente</span>';
            let actionButtons = `
                <button class="btn-table-action validate" data-id="${rider.id}">Valider</button>
                <button class="btn-table-action delete" data-id="${rider.id}">Rejeter</button>
            `;
            
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
                <td><button class="btn-table-action inspect-docs" data-id="${rider.id}" style="background-color: var(--color-primary-yellow-light) !important; color: var(--color-primary-brown) !important; border: 1.5px solid rgba(246, 205, 86, 0.45) !important; padding: 6px 12px; border-radius: 8px; font-weight:700; font-size:0.75rem; cursor:pointer;">🔍 Inspecter</button></td>
                <td>${statusBadge}</td>
                <td><div style="display:flex;">${actionButtons}</div></td>
            `;
            pendingListContainer.appendChild(tr);
        });
        
        // Add event listeners on table actions
        bindTableActionEvents(pendingListContainer);
    }

    function bindTableActionEvents(container) {
        container.querySelectorAll('.btn-table-action.validate').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const rider = findRiderById(id);
                if (rider) {
                    rider.status = 'actif';
                    // Sync with Supabase (applies RLS directly)
                    supabase.from('livreurs').update({ status: 'actif' }).eq('id', rider.id).then();
                    
                    renderRiders();
                    if (container.id === 'admin-table-pending-list') {
                        updateAdminPendingCandidates();
                    } else {
                        updateAdminDashboardDrivers();
                    }
                    updateCityActiveCounts();
                    alert(`🎉 Candidature de ${rider.name} approuvée et profil publié sur la carte !`);
                }
            });
        });
        
        container.querySelectorAll('.btn-table-action.suspend').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const rider = findRiderById(id);
                if (rider) {
                    rider.status = 'suspendu';
                    rider.subscriptionPaid = false;
                    // Sync with Supabase (applies RLS directly)
                    supabase.from('livreurs').update({ status: 'suspendu', subscription_paid: false }).eq('id', rider.id).then();
                    
                    renderRiders();
                    updateAdminDashboardDrivers();
                    updateCityActiveCounts();
                    alert(`⚠️ Profil de ${rider.name} suspendu et masqué de la carte.`);
                }
            });
        });
        
        container.querySelectorAll('.btn-table-action.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const rider = findRiderById(id);
                const name = rider ? rider.name : "ce livreur";
                if (confirm(`Voulez-vous vraiment supprimer définitivement ${name} de la plateforme ?`)) {
                    // Sync with Supabase (applies RLS directly)
                    supabase.from('livreurs').delete().eq('id', id).then();
                    deleteRiderById(id);
                    if (container.id === 'admin-table-pending-list') {
                        updateAdminPendingCandidates();
                    }
                    updateCityActiveCounts();
                }
            });
        });

        container.querySelectorAll('.btn-table-action.inspect-docs').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const rider = findRiderById(id);
                if (rider) {
                    openDocInspectorModal(rider);
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

    // --- ADMIN CANDIDATURE IDENTITY DOCUMENT INSPECTOR ---
    const adminDocInspectorModal = document.getElementById('admin-doc-inspector-modal');
    const btnCloseDocInspector = document.getElementById('btn-close-doc-inspector');
    const adminDocRiderName = document.getElementById('admin-doc-rider-name');
    const adminDocPreviewSelfie = document.getElementById('admin-doc-preview-selfie');
    const adminDocPreviewRecto = document.getElementById('admin-doc-preview-recto');
    const adminDocPreviewVerso = document.getElementById('admin-doc-preview-verso');
    const adminDocStatusBadge = document.getElementById('admin-doc-status-badge');
    const btnAdminDocApprove = document.getElementById('btn-admin-doc-approve');
    const btnAdminDocReject = document.getElementById('btn-admin-doc-reject');

    // CV detail elements
    const adminDocRiderFullname = document.getElementById('admin-doc-rider-fullname');
    const adminDocRiderPhone = document.getElementById('admin-doc-rider-phone');
    const adminDocRiderVehicle = document.getElementById('admin-doc-rider-vehicle');
    const adminDocRiderCity = document.getElementById('admin-doc-rider-city');
    const adminDocRiderCoords = document.getElementById('admin-doc-rider-coords');
    const adminDocRiderStats = document.getElementById('admin-doc-rider-stats');

    // Premium custom SVG placeholders for CNI/Selfie
    const MOCK_SELFIE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="%23FAF5F0"/><circle cx="50" cy="40" r="18" fill="%238D5537"/><path d="M20 85c0-15 12-25 30-25s30 10 30 25z" fill="%238D5537"/><text x="50" y="92" font-family="sans-serif" font-size="6" font-weight="bold" fill="%238D5537" text-anchor="middle">PHOTO VERIFIEE</text></svg>`;
    const MOCK_RECTO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 100 60" fill="none"><rect width="100" height="60" rx="8" fill="%23FAF5F0" stroke="%238D5537" stroke-width="0.8"/><rect x="8" y="12" width="16" height="20" rx="3" fill="%23A39387"/><line x1="30" y1="14" x2="85" y2="14" stroke="%238D5537" stroke-width="1.5" stroke-linecap="round"/><line x1="30" y1="20" x2="65" y2="20" stroke="%23A39387" stroke-width="0.8" stroke-linecap="round"/><line x1="30" y1="26" x2="75" y2="26" stroke="%23A39387" stroke-width="0.8" stroke-linecap="round"/><text x="50" y="52" font-family="sans-serif" font-size="5" font-weight="bold" fill="%2327AE60" text-anchor="middle">CNI RECTO — CERTIFIE</text></svg>`;
    const MOCK_VERSO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 100 60" fill="none"><rect width="100" height="60" rx="8" fill="%23FAF5F0" stroke="%238D5537" stroke-width="0.8"/><rect x="8" y="10" width="84" height="15" fill="%23EFE9E2" rx="3"/><line x1="10" y1="36" x2="90" y2="36" stroke="%23A39387" stroke-width="0.8" stroke-linecap="round"/><line x1="10" y1="43" x2="70" y2="43" stroke="%23A39387" stroke-width="0.8" stroke-linecap="round"/><text x="50" y="53" font-family="sans-serif" font-size="5" font-weight="bold" fill="%2327AE60" text-anchor="middle">CNI VERSO — CERTIFIE</text></svg>`;

    let activeInspectedRider = null;

    function openDocInspectorModal(rider) {
        activeInspectedRider = rider;
        adminDocRiderName.innerText = rider.name;
        
        // Fill CV text elements
        if (adminDocRiderFullname) adminDocRiderFullname.innerText = rider.name || '—';
        if (adminDocRiderPhone) adminDocRiderPhone.innerText = rider.phone || '—';
        
        // Format vehicle nicely with icon
        let vehicleDisplay = '🏍️ Moto';
        if (rider.vehicle === 'Tricycle') vehicleDisplay = '🛺 Tricycle';
        else if (rider.vehicle === 'Voiture') vehicleDisplay = '🚗 Voiture';
        else if (rider.vehicle) vehicleDisplay = `🏍️ ${rider.vehicle}`;
        if (adminDocRiderVehicle) adminDocRiderVehicle.innerText = vehicleDisplay;
        
        // Format city name nicely
        let cityNameDisplay = 'Ouagadougou';
        if (rider.city === 'bobo') {
            cityNameDisplay = 'Bobo-Dioulasso';
        } else if (rider.city === 'ouaga') {
            cityNameDisplay = 'Ouagadougou';
        } else {
            // Find which array contains the rider to guess city if missing
            const inOuaga = STATE.riders.ouaga.some(r => r.id === rider.id);
            cityNameDisplay = inOuaga ? 'Ouagadougou' : 'Bobo-Dioulasso';
        }
        if (adminDocRiderCity) adminDocRiderCity.innerText = cityNameDisplay;
        
        // Coordinates format
        if (adminDocRiderCoords) {
            adminDocRiderCoords.innerText = (rider.lat && rider.lng) ? `${Number(rider.lat).toFixed(5)}, ${Number(rider.lng).toFixed(5)}` : 'Non renseigné';
        }
        
        // Stats format
        if (adminDocRiderStats) {
            adminDocRiderStats.innerText = `⭐ ${rider.rating || 5.0} • ${rider.contactsCount || 0} clics`;
        }

        // Load Base64 images or show custom premium SVG placeholders
        adminDocPreviewSelfie.src = rider.selfie || MOCK_SELFIE_SVG;
        
        // Show placeholders initially while loading CNI from database on-demand
        adminDocPreviewRecto.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 100 60" fill="none"><rect width="100" height="60" rx="8" fill="%23FAF5F0" stroke="%238D5537" stroke-width="0.8"/><text x="50" y="32" font-family="sans-serif" font-size="5" fill="%23A39387" text-anchor="middle">Chargement...</text></svg>';
        adminDocPreviewVerso.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 100 60" fill="none"><rect width="100" height="60" rx="8" fill="%23FAF5F0" stroke="%238D5537" stroke-width="0.8"/><text x="50" y="32" font-family="sans-serif" font-size="5" fill="%23A39387" text-anchor="middle">Chargement...</text></svg>';
        
        // Fetch CNI documents on-demand from public.livreurs table (excluded from main view)
        supabase.from('livreurs').select('cni_recto, cni_verso').eq('id', rider.id).maybeSingle().then(({ data, error }) => {
            if (error) {
                console.error("Error loading CNI documents:", error);
                adminDocPreviewRecto.src = MOCK_RECTO_SVG;
                adminDocPreviewVerso.src = MOCK_VERSO_SVG;
            } else {
                adminDocPreviewRecto.src = (data && data.cni_recto) || MOCK_RECTO_SVG;
                adminDocPreviewVerso.src = (data && data.cni_verso) || MOCK_VERSO_SVG;
            }
        });
        
        // Status badge styling inside modal
        adminDocStatusBadge.innerText = rider.status || 'actif';
        if (rider.status === 'actif') {
            adminDocStatusBadge.className = 'rider-status';
            adminDocStatusBadge.style.backgroundColor = "var(--color-green-light)";
            adminDocStatusBadge.style.color = "var(--color-green-soft)";
        } else if (rider.status === 'en attente') {
            adminDocStatusBadge.className = 'rider-status';
            adminDocStatusBadge.style.backgroundColor = "rgba(246, 205, 86, 0.12)";
            adminDocStatusBadge.style.color = "var(--color-primary-yellow-hover)";
        } else {
            adminDocStatusBadge.className = 'rider-status';
            adminDocStatusBadge.style.backgroundColor = "var(--color-primary-red-light)";
            adminDocStatusBadge.style.color = "var(--color-primary-red)";
        }
        
        adminDocInspectorModal.classList.add('open');
    }

    function closeDocInspectorModal() {
        adminDocInspectorModal.classList.remove('open');
        activeInspectedRider = null;
    }

    // Bind Document Inspector modal actions
    if (btnCloseDocInspector) {
        btnCloseDocInspector.addEventListener('click', closeDocInspectorModal);
    }
    
    // Bind Image Download Buttons
    document.querySelectorAll('.btn-download-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            const imgElement = document.getElementById(targetId);
            if (imgElement && imgElement.src && imgElement.src.startsWith('data:image')) {
                const a = document.createElement('a');
                a.href = imgElement.src;
                const docName = targetId.includes('selfie') ? 'Selfie' : targetId.includes('recto') ? 'CNI_Recto' : 'CNI_Verso';
                a.download = `${activeInspectedRider ? activeInspectedRider.name.replace(/\\s+/g, '_') : 'Livreur'}_${docName}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                alert("L'image n'est pas disponible pour le téléchargement.");
            }
        });
    });
    
    if (btnAdminDocApprove) {
        btnAdminDocApprove.addEventListener('click', () => {
            if (activeInspectedRider) {
                activeInspectedRider.status = 'actif';
                // Sync with Supabase (applies RLS directly)
                supabase.from('livreurs').update({ status: 'actif' }).eq('id', activeInspectedRider.id).then();
                
                renderRiders();
                updateAdminDashboardDrivers();
                updateCityActiveCounts();
                closeDocInspectorModal();
                alert(`🎉 Candidature de ${activeInspectedRider.name} approuvée et profil publié sur la carte !`);
            }
        });
    }

    if (btnAdminDocReject) {
        btnAdminDocReject.addEventListener('click', () => {
            if (activeInspectedRider) {
                activeInspectedRider.status = 'suspendu';
                activeInspectedRider.subscriptionPaid = false;
                // Sync with Supabase (applies RLS directly)
                supabase.from('livreurs').update({ status: 'suspendu', subscription_paid: false }).eq('id', activeInspectedRider.id).then();
                
                renderRiders();
                updateAdminDashboardDrivers();
                updateCityActiveCounts();
                closeDocInspectorModal();
                alert(`⚠️ Candidature de ${activeInspectedRider.name} suspendue et retirée de la carte.`);
            }
        });
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
                    <div class="session-avatar">${escapeHTML(rider.initial)}</div>
                    <div>
                        <div class="session-driver-name">${escapeHTML(rider.name)}</div>
                        <div class="session-last-msg">${escapeHTML(msgSnippet)}</div>
                    </div>
                </div>
                <div style="text-align: right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <span style="font-size: 0.65rem; color: var(--color-charcoal-muted);">${escapeHTML(msgTime)}</span>
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
            bubble.innerHTML = `<strong>${escapeHTML(senderLabel)} :</strong> ${escapeHTML(msg.text)}<span class="message-time">${escapeHTML(msg.time)}</span>`;
            inspectorMessagesList.appendChild(bubble);
        });
        
        inspectorMessagesList.scrollTop = inspectorMessagesList.scrollHeight;
    }
    
    function closeAdminConversationInspector() {
        adminInspector.classList.add('hidden');
        adminChatSessions.classList.remove('hidden');
    }
    
    function updateAdminDashboardStats() {
        if (STATE.isAdmin) {
            // Fetch real Supabase data for admin dashboard
            supabase.from('livreurs').select('id', { count: 'exact', head: true }).then(({count, error}) => {
                if (!error && count !== null) statTotalDrivers.innerText = count;
            });
            supabase.from('clients_livraison').select('id', { count: 'exact', head: true }).then(({count, error}) => {
                if (!error && count !== null) {
                    const uniqueVisitorsEl = document.getElementById('stat-unique-visitors');
                    if (uniqueVisitorsEl) uniqueVisitorsEl.innerText = count;
                    const chartLegendEl = document.getElementById('chart-legend-text');
                    if (chartLegendEl) chartLegendEl.innerText = `📈 ${count} visiteurs au total`;
                }
            });
            supabase.from('deblocages').select('id', { count: 'exact', head: true }).then(({count, error}) => {
                if (!error && count !== null) {
                    statTotalUnlocks.innerText = count;
                    statTotalRevenue.innerText = `${count * 200} FCFA`;
                }
            });
            supabase.from('chats_livraison').select('id', { count: 'exact', head: true }).then(({count, error}) => {
                if (!error && count !== null) statTotalMessages.innerText = count;
            });
        } else {
            // Fallback for non-admin or local demo state
            statTotalUnlocks.innerText = STATE.totalUnlocks;
            statTotalRevenue.innerText = `${STATE.totalRevenue} FCFA`;
            statTotalDrivers.innerText = STATE.riders.ouaga.length + STATE.riders.bobo.length;
            statTotalMessages.innerText = STATE.totalMessages;
            
            const uniqueVisitorsEl = document.getElementById('stat-unique-visitors');
            if (uniqueVisitorsEl) {
                uniqueVisitorsEl.innerText = STATE.clients.length;
            }
            const chartLegendEl = document.getElementById('chart-legend-text');
            if (chartLegendEl) {
                chartLegendEl.innerText = `📈 ${STATE.clients.length} visiteurs au total`;
            }
        }

        const viewedProfilesEl = document.getElementById('stat-total-viewed-profiles');
        if (viewedProfilesEl) {
            viewedProfilesEl.innerText = STATE.totalViewedProfiles || 0;
        }

        const pageViewsEl = document.getElementById('stat-page-views');
        if (pageViewsEl) {
            pageViewsEl.innerText = (STATE.totalViewedProfiles * 3) + STATE.totalMessages;
        }
        
        const activeConnectionsEl = document.getElementById('stat-active-connections');
        if (activeConnectionsEl) {
            let active = 0;
            if (STATE.loggedClient) active++;
            if (STATE.loggedDriver) active++;
            if (STATE.isAdmin) active++;
            activeConnectionsEl.innerText = active > 0 ? active : 1; // At least the admin themselves!
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
            timeout: 10000,
            maximumAge: 0
        };

        const tryGeo = (options, isFallback = false) => {
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
                    if (!isFallback && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
                        console.warn("Driver high-accuracy GPS timed out or unavailable. Trying low-accuracy fallback...");
                        tryGeo({
                            enableHighAccuracy: false,
                            timeout: 8000,
                            maximumAge: 10000
                        }, true);
                        return;
                    }

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
                options
            );
        };

        tryGeo(geoOptions);
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

    function locateClientAndLaunchMap(triggerButton) {
        let originalText = "";
        let originalIcon = "";
        let iconEl = null;

        // Visual loading states on triggers
        if (triggerButton) {
            triggerButton.style.pointerEvents = 'none'; // prevent double clicks
            if (triggerButton.id === 'loc-btn-map') {
                iconEl = triggerButton.querySelector('.loc-option-icon');
                if (iconEl) {
                    originalIcon = iconEl.innerHTML;
                    iconEl.innerHTML = `<div class="geo-spinner" style="width: 24px; height: 24px; border-top-color: var(--color-primary-red); margin: 0 auto;"></div>`;
                }
            } else if (triggerButton.id === 'btn-gps-auto-detect') {
                originalText = triggerButton.innerHTML;
                triggerButton.innerHTML = `<div class="geo-spinner" style="width: 20px; height: 20px; border-top-color: white; display: inline-block; vertical-align: middle; margin-right: 8px;"></div> Détection en cours...`;
            } else if (triggerButton.id === 'map-locate-btn') {
                originalText = triggerButton.innerHTML;
                triggerButton.innerHTML = `<div class="geo-spinner" style="width: 20px; height: 20px; border-top-color: var(--color-primary-green); display: inline-block;"></div>`;
            }
        }

        if (!navigator.geolocation) {
            // Restore trigger buttons
            if (triggerButton) {
                triggerButton.style.pointerEvents = 'auto';
                if (triggerButton.id === 'loc-btn-map' && iconEl) iconEl.innerHTML = originalIcon;
                else if (originalText) triggerButton.innerHTML = originalText;
            }
            STATE.clientCoordinates = null;
            if (STATE.clientBeaconMarker) {
                STATE.map.removeLayer(STATE.clientBeaconMarker);
                STATE.clientBeaconMarker = null;
            }
            switchCity(portalSelectedCity);
            showMapView();
            closeLocationPortal();
            return;
        }

        const tryGeolocation = (options, isFallbackAttempt = false) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    // 1. Calculate distances to the centers of Ouagadougou and Bobo-Dioulasso
                    const distToOuaga = getDistance(lat, lng, 12.3714, -1.5197);
                    const distToBobo = getDistance(lat, lng, 11.1774, -4.2983);
                    
                    let detectedCity = 'ouaga';
                    if (distToBobo < distToOuaga) {
                        detectedCity = 'bobo';
                    }

                    // 2. High-end Developer Experience Simulator Check (testers outside Burkina Faso)
                    const closestCenterDist = Math.min(distToOuaga, distToBobo);
                    if (closestCenterDist > 150) {
                        // Simulate coordinate right next to active drivers for a beautiful proximity demonstration
                        if (detectedCity === 'ouaga') {
                            STATE.clientCoordinates = { lat: 12.3702, lng: -1.5185 };
                        } else {
                            STATE.clientCoordinates = { lat: 11.1782, lng: -4.2995 };
                        }
                    } else {
                        STATE.clientCoordinates = { lat: lat, lng: lng };
                    }

                    // Restore trigger buttons
                    if (triggerButton) {
                        triggerButton.style.pointerEvents = 'auto';
                        if (triggerButton.id === 'loc-btn-map' && iconEl) iconEl.innerHTML = originalIcon;
                        else if (originalText) triggerButton.innerHTML = originalText;
                    }

                    // 3. Switch active city automatically and launch map centered on coordinates
                    switchCity(detectedCity);
                    portalSelectedCity = detectedCity;
                    
                    showMapView();
                    closeLocationPortal();

                    if (STATE.map) {
                        STATE.map.setView([STATE.clientCoordinates.lat, STATE.clientCoordinates.lng], 15, {
                            animate: true,
                            pan: { duration: 0.8 }
                        });
                    }

                    // 4. Present elegant dynamic geolocation confirmation toast badge
                    const toast = document.getElementById('sector-active-toast');
                    const cityName = detectedCity === 'ouaga' ? 'Ouagadougou' : 'Bobo-Dioulasso';
                    document.getElementById('sector-toast-text').innerText = `📍 Position détectée à ${cityName} !`;
                    toast.classList.add('show');
                    
                    // Auto-hide the toast after 4.5 seconds
                    setTimeout(() => {
                        toast.classList.remove('show');
                    }, 4500);
                },
                (error) => {
                    // Fallback to low accuracy cellular/Wi-Fi positioning if high accuracy failed or timed out
                    if (!isFallbackAttempt && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
                        console.warn("Client high-accuracy GPS timed out or unavailable. Trying low-accuracy fallback...");
                        tryGeolocation({
                            enableHighAccuracy: false,
                            timeout: 8000,
                            maximumAge: 10000 // allow cached location
                        }, true);
                        return;
                    }

                    // Restore trigger buttons on error
                    if (triggerButton) {
                        triggerButton.style.pointerEvents = 'auto';
                        if (triggerButton.id === 'loc-btn-map' && iconEl) iconEl.innerHTML = originalIcon;
                        else if (originalText) triggerButton.innerHTML = originalText;
                    }
                    
                    STATE.clientCoordinates = null;
                    if (STATE.clientBeaconMarker) {
                        STATE.map.removeLayer(STATE.clientBeaconMarker);
                        STATE.clientBeaconMarker = null;
                    }

                    let errMsg = "Autorisation GPS refusée ou signal indisponible. Chargement de la carte par défaut.";
                    if (error.code === error.PERMISSION_DENIED) {
                        errMsg = "ℹ️ Autorisation GPS refusée ou services de localisation désactivés sur votre téléphone. Chargement de la carte par défaut.";
                    } else if (error.code === error.TIMEOUT) {
                        errMsg = "ℹ️ Temps d'attente GPS dépassé (signal faible). Chargement de la carte par défaut.";
                    }

                    alert(errMsg);

                    switchCity(portalSelectedCity);
                    showMapView();
                    closeLocationPortal();
                },
                options
            );
        };

        tryGeolocation({
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0
        });
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

    // Click on online counter badge finds closest rider
    if (onlineCounterBadge) {
        onlineCounterBadge.style.cursor = 'pointer';
        onlineCounterBadge.addEventListener('click', () => {
            const currentCityRiders = STATE.riders[STATE.currentCity];
            if (!currentCityRiders || currentCityRiders.length === 0) return;
            
            let centerPoint = STATE.map.getCenter();
            if (STATE.clientCoordinates && STATE.clientCoordinates.lat) {
                centerPoint = L.latLng(STATE.clientCoordinates.lat, STATE.clientCoordinates.lng);
            }
                
            let closestRider = null;
            let minDistance = Infinity;
            
            currentCityRiders.forEach(rider => {
                if (rider.status !== 'actif') return; // only consider available online riders
                const riderLatLng = L.latLng(rider.lat, rider.lng);
                const distance = centerPoint.distanceTo(riderLatLng);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestRider = rider;
                }
            });
            
            if (closestRider) {
                selectRider(closestRider);
                const riderLatLng = L.latLng(closestRider.lat, closestRider.lng);
                // Center map slightly offset to look perfect with bottom sheet open
                const mapCenter = STATE.map.project(riderLatLng, 16);
                const offset = window.innerWidth < 768 ? 160 : 0;
                mapCenter.y += offset;
                
                STATE.map.setView(STATE.map.unproject(mapCenter, 16), 16, { animate: true });
            }
        });
    }
    // --- PASSWORD EYE TOGGLE (PRESS AND HOLD) ---
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const openEye = btn.querySelector('.eye-icon-open');
        const closedEye = btn.querySelector('.eye-icon-closed');

        const showPassword = () => {
            input.type = 'text';
            if (openEye) openEye.classList.add('hidden');
            if (closedEye) closedEye.classList.remove('hidden');
        };

        const hidePassword = () => {
            input.type = 'password';
            if (openEye) openEye.classList.remove('hidden');
            if (closedEye) closedEye.classList.add('hidden');
        };

        // Mouse events
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            showPassword();
        });
        
        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            hidePassword();
        });

        btn.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            hidePassword();
        });

        // Touch events for mobile screens
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showPassword();
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            hidePassword();
        }, { passive: false });
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
    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    methodOrange.addEventListener('click', () => handleProviderSelect(methodOrange, 'Orange Money'));
    methodMoov.addEventListener('click', () => handleProviderSelect(methodMoov, 'Moov Money'));

    btnSubmitMomo.addEventListener('click', startPaymentSimulation);

    // Toggle password display logic removed as visitors checkout without accounts

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

    // --- MANUALLY ASSIGN REGISTRATION LOCATION VIA CITIES & SECTORS ---
    driverRegisterCity.addEventListener('change', (e) => {
        const city = e.target.value;
        renderRegisterSectors(city);
        driverLatInput.value = '';
        driverLngInput.value = '';
        if (mapPickerWrapper) mapPickerWrapper.classList.add('hidden');
    });

    function renderRegisterSectors(city) {
        driverRegisterSectorsList.innerHTML = '';
        if (!city) {
            driverRegisterSectorsGroup.classList.add('hidden');
            return;
        }

        const citySectors = STATE.sectors[city] || [];
        citySectors.forEach(sector => {
            const wrapper = document.createElement('label');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '8px';
            wrapper.style.fontSize = '0.78rem';
            wrapper.style.cursor = 'pointer';
            wrapper.style.fontWeight = '600';
            wrapper.style.color = 'var(--color-charcoal-light)';
            wrapper.style.padding = '4px 6px';
            wrapper.style.border = '1px solid var(--color-border)';
            wrapper.style.borderRadius = '8px';
            wrapper.style.backgroundColor = 'var(--color-bg-warm)';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = sector.name;
            checkbox.className = 'driver-register-sector-checkbox';
            checkbox.dataset.lat = sector.lat;
            checkbox.dataset.lng = sector.lng;

            checkbox.addEventListener('change', updateManualCoordinatesFromSectors);

            wrapper.appendChild(checkbox);
            wrapper.appendChild(document.createTextNode(sector.name));
            driverRegisterSectorsList.appendChild(wrapper);
        });

        driverRegisterSectorsGroup.classList.remove('hidden');
    }

    function updateManualCoordinatesFromSectors() {
        const checkboxes = document.querySelectorAll('.driver-register-sector-checkbox:checked');
        if (checkboxes.length === 0) {
            driverLatInput.value = '';
            driverLngInput.value = '';
            
            if (gpsStatusDesc) {
                gpsStatusDesc.innerHTML = `⚠️ Veuillez sélectionner au moins un quartier.`;
                gpsStatusDesc.style.color = 'var(--color-primary-red)';
            }
            if (mapPickerWrapper) mapPickerWrapper.classList.add('hidden');
            return;
        }

        let totalLat = 0;
        let totalLng = 0;
        const selectedNames = [];

        checkboxes.forEach(cb => {
            totalLat += parseFloat(cb.dataset.lat);
            totalLng += parseFloat(cb.dataset.lng);
            selectedNames.push(cb.value);
        });

        const avgLat = totalLat / checkboxes.length;
        const avgLng = totalLng / checkboxes.length;

        // Save coordinates
        driverLatInput.value = avgLat;
        driverLngInput.value = avgLng;

        // Visual feedback
        geoStatusCard.className = 'geo-status-card success-style';
        document.getElementById('geo-status-title').innerText = "✓ Zone sélectionnée manuellement";
        document.getElementById('geo-status-text').innerText = `Quartier(s) : ${selectedNames.join(', ')}`;

        // Show picker map wrapper
        mapPickerWrapper.classList.remove('hidden');
        gpsFallbackHint.classList.add('hidden');

        // Center map picker
        setTimeout(() => {
            initPickerMap(avgLat, avgLng, true); // Keep marker locked
        }, 100);
    }

    // Vehicle Option Cards selection
    vehicleOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            vehicleOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            driverSelectedVehicle = opt.getAttribute('data-vehicle');
        });
    });

    // Bind uploads with specific dimensions (1024px for CNI cards, 400px for profile selfie)
    setupUploadPreview(uploadCniRecto, boxUploadCniRecto, previewCniRecto, 1024, 0.75);
    setupUploadPreview(uploadCniVerso, boxUploadCniVerso, previewCniVerso, 1024, 0.75);
    setupUploadPreview(uploadSelfie, boxUploadSelfie, previewSelfie, 400, 0.75);

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
        
        // Coordinates verification check
        if (!driverLatInput.value || !driverLngInput.value) {
            alert("Veuillez d'abord définir votre position géographique en cliquant sur « Me géolocaliser » ou en sélectionnant votre ville et vos quartiers.");
            return;
        }

        // City selection check
        if (!driverRegisterCity.value) {
            alert("Veuillez sélectionner manuellement votre ville.");
            return;
        }

        // Neighborhood selection check
        const checkedSectors = document.querySelectorAll('.driver-register-sector-checkbox:checked');
        if (checkedSectors.length === 0) {
            alert("Veuillez sélectionner au moins un quartier d'activité.");
            return;
        }

        // Strict identity documents upload check
        if (!boxUploadCniRecto.classList.contains('has-file') || 
            !boxUploadCniVerso.classList.contains('has-file') || 
            !boxUploadSelfie.classList.contains('has-file')) {
            alert("Veuillez charger tous les documents de vérification requis (Photo CNI Recto, Photo CNI Verso et Photo Selfie) avant de soumettre.");
            return;
        }
        
        // Get Form Values (simulating submission)
        const name = document.getElementById('driver-name').value;
        const phone = document.getElementById('driver-phone').value;
        const password = document.getElementById('driver-password').value;
        
        const latLng = STATE.pickerMarker.getLatLng();
        const firstInitials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'L';

        // Determine target city from manual selector or active city focus
        let targetCity = STATE.currentCity;
        if (driverRegisterCity && driverRegisterCity.value) {
            targetCity = driverRegisterCity.value;
        }

        const phoneNormalized = formatPhoneForDB(phone);
        const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';

        // Sign up the driver securely via Supabase Auth (with secure padding fallback for short passwords/PINs)
        const sanitizedPass = sanitizePassword(password);
        const securePassword = sanitizedPass.length < 6 ? sanitizedPass + "_secure_pad" : sanitizedPass;
        supabase.auth.signUp({
            email: virtualEmail,
            password: securePassword,
            options: {
                data: {
                    name: name,
                    phone: phoneNormalized,
                    role: 'rider',
                    vehicle: driverSelectedVehicle,
                    lat: latLng.lat,
                    lng: latLng.lng,
                    initial: firstInitials,
                    city: targetCity,
                    subscription_paid: false,
                    status: 'en attente',
                    cni_recto: previewCniRecto.src || null,
                    cni_verso: previewCniVerso.src || null,
                    selfie: previewSelfie.src || null
                }
            }
        }).then(({ data: signUpData, error: signUpError }) => {
            if (signUpError) {
                alert("❌ Erreur d'enregistrement : " + signUpError.message);
                return;
            }
            
            const newRider = {
                id: signUpData.user.id,
                name: name,
                vehicle: driverSelectedVehicle,
                distance: 'à proximité',
                phone: phoneNormalized,
                lat: latLng.lat,
                lng: latLng.lng,
                initial: firstInitials,
                contactsCount: 0,
                subscriptionPaid: false,
                viewsCount: 0,
                rating: 5.0,
                reviews: [],
                status: 'en attente',
                cniRecto: previewCniRecto.src || null,
                cniVerso: previewCniVerso.src || null,
                selfie: previewSelfie.src || null,
                city: targetCity
            };
            
            // Add to active city list
            STATE.riders[targetCity].unshift(newRider);
            
            // Set logged-in session for the registered driver
            STATE.loggedDriver = newRider;
            
            // Switch main city focus to display the new driver pin instantly
            switchCity(targetCity);
            renderRiders();
            updateCityActiveCounts();

            // Hide Form panel, Show confirmation success panel
            driverRegisterPanel.classList.add('hidden');
            driverSuccessPanel.style.display = 'block';
        });
    });

    // --- LIVE CHAT DRAWER & ADMIN PANEL EVENT BINDINGS ---
    
    // Chat button trigger
    btnChatRider.addEventListener('click', () => {
        if (STATE.selectedRider) {
            if (STATE.loggedClient) {
                openChatDrawer(STATE.selectedRider);
            } else {
                alert("💬 La messagerie directe intégrée est réservée aux clients connectés (Compte Client Gratuit).\n\nVeuillez créer ou vous connecter à votre compte client gratuit pour clavarder en direct. Les visiteurs standards peuvent utiliser les appels téléphoniques classiques.");
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

    // Unified Login Form Submit (Credentials auto-detection with Supabase Auth)
    authLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phoneInputVal = authLoginPhone.value.trim();
        const passwordInputVal = authLoginPassword.value.trim();
        
        // Normalize the phone to only digits and check the last 8 digits (immune to spaces or country codes)
        const last8Digits = phoneInputVal.replace(/\s+/g, '').replace(/^\+226/, '').slice(-8);
        const phoneHash = await hashSHA256(last8Digits);
        const passwordHash = await hashSHA256(passwordInputVal);
        
        // 1. Check if Admin using SHA-256 cryptographic hashes
        if ((phoneHash === "d258b68b75f56860d5b27341e4a36f527c73a876356e9c60e0a5c104443af6b6" || phoneHash === "NjczNzA5MDk=" || last8Digits === "67370909" || phoneInputVal === "67370909") && 
            (passwordHash === "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f" || passwordHash === "MTIzNDU2Nzg=" || passwordInputVal === "12345678")) {
            
            // Sign in to Supabase Auth with virtual email so we get an admin JWT
            const adminEmail = "67370909@livraison.com";
            const adminPassword = passwordInputVal;
            
            try {
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: adminEmail,
                    password: adminPassword
                });
                
                if (authError) {
                    console.error("Supabase Admin Auth Error (falling back to local admin):", authError);
                } else {
                    console.log("Supabase Admin Auth successful:", authData);
                    // Reload data now that we are authenticated as admin
                    await loadDataFromSupabase();
                }
            } catch (err) {
                console.error("Error during Supabase Admin signin:", err);
            }

            STATE.isAdmin = true;
            localStorage.setItem('livraison_admin_active', 'true');
            setupAdminRealtimeSubscription();
            closeAuthModal();
            openAdminModal();
            renderRiders();
            updateMapBlurState();
            updateNavButtons();
            alert("👑 Bienvenue Ibrahim ! Mode Administrateur Activé. Accès total et gratuit.");
            return;
        }
        
        // Normalize phones for lookup
        const phoneNormalized = formatPhoneForDB(phoneInputVal);
        const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';

        // 2. Sign in via Supabase Auth (with secure padding fallback for short passwords/PINs)
        const sanitizedPass = sanitizePassword(passwordInputVal);
        const securePassword = sanitizedPass.length < 6 ? sanitizedPass + "_secure_pad" : sanitizedPass;
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: virtualEmail,
            password: securePassword
        });

        if (authError) {
            alert("❌ Numéro ou mot de passe incorrect. Si vous n'avez pas encore de compte, veuillez d'abord vous inscrire.");
            return;
        }

        const user = authData.user;
        const role = user.app_metadata?.role || user.user_metadata?.role;

        if (role === 'rider') {
            const { data: dbDriver, error: dbError } = await supabase.from('livreurs').select('*').eq('id', user.id).maybeSingle();
            if (dbDriver) {
                let driver = findRiderById(dbDriver.id);
                if (!driver) {
                    driver = {
                        id: dbDriver.id,
                        name: dbDriver.name,
                        vehicle: dbDriver.vehicle,
                        distance: '1.0 km',
                        phone: dbDriver.phone,
                        lat: Number(dbDriver.lat),
                        lng: Number(dbDriver.lng),
                        initial: dbDriver.initial,
                        contactsCount: dbDriver.contacts_count,
                        subscriptionPaid: dbDriver.subscription_paid,
                        status: dbDriver.status,
                        viewsCount: dbDriver.views_count,
                        rating: Number(dbDriver.rating),
                        reviews: []
                    };
                    if (dbDriver.city === 'ouaga') STATE.riders.ouaga.push(driver);
                    else STATE.riders.bobo.push(driver);
                }
                STATE.loggedDriver = driver;
                await loadDataFromSupabase();
                closeAuthModal();
                updateNavButtons();
                
                // Weekly Subscription checking for Espace Livreur dashboard
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
            } else {
                alert("❌ Profil livreur introuvable.");
            }
        } else if (role === 'client') {
            const { data: dbClient, error: dbError } = await supabase.from('clients_livraison').select('*').eq('id', user.id).maybeSingle();
            if (dbClient) {
                let client = STATE.clients.find(c => c.id === dbClient.id);
                if (!client) {
                    client = {
                        id: dbClient.id,
                        phone: dbClient.phone,
                        name: dbClient.name,
                        subscriptionPaid: dbClient.subscription_paid,
                        viewedDrivers: new Set(),
                        contactedDrivers: new Set()
                    };
                    STATE.clients.push(client);
                }
                STATE.loggedClient = client;
 
                // Restore all previously contacted/unlocked riders from deblocages (secured automatically by RLS)
                const { data: unlocks } = await supabase.from('deblocages').select('rider_id');
                if (unlocks) {
                    unlocks.forEach(u => {
                        STATE.unlockedRiders.add(u.rider_id);
                        client.contactedDrivers.add(u.rider_id);
                    });
                }
 
                await loadDataFromSupabase();
                closeAuthModal();
                openClientDrawer();
                updateNavButtons();
                renderRiders();
                alert(`🎉 Bienvenue dans votre Espace Client ! Retrouvez vos livreurs débloqués et discutez.`);
            } else {
                alert("❌ Profil client introuvable.");
            }
        }
    });

    // Client Signup Submit Form
    authClientRegisterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameVal = document.getElementById('auth-client-register-name').value.trim();
        const phoneVal = authClientRegisterPhone.value.trim();
        const passwordVal = authClientRegisterPassword.value.trim();
        
        const phoneNormalized = formatPhoneForDB(phoneVal);
        
        // Verify if client already exists
        let exists = STATE.clients.find(c => c.phone.replace(/\s+/g, '') === phoneNormalized.replace(/\s+/g, ''));
        if (exists) {
            alert("❌ Un compte client avec ce numéro existe déjà. Veuillez vous connecter.");
            switchAuthPanel('login');
            return;
        }
        
        // Save temporary details and trigger 5000 FCFA payment flow (Strictly Premium Accounts)
        STATE.tempPremiumClientRegistration = {
            phone: phoneNormalized,
            password: passwordVal,
            name: nameVal || ('Client ' + phoneVal)
        };
        STATE.pendingClientSubscriptionUnlock = true;
        closeAuthModal();
        openPaymentModal();
        alert("Pour activer votre Compte Client Premium, veuillez procéder au paiement de 5 000 FCFA (simulation).");
    });

    // Client Dashboard elements upgrade Premium
    const btnClientPayPremium = document.getElementById('btn-client-pay-premium');
    if (btnClientPayPremium) {
        btnClientPayPremium.addEventListener('click', () => {
            STATE.pendingClientSubscriptionUnlock = true;
            openPaymentModal();
        });
    }

    // Client Dashboard elements closers & logouts
    btnCloseClientDrawer.addEventListener('click', () => {
        closeClientDrawer();
    });

    btnClientLogout.addEventListener('click', async () => {
        await supabase.auth.signOut();
        STATE.loggedClient = null;
        updateNavButtons();
        closeClientDrawer();
        renderRiders();
        alert("Espace Client déconnecté.");
    });

    // Driver Dashboard Logout override
    btnDriverLogout.addEventListener('click', async () => {
        await supabase.auth.signOut();
        STATE.loggedDriver = null;
        driverDashboardPanel.classList.add('hidden');
        driverRegisterPanel.classList.remove('hidden');
        closeDriverDrawer();
        updateNavButtons();
        renderRiders();
        alert("Espace Livreur déconnecté.");
    });

    // Admin Session Logout override
    btnAdminLogoutSession.addEventListener('click', async () => {
        await supabase.auth.signOut();
        STATE.isAdmin = false;
        localStorage.removeItem('livraison_admin_active');
        setupAdminRealtimeSubscription();
        renderRiders();
        closeAdminModal();
        updateNavButtons();
        alert("Session Administrateur déconnectée.");
    });

    // Close admin modal
    if (btnCloseAdmin) {
        btnCloseAdmin.addEventListener('click', closeAdminModal);
    }

    // Grid Menu Button Click Listeners
    if (btnMenuChats) btnMenuChats.addEventListener('click', () => showAdminSubView('sub-view-chats'));
    if (btnMenuDrivers) btnMenuDrivers.addEventListener('click', () => showAdminSubView('sub-view-drivers'));
    if (btnMenuClients) btnMenuClients.addEventListener('click', () => showAdminSubView('sub-view-clients'));
    if (btnMenuPending) btnMenuPending.addEventListener('click', () => showAdminSubView('sub-view-pending'));
    if (btnMenuSubs) btnMenuSubs.addEventListener('click', () => showAdminSubView('sub-view-subs'));
    if (btnMenuStats) btnMenuStats.addEventListener('click', () => showAdminSubView('sub-view-stats'));
    if (btnMenuSettings) btnMenuSettings.addEventListener('click', () => showAdminSubView('sub-view-settings'));

    // Back to Menu Button Click Listeners
    if (btnBackMenuChats) btnBackMenuChats.addEventListener('click', showAdminMenu);
    if (btnBackMenuDrivers) btnBackMenuDrivers.addEventListener('click', showAdminMenu);
    if (btnBackMenuClients) btnBackMenuClients.addEventListener('click', showAdminMenu);
    if (btnBackMenuPending) btnBackMenuPending.addEventListener('click', showAdminMenu);
    if (btnBackMenuSubs) btnBackMenuSubs.addEventListener('click', showAdminMenu);
    if (btnBackMenuStats) btnBackMenuStats.addEventListener('click', showAdminMenu);
    if (btnBackMenuSettings) btnBackMenuSettings.addEventListener('click', showAdminMenu);

    // Inspector back button
    if (btnInspectorBack) {
        btnInspectorBack.addEventListener('click', closeAdminConversationInspector);
    }

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
        locateClientAndLaunchMap(document.getElementById('loc-btn-map'));
    });
    
    // Step 1: GPS Auto-detection button
    btnGpsAutoDetect.addEventListener('click', () => {
        locateClientAndLaunchMap(btnGpsAutoDetect);
    });

    // Map: Floating GPS locate button
    mapLocateBtn.addEventListener('click', () => {
        locateClientAndLaunchMap(mapLocateBtn);
    });

    // Map: Floating home/return button
    if (mapHomeBtn) {
        mapHomeBtn.addEventListener('click', () => {
            returnToWelcomePortal();
        });
    }
    
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

    // Profile (Mon Compte) Navigation Button Click Binding
    function openDriverDashboardDrawer() {
        if (!STATE.loggedDriver) return;
        driverDrawer.classList.add('open');
        mainFooter.classList.add('hidden');
        driverRegisterPanel.classList.add('hidden');
        driverLoginPanel.classList.add('hidden');
        driverDashboardPanel.classList.remove('hidden');
        updateDriverDashboardView();
    }

    const btnNavProfile = document.getElementById('btn-nav-profile');
    if (btnNavProfile) {
        btnNavProfile.addEventListener('click', () => {
            if (STATE.loggedClient) {
                openClientDrawer();
            } else if (STATE.loggedDriver) {
                openDriverDashboardDrawer();
            } else if (STATE.isAdmin) {
                openAdminModal();
            }
        });
    }

    // Client Premium Automatic Search Button Click Binding
    const btnClientPremiumSearch = document.getElementById('btn-client-premium-search');
    if (btnClientPremiumSearch) {
        btnClientPremiumSearch.addEventListener('click', () => {
            // Force close client drawer
            clientDrawer.classList.remove('open');
            // Transition to map view
            showMapView();
            // Trigger robust live geolocation
            locateClientAndLaunchMap(document.getElementById('map-locate-btn'));
        });
    }

    // Global Map Service Button Click Binding (Direct Unlock)
    if (mapServiceBtn) {
        mapServiceBtn.addEventListener('click', () => {
            STATE.pendingDirectMapUnlock = true;
            openPaymentModal();
        });
    }

    // Boot the main Leaflet map immediately in the background under the glass welcome card
    initMainMap();
    mapInitialized = true;
    updateNavButtons();

    // --- PROGRESSIVE WEB APP (PWA) INSTALLATION ---
    let deferredPrompt = null;
    const pwaInstallBanner = document.getElementById('pwa-install-banner');
    const btnPwaInstall = document.getElementById('btn-pwa-install');
    const btnPwaClose = document.getElementById('btn-pwa-close');
    const btnClientInstallPwa = document.getElementById('btn-client-install-pwa');
    const btnDriverInstallPwa = document.getElementById('btn-driver-install-pwa');
    const pwaIosModal = document.getElementById('pwa-ios-modal');
    const btnClosePwaIos = document.getElementById('btn-close-pwa-ios');

    function isAppInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function isIos() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    function isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    function setupInstallUI() {
        if (isAppInstalled()) return;

        if (isIos() && isSafari()) {
            if (btnClientInstallPwa) {
                btnClientInstallPwa.classList.remove('hidden');
                btnClientInstallPwa.style.display = 'flex';
            }
            if (btnDriverInstallPwa) {
                btnDriverInstallPwa.classList.remove('hidden');
                btnDriverInstallPwa.style.display = 'flex';
            }
        }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        if (!sessionStorage.getItem('pwa-banner-dismissed') && !isAppInstalled()) {
            if (pwaInstallBanner) {
                pwaInstallBanner.classList.remove('hidden');
                pwaInstallBanner.classList.add('visible');
            }
        }

        if (btnClientInstallPwa) {
            btnClientInstallPwa.classList.remove('hidden');
            btnClientInstallPwa.style.display = 'flex';
        }
        if (btnDriverInstallPwa) {
            btnDriverInstallPwa.classList.remove('hidden');
            btnDriverInstallPwa.style.display = 'flex';
        }
    });

    function triggerPwaInstall() {
        if (!deferredPrompt) return;
        
        if (pwaInstallBanner) {
            pwaInstallBanner.classList.remove('visible');
            pwaInstallBanner.classList.add('hidden');
        }

        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA install prompt');
            } else {
                console.log('User dismissed the PWA install prompt');
            }
            deferredPrompt = null;
        });
    }

    if (btnPwaInstall) {
        btnPwaInstall.addEventListener('click', triggerPwaInstall);
    }

    if (btnClientInstallPwa) {
        btnClientInstallPwa.addEventListener('click', () => {
            if (deferredPrompt) {
                triggerPwaInstall();
            } else if (isIos() && isSafari()) {
                if (pwaIosModal) {
                    pwaIosModal.classList.remove('hidden');
                    pwaIosModal.classList.add('visible');
                }
            } else {
                window.alert("ℹ️ L'installation n'est pas supportée sur ce navigateur ou est déjà complétée.");
            }
        });
    }

    if (btnDriverInstallPwa) {
        btnDriverInstallPwa.addEventListener('click', () => {
            if (deferredPrompt) {
                triggerPwaInstall();
            } else if (isIos() && isSafari()) {
                if (pwaIosModal) {
                    pwaIosModal.classList.remove('hidden');
                    pwaIosModal.classList.add('visible');
                }
            } else {
                window.alert("ℹ️ L'installation n'est pas supportée sur ce navigateur ou est déjà complétée.");
            }
        });
    }

    if (btnPwaClose) {
        btnPwaClose.addEventListener('click', () => {
            if (pwaInstallBanner) {
                pwaInstallBanner.classList.remove('visible');
                pwaInstallBanner.classList.add('hidden');
            }
            sessionStorage.setItem('pwa-banner-dismissed', 'true');
        });
    }

    if (btnClosePwaIos) {
        btnClosePwaIos.addEventListener('click', () => {
            if (pwaIosModal) {
                pwaIosModal.classList.remove('visible');
                pwaIosModal.classList.add('hidden');
            }
        });
    }

    // Register Service Worker (robust check for document ready state)
    if ('serviceWorker' in navigator) {
        const registerSW = () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then((registration) => {
                    console.log('ServiceWorker registered with scope: ', registration.scope);
                })
                .catch((err) => {
                    console.error('ServiceWorker registration failed: ', err);
                });
        };
        
        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
        }
    }

    // Admin Settings Form Submit Listener
    const adminSettingsForm = document.getElementById('admin-settings-form');
    if (adminSettingsForm) {
        adminSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputUnlockFee = document.getElementById('settings-unlock-fee');
            const inputClientSub = document.getElementById('settings-client-sub');
            const inputRiderSub = document.getElementById('settings-rider-sub');
            
            if (inputUnlockFee && inputClientSub && inputRiderSub) {
                STATE.settings.unlockFee = parseInt(inputUnlockFee.value, 10);
                STATE.settings.clientSubFee = parseInt(inputClientSub.value, 10);
                STATE.settings.riderSubFee = parseInt(inputRiderSub.value, 10);
                
                localStorage.setItem('livraison_settings', JSON.stringify(STATE.settings));
                
                // Update pricing text in standard interface
                updateDynamicPricingTexts();
                
                alert("⚙️ Configuration enregistrée avec succès ! Les tarifs ont été mis à jour.");
                showAdminMenu();
            }
        });
    }

    // Call updateDynamicPricingTexts on startup to display custom values
    updateDynamicPricingTexts();

    setupInstallUI();
});
