'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function MapComponent({ livreurs = [], cityCenter = { lat: 12.3714, lng: -1.5197 }, onMarkerClick }: any) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !mapRef.current && containerRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
      }).setView([cityCenter.lat, cityCenter.lng], 14);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(mapRef.current);
      
      markersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if(mapRef.current && cityCenter) {
       mapRef.current.setView([cityCenter.lat, cityCenter.lng], 14);
    }
  }, [cityCenter]);

  useEffect(() => {
      if(mapRef.current && markersRef.current) {
          markersRef.current.clearLayers();
          
          livreurs.forEach((livreur: any) => {
              if(!livreur.lat || !livreur.lng) return;
              
              let finalLat = livreur.lat;
              let finalLng = livreur.lng;
              
              // Si le livreur est exactement au centre-ville par défaut (il n'a pas bougé le curseur GPS)
              // On applique un léger décalage pour éviter que tous les marqueurs se superposent
              const isDefaultOuaga = Math.abs(livreur.lat - 12.3714) < 0.0001 && Math.abs(livreur.lng - (-1.5197)) < 0.0001;
              const isDefaultBobo = Math.abs(livreur.lat - 11.1771) < 0.0001 && Math.abs(livreur.lng - (-4.2968)) < 0.0001;
              
              if (isDefaultOuaga || isDefaultBobo) {
                  const hashStr = livreur.name || livreur.first_name || livreur.id || 'A';
                  const hash = hashStr.toString().charCodeAt(0) * hashStr.toString().length;
                  const angle = hash * 0.3; // Angle pseudo-aléatoire
                  const radius = 0.001 + ((hash % 15) * 0.0005); // Rayon pseudo-aléatoire (entre 100m et 800m)
                  finalLat += Math.sin(angle) * radius;
                  finalLng += Math.cos(angle) * radius;
              }

              const icon = L.divIcon({
                  className: 'custom-driver-dot',
                  html: `<div class="driver-dot-pulse"></div><div class="driver-dot-core"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
              });
              
              const marker = L.marker([finalLat, finalLng], { icon });
              
              if(onMarkerClick) {
                  marker.on('click', () => onMarkerClick(livreur));
              }
              
              marker.addTo(markersRef.current!);
          });
      }
  }, [livreurs, onMarkerClick]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
