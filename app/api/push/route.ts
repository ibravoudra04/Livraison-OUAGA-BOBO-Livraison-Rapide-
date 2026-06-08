import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@livraisonrapide.app';

// Initialize inside the handler to prevent Next.js build-time errors if env vars are missing
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.url',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
  );
};

export async function POST(request: Request) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('VAPID keys are not configured.');
    return NextResponse.json({ error: 'Push notifications are not configured on the server.' }, { status: 500 });
  }

  try {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const { recipientId, title, message, url } = await request.json();

    if (!recipientId || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminSupabase = getSupabaseAdmin();
    // Fetch the subscriptions for the recipient
    const { data: subscriptions, error } = await adminSupabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', recipientId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      // User has no push subscriptions registered
      return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions found for user.' }, { status: 200 });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || '/'
    });

    let sentCount = 0;
    const errors = [];

    // Send push to all active subscriptions of the user
    for (const subRecord of subscriptions) {
      try {
        await webPush.sendNotification(subRecord.subscription, payload);
        sentCount++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid, we could delete it from DB here
          console.log('Subscription expired/invalid, should be deleted.');
        } else {
          console.error('Error sending push notification:', err);
          errors.push(err);
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount, errors }, { status: 200 });

  } catch (error: any) {
    console.error('Unhandled error in push API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
