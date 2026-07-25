import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@livraisonrapide.app';

const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.url',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
  );
};

async function getAuthUser(request: Request) {
  const adminSupabase = getSupabaseAdmin();
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data } = await adminSupabase.auth.getUser(token);
    if (data?.user) return data.user;
  }
  try {
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(cookieStore);
    const { data } = await supabaseServer.auth.getUser();
    if (data?.user) return data.user;
  } catch {
    // Ignore cookie errors
  }
  return null;
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'Les notifications push (VAPID) ne sont pas configurées sur le serveur.' }, { status: 400 });
  }

  try {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const { recipientId, title, message, url } = await request.json();

    if (!recipientId || !title || !message) {
      return NextResponse.json({ error: 'Champs requis manquants (recipientId, title, message).' }, { status: 400 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: subscriptions, error } = await adminSupabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', recipientId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Erreur lors de la récupération des abonnements push.' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Aucun appareil enregistré pour cet utilisateur.' }, { status: 200 });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || '/'
    });

    let sentCount = 0;
    const errors = [];

    for (const subRecord of subscriptions) {
      try {
        await webPush.sendNotification(subRecord.subscription, payload);
        sentCount++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('Abonnement expiré.');
        } else {
          console.error('Error sending push notification:', err);
          errors.push(err);
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount, errors }, { status: 200 });

  } catch (error: any) {
    console.error('Unhandled error in push API:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
