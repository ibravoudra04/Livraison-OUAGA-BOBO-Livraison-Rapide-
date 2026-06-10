'use client';
import { useEffect } from 'react';

// Clears all SW caches and does a hard reload to recover from stale assets
function clearCachesAndReload() {
  if (typeof caches !== 'undefined') {
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .finally(() => window.location.reload());
  } else {
    window.location.reload();
  }
}

export default function SwUpdateHandler() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Force the browser to check for a new SW version on every page load
    navigator.serviceWorker.ready
      .then(reg => reg.update())
      .catch(() => {});

    // When a new SW takes control (after update), reload to get fresh chunks
    let reloading = false;
    const onControllerChange = () => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Catch chunk load failures caused by stale SW cache
    const onError = (event: ErrorEvent) => {
      const msg = event?.message ?? '';
      if (
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Failed to fetch') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('dynamically imported module')
      ) {
        clearCachesAndReload();
      }
    };

    // Catch async chunk load failures (dynamic imports)
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event?.reason?.message ?? event?.reason ?? '');
      if (
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Failed to fetch') ||
        msg.includes('dynamically imported module')
      ) {
        clearCachesAndReload();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
