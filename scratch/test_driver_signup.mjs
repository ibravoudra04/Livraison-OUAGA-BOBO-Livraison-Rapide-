// Reproduit exactement le flux d'inscription livreur de useDriverOnboarding.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const anonKey = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

const supabase = createClient(url, anonKey);
const admin = createClient(url, serviceKey);

const phone = '+226 79 99 88 01';
const virtualEmail = phone.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
const pin = '1234';
const securePassword = pin.length < 6 ? pin + '_secure_pad' : pin;

function step(name, promise, ms = 20000) {
  const t0 = Date.now();
  return Promise.race([
    promise.then(r => { console.log(`[${name}] OK en ${Date.now() - t0}ms`); return r; }),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`[${name}] TIMEOUT après ${ms}ms`)), ms))
  ]);
}

async function main() {
  console.log('Email virtuel:', virtualEmail);

  // 1. signUp identique à l'app
  const { data: authData, error: authError } = await step('signUp', supabase.auth.signUp({
    email: virtualEmail,
    password: securePassword,
    options: {
      data: {
        role: 'rider', name: 'Test Livreur Debug', phone,
        vehicle: 'Moto', lat: 12.3714, lng: -1.5197,
        initial: 'T', city: 'ouaga', status: 'en attente', subscription_paid: false
      }
    }
  }));

  if (authError) { console.log('signUp ERROR:', authError.status, authError.code, authError.message); }
  const userId = authData?.user?.id;
  console.log('userId:', userId, '| session:', authData?.session ? 'présente' : 'ABSENTE');
  if (!userId) return;

  // 2. Vérifier que le trigger a créé le profil livreur
  const { data: liv, error: livErr } = await step('select livreurs (admin)', admin.from('livreurs').select('id,name,status').eq('id', userId));
  console.log('Profil livreurs:', livErr ? livErr.message : JSON.stringify(liv));

  // 3. Upload d'un fichier comme l'app
  const fakeImg = new Blob([Buffer.from('fake image data for test')], { type: 'image/jpeg' });
  const path = `${userId}/cni_recto_${Date.now()}`;
  const up = await step('upload storage', supabase.storage.from('identities').upload(path, fakeImg));
  console.log('Upload:', up.error ? `ERROR: ${up.error.message}` : 'OK -> ' + up.data?.path);

  // 4. Update livreurs comme l'app (avec le client anon authentifié)
  const upd = await step('update livreurs (anon)', supabase.from('livreurs').update({ cni_recto: 'https://test.url/x.jpg' }).eq('id', userId));
  console.log('Update livreurs:', upd.error ? `ERROR: ${upd.error.message}` : `OK (status ${upd.status})`);

  // 5. Nettoyage
  await admin.storage.from('identities').remove([path]);
  const del = await admin.auth.admin.deleteUser(userId);
  console.log('Nettoyage utilisateur test:', del.error ? del.error.message : 'OK');
}

main().catch(e => { console.error('ECHEC:', e.message); process.exit(1); });
