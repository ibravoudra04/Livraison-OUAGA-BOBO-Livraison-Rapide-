import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/utils/supabase/server';

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  ouaga: { lat: 12.3714, lng: -1.5197 },
  bobo: { lat: 11.1771, lng: -4.2968 },
};

const normalizePhone = (raw: string) => {
  let p = String(raw).replace(/\s+/g, '').replace('+', '');
  if (p.startsWith('226')) p = p.substring(3);
  return '+226 ' + (p.match(/.{1,2}/g)?.join(' ') || p);
};

// Crée un compte livreur depuis la dashboard admin (pour les livreurs qui
// n'ont pas de smartphone ou n'arrivent pas à s'inscrire seuls).
// FormData : name, phone, pin, vehicle, city, activate, selfie?, cniRecto?, cniVerso?
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

  const form = await request.formData();
  const name = String(form.get('name') || '').trim();
  const phoneRaw = String(form.get('phone') || '');
  const pin = String(form.get('pin') || '');
  const vehicle = String(form.get('vehicle') || 'Moto');
  const city = String(form.get('city') || 'ouaga') === 'bobo' ? 'bobo' : 'ouaga';
  const activate = String(form.get('activate') || '1') === '1';

  const digits = phoneRaw.replace(/\D/g, '').replace(/^226/, '');
  if (!name || digits.length !== 8 || pin.length < 4) {
    return NextResponse.json({ error: 'Nom, numéro (8 chiffres) et PIN (4 chiffres min.) sont obligatoires.' }, { status: 400 });
  }

  const phoneNormalized = normalizePhone(digits);
  const email = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
  const password = pin.length < 6 ? pin + '_secure_pad' : pin;
  const center = CITY_CENTERS[city];

  const admin = getSupabaseAdmin();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'rider',
      name,
      phone: phoneNormalized,
      vehicle,
      lat: center.lat,
      lng: center.lng,
      initial: name.charAt(0).toUpperCase(),
      city,
      status: 'en attente',
      subscription_paid: false,
    },
  });
  if (createErr) {
    const already = createErr.message.toLowerCase().includes('already');
    return NextResponse.json(
      { error: already ? 'Ce numéro est déjà inscrit.' : 'Création du compte échouée : ' + createErr.message },
      { status: already ? 409 : 500 }
    );
  }
  const uid = created.user.id;

  // Le trigger crée normalement la ligne livreurs ; on la garantit ici.
  const { data: row } = await admin.from('livreurs').select('id').eq('id', uid).maybeSingle();
  if (!row) {
    await admin.from('livreurs').insert({
      id: uid, name, phone: phoneNormalized, vehicle,
      lat: center.lat, lng: center.lng,
      initial: name.charAt(0).toUpperCase(), city,
      status: 'en attente', subscription_paid: false,
    });
  }

  // Photos éventuelles (selfie / CNI) uploadées avec la clé serveur.
  const updatePayload: Record<string, string> = {};
  const uploads: [string, string][] = [['selfie', 'selfie'], ['cniRecto', 'cni_recto'], ['cniVerso', 'cni_verso']];
  for (const [field, column] of uploads) {
    const file = form.get(field);
    if (file && file instanceof File && file.size > 0) {
      const path = `${uid}/${column}_${Date.now()}`;
      const { error: upErr } = await admin.storage.from('identities').upload(path, file, { contentType: file.type || 'image/jpeg' });
      if (!upErr) {
        const { data: pub } = admin.storage.from('identities').getPublicUrl(path);
        updatePayload[column] = pub.publicUrl;
      }
    }
  }
  if (activate) updatePayload.status = 'actif';
  if (Object.keys(updatePayload).length > 0) {
    await admin.from('livreurs').update(updatePayload).eq('id', uid);
  }

  const { data: driver } = await admin.from('livreurs').select('*').eq('id', uid).maybeSingle();
  return NextResponse.json({ success: true, driver });
}
