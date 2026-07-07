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

// Alerte les administrateurs (push sur leurs appareils) lors d'événements
// importants : nouvelle candidature livreur, nouveau signalement.
// Appelable par tout utilisateur CONNECTÉ (le livreur qui s'inscrit, le
// client qui signale) — le contenu est contraint côté serveur.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(cookieStore);
  const { data: { session } } = await supabaseServer.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'Push non configuré.' }, { status: 500 });
  }

  const { event, detail } = await request.json();
  const EVENTS: Record<string, string> = {
    new_driver: '🛵 Nouvelle candidature livreur',
    new_report: '⚠️ Nouveau signalement',
  };
  const title = EVENTS[event];
  if (!title) {
    return NextResponse.json({ error: 'Événement inconnu' }, { status: 400 });
  }
  const message = String(detail || '').slice(0, 120) || 'Ouvrez la dashboard pour voir les détails.';

  const admin = getSupabaseAdmin();
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const adminIds = (list?.users || []).filter(u => u.app_metadata?.role === 'admin').map(u => u.id);
  if (adminIds.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('subscription')
    .in('user_id', adminIds);

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const payload = JSON.stringify({ title, body: message, url: '/' });
  let sent = 0;
  for (const s of subs || []) {
    try {
      await webPush.sendNotification(s.subscription, payload);
      sent++;
    } catch {
      // abonnement expiré — ignoré
    }
  }

  return NextResponse.json({ success: true, sent });
}
