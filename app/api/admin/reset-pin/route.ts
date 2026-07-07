import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

// Réinitialise le code PIN d'un utilisateur (livreur ou client) depuis la
// dashboard admin. Les comptes utilisent des e-mails virtuels : aucune
// récupération par e-mail n'est possible, seul l'admin peut aider.
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

  const { userId } = await request.json();
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId);
  if (getErr || !target?.user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }
  if (target.user.app_metadata?.role === 'admin') {
    return NextResponse.json({ error: 'Impossible de réinitialiser un compte administrateur.' }, { status: 403 });
  }

  // Nouveau PIN à 4 chiffres. Le mot de passe réel suit le schéma de l'app :
  // les PIN < 6 caractères sont complétés par "_secure_pad" à la connexion.
  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const password = pin + '_secure_pad';

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
  if (updErr) {
    return NextResponse.json({ error: 'La réinitialisation a échoué : ' + updErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, pin });
}
