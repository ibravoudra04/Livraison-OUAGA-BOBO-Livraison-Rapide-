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
              
              const icon = L.divIcon({
                  className: 'custom-driver-dot',
                  html: `<div class="driver-dot-pulse"></div><div class="driver-dot-core"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
              });
              
              const marker = L.marker([livreur.lat, livreur.lng], { icon });
              
              if(onMarkerClick) {
                  marker.on('click', () => onMarkerClick(livreur));
              }
              
              marker.addTo(markersRef.current!);
          });
      }
  }, [livreurs, onMarkerClick]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
