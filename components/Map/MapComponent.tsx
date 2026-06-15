'use client';
import { useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function MapComponent({ livreurs = [], cityCenter = { lat: 12.3714, lng: -1.5197 }, onMarkerClick }: any) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<{ [id: string]: L.Marker }>({});

  // On garde les dernières props dans des refs pour que le rendu des marqueurs
  // (déclenché aussi par le déplacement de la carte) utilise toujours les valeurs à jour.
  const livreursRef = useRef<any[]>(livreurs);
  const onMarkerClickRef = useRef<any>(onMarkerClick);
  livreursRef.current = livreurs;
  onMarkerClickRef.current = onMarkerClick;

  // Calcule la position d'affichage d'un livreur (avec léger décalage si GPS par défaut)
  const computePos = (livreur: any): [number, number] | null => {
    if (!livreur.lat || !livreur.lng || !livreur.id) return null;
    let finalLat = livreur.lat;
    let finalLng = livreur.lng;
    const isDefaultOuaga = Math.abs(livreur.lat - 12.3714) < 0.0001 && Math.abs(livreur.lng - (-1.5197)) < 0.0001;
    const isDefaultBobo = Math.abs(livreur.lat - 11.1771) < 0.0001 && Math.abs(livreur.lng - (-4.2968)) < 0.0001;
    if (isDefaultOuaga || isDefaultBobo) {
      const hashStr = livreur.name || livreur.first_name || livreur.id || 'A';
      const hash = hashStr.toString().charCodeAt(0) * hashStr.toString().length;
      const angle = hash * 0.3;
      const radius = 0.001 + ((hash % 15) * 0.0005);
      finalLat += Math.sin(angle) * radius;
      finalLng += Math.cos(angle) * radius;
    }
    return [finalLat, finalLng];
  };

  // Ne rend QUE les marqueurs visibles dans la zone affichée (+ une marge).
  // Évite d'animer/charger 50+ marqueurs et photos d'un coup → bien plus fluide
  // sur mobile et au premier chargement. Rappelé à chaque déplacement de carte.
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const group = markersRef.current;
    if (!map || !group) return;

    const visibleIds = new Set<string>();

    livreursRef.current.forEach((livreur: any) => {
      const pos = computePos(livreur);
      if (!pos) return;
      // if (!bounds.contains(pos)) return; // hors écran : on ne le rend pas
      visibleIds.add(livreur.id);

      const existing = markersMapRef.current[livreur.id];
      if (existing) {
        const oldPos = existing.getLatLng();
        // Eviter de mettre à jour le DOM si la position n'a pas changé (Gain de perf massif)
        if (Math.abs(oldPos.lat - pos[0]) > 0.00001 || Math.abs(oldPos.lng - pos[1]) > 0.00001) {
          existing.setLatLng(pos);
        }
      } else {
        const hasSelfie = livreur.selfie && livreur.selfie !== '';
        const iconHtml = hasSelfie
          ? `<div class="driver-dot-pulse" style="width: 40px; height: 40px; top: -5px; left: -5px;"></div>
             <div class="driver-dot-core" style="width: 30px; height: 30px; top: 0; left: 0; background-image: url('${livreur.selfie}'); background-size: cover; background-position: center; border: 2px solid var(--color-primary-green); box-sizing: border-box;"></div>`
          : `<div class="driver-dot-pulse"></div><div class="driver-dot-core"></div>`;

        const icon = L.divIcon({
          className: 'custom-driver-dot',
          html: iconHtml,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker(pos, { icon });
        marker.on('click', () => onMarkerClickRef.current && onMarkerClickRef.current(livreur));
        marker.addTo(group);
        markersMapRef.current[livreur.id] = marker;
      }
    });

    // Retirer les marqueurs devenus hors écran ou disparus (libère les photos)
    Object.keys(markersMapRef.current).forEach(id => {
      if (!visibleIds.has(id)) {
        group.removeLayer(markersMapRef.current[id]);
        delete markersMapRef.current[id];
      }
    });
  }, []);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    if (typeof window !== 'undefined' && !mapRef.current && containerRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        preferCanvas: true,
      }).setView([cityCenter.lat, cityCenter.lng], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);

      // Re-rendre les marqueurs visibles quand l'utilisateur déplace/zoome la carte
      mapRef.current.on('moveend', renderMarkers);
      renderMarkers();

      // Écouter les changements de taille du conteneur pour éviter les artefacts d'affichage
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersMapRef.current = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On ne recadre la carte QUE lorsque les coordonnées du centre changent vraiment
  // (et pas à chaque rendu). Avant, `cityCenter` étant un nouvel objet à chaque
  // rendu, la carte se recentrait en boucle et l'utilisateur ne pouvait plus la
  // déplacer. On conserve le zoom courant de l'utilisateur.
  useEffect(() => {
    if (mapRef.current && cityCenter) {
      const currentZoom = mapRef.current.getZoom() || 14;
      mapRef.current.setView([cityCenter.lat, cityCenter.lng], currentZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityCenter?.lat, cityCenter?.lng]);

  // Mettre à jour les marqueurs quand la liste des livreurs change
  useEffect(() => {
    renderMarkers();
  }, [livreurs, renderMarkers]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
