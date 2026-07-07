import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

// Même normalisation que formatPhoneForDB côté app : "+226 XX XX XX XX"
const normalizePhone = (raw: string) => {
  let p = String(raw).replace(/\s+/g, '').replace('+', '');
  if (p.startsWith('226')) p = p.substring(3);
  return '+226 ' + (p.match(/.{1,2}/g)?.join(' ') || p);
};

// Modifie la fiche d'un livreur (nom, téléphone, véhicule, ville) depuis la
// dashboard. Si le téléphone change, l'e-mail virtuel de connexion est mis à
// jour aussi pour que le livreur puisse se connecter avec son nouveau numéro.
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

  const { id, name, phone, vehicle, city } = await request.json();
  if (!id || !name || !phone) {
    return NextResponse.json({ error: 'Champs manquants (id, nom, téléphone).' }, { status: 400 });
  }
  const digits = String(phone).replace(/\D/g, '').replace(/^226/, '');
  if (digits.length !== 8) {
    return NextResponse.json({ error: 'Le numéro doit contenir 8 chiffres.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: current, error: curErr } = await admin.from('livreurs').select('id, phone').eq('id', id).maybeSingle();
  if (curErr || !current) {
    return NextResponse.json({ error: 'Livreur introuvable.' }, { status: 404 });
  }

  const phoneNormalized = normalizePhone(digits);
  const payload = {
    name: String(name).trim(),
    phone: phoneNormalized,
    vehicle: vehicle || 'Moto',
    city: city === 'bobo' ? 'bobo' : 'ouaga',
    initial: String(name).trim().charAt(0).toUpperCase(),
  };

  // Si le numéro change, vérifier qu'il n'est pas déjà pris puis mettre à jour
  // l'e-mail virtuel de connexion.
  const phoneChanged = normalizePhone(current.phone || '') !== phoneNormalized;
  if (phoneChanged) {
    const newEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const taken = list.users.find(u => u.email === newEmail && u.id !== id);
    if (taken) {
      return NextResponse.json({ error: 'Ce numéro est déjà utilisé par un autre compte.' }, { status: 409 });
    }
    const { error: mailErr } = await admin.auth.admin.updateUserById(id, {
      email: newEmail,
      email_confirm: true,
      user_metadata: { phone: phoneNormalized, name: payload.name, vehicle: payload.vehicle },
    });
    if (mailErr) {
      return NextResponse.json({ error: 'Mise à jour du compte de connexion échouée : ' + mailErr.message }, { status: 500 });
    }
  } else {
    await admin.auth.admin.updateUserById(id, {
      user_metadata: { name: payload.name, vehicle: payload.vehicle },
    }).catch(() => {});
  }

  const { error: updErr } = await admin.from('livreurs').update(payload).eq('id', id);
  if (updErr) {
    return NextResponse.json({ error: 'Mise à jour de la fiche échouée : ' + updErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, driver: { id, ...payload } });
}
