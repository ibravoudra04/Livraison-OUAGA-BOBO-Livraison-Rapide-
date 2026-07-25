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

  const isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.phone?.includes('67370909');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'Les notifications push ne sont pas encore configurées dans les variables d\'environnement.' }, { status: 400 });
  }

  const { title, message, url } = await request.json();
  if (!title || !message) {
    return NextResponse.json({ error: 'Titre ou message manquant' }, { status: 400 });
  }

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const adminSupabase = getSupabaseAdmin();
  const { data: subscriptions, error } = await adminSupabase
    .from('push_subscriptions')
    .select('subscription');

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des abonnements push' }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'Aucun appareil inscrit aux notifications push.' });
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
