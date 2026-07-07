import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

// Nettoyage ciblé depuis l'onglet "Santé de la base" :
// - ghost : supprime un compte de connexion SANS profil (re-vérifié ici)
// - orphan_payment : supprime un paiement dont le client n'existe plus
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(cookieStore);
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type, id } = await request.json();
  if (!type || !id) {
    return NextResponse.json({ error: 'type et id sont requis' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  if (type === 'ghost') {
    const { data: target, error: getErr } = await admin.auth.admin.getUserById(id);
    if (getErr || !target?.user) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }
    if (target.user.app_metadata?.role === 'admin') {
      return NextResponse.json({ error: 'Impossible de supprimer un compte administrateur.' }, { status: 403 });
    }
    // Sécurité : on re-vérifie que ce compte n'a AUCUN profil (vraiment fantôme).
    const [{ data: dr }, { data: cl }] = await Promise.all([
      admin.from('livreurs').select('id').eq('id', id).maybeSingle(),
      admin.from('clients_livraison').select('id').eq('id', id).maybeSingle(),
    ]);
    if (dr || cl) {
      return NextResponse.json({ error: 'Ce compte a un profil : ce n\'est pas un compte fantôme.' }, { status: 409 });
    }
    await admin.from('push_subscriptions').delete().eq('user_id', id);
    const { error: delErr } = await admin.auth.admin.deleteUser(id);
    if (delErr) {
      return NextResponse.json({ error: 'Suppression échouée : ' + delErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (type === 'orphan_payment') {
    const { data: pay } = await admin.from('paiements').select('id, client_id').eq('id', id).maybeSingle();
    if (!pay) {
      return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 });
    }
    if (pay.client_id) {
      const { data: cl } = await admin.from('clients_livraison').select('id').eq('id', pay.client_id).maybeSingle();
      if (cl) {
        return NextResponse.json({ error: 'Ce paiement appartient à un client existant.' }, { status: 409 });
      }
    }
    const { error: delErr } = await admin.from('paiements').delete().eq('id', id);
    if (delErr) {
      return NextResponse.json({ error: 'Suppression échouée : ' + delErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Type inconnu' }, { status: 400 });
}
