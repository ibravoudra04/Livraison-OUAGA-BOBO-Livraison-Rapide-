'use client';

import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', width: '100%', backgroundColor: '#e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      Chargement de la carte et des livreurs...
    </div>
  )
});

export default function MapWrapper(props: any) {
  return <MapWithNoSSR {...props} />;
}
