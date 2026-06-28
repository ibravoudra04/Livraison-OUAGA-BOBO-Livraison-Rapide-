import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

// Supprime définitivement le compte de l'utilisateur connecté et toutes ses
// données associées (exigence Apple App Store 5.1.1 : suppression de compte
// initiable depuis l'application).
export async function POST() {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(cookieStore);

  // getUser() valide le jeton côté serveur (plus sûr que getSession pour une
  // opération destructive).
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = user.id;
  const admin = getSupabaseAdmin();

  // Suppression best-effort, tables enfants d'abord. On ignore les tables
  // éventuellement absentes pour ne pas bloquer la suppression du compte.
  const ignorableCodes = new Set(['42P01']); // relation inexistante
  const run = async (label: string, fn: () => PromiseLike<{ error: any }>) => {
    try {
      const { error } = await fn();
      if (error && !ignorableCodes.has(error.code)) {
        console.error(`[account/delete] ${label}:`, error.message);
      }
    } catch (e: any) {
      console.error(`[account/delete] ${label} (exception):`, e?.message);
    }
  };

  const orPair = `client_id.eq.${uid},rider_id.eq.${uid}`;

  await run('chats_livraison', () => admin.from('chats_livraison').delete().or(orPair));
  await run('avis', () => admin.from('avis').delete().or(orPair));
  await run('deblocages', () => admin.from('deblocages').delete().or(orPair));
  await run('paiements', () => admin.from('paiements').delete().eq('client_id', uid));
  await run('tickets_support', () => admin.from('tickets_support').delete().eq('client_id', uid));
  await run('push_subscriptions', () => admin.from('push_subscriptions').delete().eq('user_id', uid));
  await run('livreurs', () => admin.from('livreurs').delete().eq('id', uid));
  await run('clients_livraison', () => admin.from('clients_livraison').delete().eq('id', uid));

  // NB : les fichiers Storage (CNI, selfie, reçus) référencés par les lignes
  // ci-dessus devraient être purgés via une routine d'administration dédiée.

  // Suppression du compte d'authentification lui-même.
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(uid);
  if (deleteUserError) {
    console.error('[account/delete] deleteUser:', deleteUserError.message);
    return NextResponse.json(
      { error: "La suppression du compte a échoué. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
