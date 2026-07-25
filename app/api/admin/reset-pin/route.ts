import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

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

  const pin = String(Math.floor(1000 + Math.random() * 9000));
  const password = pin + '_secure_pad';

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
  if (updErr) {
    return NextResponse.json({ error: 'La réinitialisation a échoué : ' + updErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, pin });
}
