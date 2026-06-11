// Teste le chemin "déjà inscrit" : signUp -> already registered -> signIn -> upload
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const anonKey = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

const admin = createClient(url, serviceKey);

const phone = '+226 79 99 88 02';
const virtualEmail = phone.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
const securePassword = '1234_secure_pad';
const meta = {
  role: 'rider', name: 'Test Retry Debug', phone,
  vehicle: 'Moto', lat: 12.3714, lng: -1.5197,
  initial: 'T', city: 'ouaga', status: 'en attente', subscription_paid: false
};

async function main() {
  // Tentative 1 : créer le compte (simule un essai précédent qui a réussi le signUp puis a échoué)
  const c1 = createClient(url, anonKey);
  const r1 = await c1.auth.signUp({ email: virtualEmail, password: securePassword, options: { data: meta } });
  console.log('Tentative 1 signUp:', r1.error ? r1.error.message : 'OK', '| user:', r1.data?.user?.id);
  const userId = r1.data?.user?.id;
  await c1.auth.signOut();

  // Tentative 2 : nouveau client (nouvelle visite), même flux que registerDriver
  const c2 = createClient(url, anonKey);
  const r2 = await c2.auth.signUp({ email: virtualEmail, password: securePassword, options: { data: meta } });
  console.log('Tentative 2 signUp:', r2.error ? `ERROR: ${r2.error.status} ${r2.error.code} "${r2.error.message}"` : 'OK');
  console.log('Tentative 2 user:', r2.data?.user?.id, '| identities:', JSON.stringify(r2.data?.user?.identities), '| session:', r2.data?.session ? 'présente' : 'ABSENTE');

  let authData = r2.data;
  const alreadyRegistered =
    (r2.error && r2.error.message.toLowerCase().includes('already registered')) ||
    (!r2.error && r2.data.user && !r2.data.session);
  console.log('alreadyRegistered détecté:', alreadyRegistered);
  if (alreadyRegistered) {
    const login = await c2.auth.signInWithPassword({ email: virtualEmail, password: securePassword });
    console.log('signIn fallback:', login.error ? `ERROR: ${login.error.message}` : 'OK');
    authData = login.data;
  }

  const uid = authData?.user?.id;
  console.log('uid utilisé pour upload:', uid);

  // Upload comme l'app
  const fakeImg = new Blob([Buffer.from('fake image data')], { type: 'image/jpeg' });
  const path = `${uid}/cni_recto_${Date.now()}`;
  const up = await c2.storage.from('identities').upload(path, fakeImg, { contentType: 'image/jpeg' });
  console.log('Upload:', up.error ? `ERROR: "${up.error.message}"` : 'OK -> ' + up.data?.path);

  // Nettoyage
  if (up.data?.path) await admin.storage.from('identities').remove([up.data.path]);
  if (userId) {
    const del = await admin.auth.admin.deleteUser(userId);
    console.log('Nettoyage:', del.error ? del.error.message : 'OK');
  }
}

main().catch(e => { console.error('ECHEC:', e); process.exit(1); });
