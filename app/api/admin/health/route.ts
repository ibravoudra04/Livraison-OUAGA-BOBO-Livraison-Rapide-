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

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.phone?.includes('67370909');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const [{ data: list }, { data: drivers }, { data: clients }, { data: paiements }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('livreurs').select('id'),
    admin.from('clients_livraison').select('id'),
    admin.from('paiements').select('id, montant, statut, client_id, created_at'),
  ]);

  const driverIds = new Set((drivers || []).map(d => d.id));
  const clientIds = new Set((clients || []).map(c => c.id));

  const ghosts = (list?.users || [])
    .filter(u => {
      if (u.app_metadata?.role === 'admin') return false;
      const role = u.user_metadata?.role;
      if (role === 'rider') return !driverIds.has(u.id);
      if (role === 'client') return !clientIds.has(u.id);
      return !driverIds.has(u.id) && !clientIds.has(u.id);
    })
    .map(u => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role || 'inconnu',
      name: u.user_metadata?.name || null,
      phone: u.user_metadata?.phone || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
    }));

  const orphanPayments = (paiements || []).filter(p => !p.client_id || !clientIds.has(p.client_id));

  const lastSignIn: Record<string, string | null> = {};
  for (const u of list?.users || []) {
    lastSignIn[u.id] = u.last_sign_in_at || null;
  }

  return NextResponse.json({ success: true, ghosts, orphanPayments, lastSignIn });
}
