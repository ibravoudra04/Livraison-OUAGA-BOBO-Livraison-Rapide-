import React from 'react';
import dynamic from 'next/dynamic';

// Disable SSR for the map component
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0' }}>
      <div className="pulse-dot" style={{ width: '20px', height: '20px' }}></div>
    </div>
  )
});

export default function MapWrapper(props: any) {
  return <MapComponent {...props} />;
}
