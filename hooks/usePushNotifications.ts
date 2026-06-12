import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  useEffect(() => {
    async function registerPush() {
      // Check if Push is supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return; // Only register if user is logged in

      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Ask for permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Push notification permission not granted.');
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('VAPID public key not found in env vars.');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        const subJson = JSON.parse(JSON.stringify(subscription));
        const endpoint: string | undefined = subJson?.endpoint;

        // Éviter d'insérer un doublon à CHAQUE visite (c'est ce qui avait fait
        // gonfler la table à des centaines de lignes). On enregistre cet appareil
        // une seule fois : si l'endpoint existe déjà pour cet utilisateur, on sort.
        if (endpoint) {
          const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id, subscription')
            .eq('user_id', session.user.id);

          const alreadySaved = (existing || []).some((row: any) => {
            const ep = typeof row.subscription === 'string'
              ? JSON.parse(row.subscription)?.endpoint
              : row.subscription?.endpoint;
            return ep === endpoint;
          });

          if (alreadySaved) {
            return; // cet appareil est déjà enregistré
          }
        }

        const { error } = await supabase
          .from('push_subscriptions')
          .insert([
            {
              user_id: session.user.id,
              subscription: subJson
            }
          ]);

        if (error) {
          console.error('Error saving push subscription to DB:', error);
        }

      } catch (err) {
        console.error('Error registering push subscription:', err);
      }
    }

    registerPush();
  }, []);
}
