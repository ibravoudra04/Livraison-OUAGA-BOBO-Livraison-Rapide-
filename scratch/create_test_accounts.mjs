// Crée les comptes de test (client + livreur) et les enregistre pour nettoyage final.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const g = (k) => env.match(new RegExp(k + '=(.+)'))[1].trim().replace(/^['"]|['"]$/g, '');
const url = g('NEXT_PUBLIC_SUPABASE_URL');
const anon = g('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const admin = createClient(url, g('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const pub = createClient(url, anon, { auth: { persistSession: false } });

// Numéros de test improbables (préfixe 09 = test)
const fmt = (digits) => '+226 ' + digits.match(/.{1,2}/g).join(' ');
const clientPhone = fmt('09000001');   // +226 09 00 00 01
const driverPhone = fmt('09000002');   // +226 09 00 00 02
const PIN = '1234';
const pwd = PIN + '_secure_pad';
const cEmail = clientPhone.replace(/\s+/g,'').replace('+','') + '@livraison.com';
const dEmail = driverPhone.replace(/\s+/g,'').replace('+','') + '@livraison.com';

const created = { ids: [], emails: [], clientPhone, driverPhone, cEmail, dEmail, PIN };

// CLIENT
const c = await pub.auth.signUp({ email: cEmail, password: pwd, options: { data: {
  role: 'client', name: 'ZZ Test Client AUDIT', phone: clientPhone, subscription_paid: false
}}});
if (c.error) console.log('Client signUp:', c.error.message);
else { created.ids.push(c.data.user.id); created.emails.push(cEmail); console.log('Client créé:', c.data.user.id); }

// LIVREUR (statut actif directement pour tester le chat ; sinon en attente)
const d = await pub.auth.signUp({ email: dEmail, password: pwd, options: { data: {
  role: 'rider', name: 'ZZ Test Livreur AUDIT', phone: driverPhone, vehicle: 'Moto',
  lat: 12.3714, lng: -1.5197, initial: 'Z', city: 'ouaga', status: 'en attente', subscription_paid: false
}}});
if (d.error) console.log('Livreur signUp:', d.error.message);
else { created.ids.push(d.data.user.id); created.emails.push(dEmail); console.log('Livreur créé:', d.data.user.id); }

// Vérifier que les profils ont bien été créés par le trigger
await new Promise(r=>setTimeout(r,1500));
const { data: cliRow } = await admin.from('clients_livraison').select('id,name,phone').eq('id', created.ids[0]).maybeSingle();
const { data: drvRow } = await admin.from('livreurs').select('id,name,phone,status').eq('id', created.ids[1]).maybeSingle();
console.log('Profil client en base  :', JSON.stringify(cliRow));
console.log('Profil livreur en base :', JSON.stringify(drvRow));
created.clientId = created.ids[0];
created.driverId = created.ids[1];

fs.writeFileSync('scratch/test_accounts.json', JSON.stringify(created, null, 2));
console.log('\nComptes enregistrés dans scratch/test_accounts.json');
console.log(JSON.stringify(created, null, 2));
