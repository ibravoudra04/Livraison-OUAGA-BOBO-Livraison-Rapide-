import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@livraisonrapide.app';

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(cookieStore);
  const { data: { session } } = await supabaseServer.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = session.user.app_metadata?.role === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'Push notifications not configured.' }, { status: 500 });
  }

  const { title, message, url } = await request.json();
  if (!title || !message) {
    return NextResponse.json({ error: 'Missing title or message' }, { status: 400 });
  }

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const adminSupabase = getSupabaseAdmin();
  const { data: subscriptions, error } = await adminSupabase
    .from('push_subscriptions')
    .select('subscription');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions registered.' });
  }

  const payload = JSON.stringify({ title, body: message, url: url || '/' });
  let sent = 0;

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(sub.subscription, payload);
      sent++;
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await adminSupabase.from('push_subscriptions').delete().eq('subscription', sub.subscription);
      }
    }
  }

  return NextResponse.json({ success: true, sent });
}
