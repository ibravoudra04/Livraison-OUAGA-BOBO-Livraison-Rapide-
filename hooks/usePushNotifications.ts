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

        // Save subscription to Supabase
        const { error } = await supabase
          .from('push_subscriptions')
          .insert([
            {
              user_id: session.user.id,
              subscription: JSON.parse(JSON.stringify(subscription))
            }
          ]);

        // Note: It might error if we violate a unique constraint if we added one, 
        // but currently we just allow multiple subscriptions per user (multiple devices).
        if (error) {
          console.error('Error saving push subscription to DB:', error);
        } else {
          console.log('Push subscription saved successfully.');
        }

      } catch (err) {
        console.error('Error registering push subscription:', err);
      }
    }

    registerPush();
  }, []);
}
