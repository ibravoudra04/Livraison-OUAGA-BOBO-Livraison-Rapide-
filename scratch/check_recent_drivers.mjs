import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const admin = createClient(url, serviceKey);

const { data, error } = await admin
  .from('livreurs')
  .select('id, name, phone, status, city, cni_recto, cni_verso, selfie, created_at')
  .order('created_at', { ascending: false })
  .limit(15);

if (error) { console.error(error); process.exit(1); }
for (const l of data) {
  console.log(`${l.created_at} | ${l.name} | ${l.phone} | status=${l.status} | docs: recto=${l.cni_recto ? 'OUI' : 'non'} verso=${l.cni_verso ? 'OUI' : 'non'} selfie=${l.selfie ? 'OUI' : 'non'}`);
}

// Aussi: utilisateurs auth récents avec role rider
const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 20 });
console.log('\n--- Derniers utilisateurs auth ---');
for (const u of users.users.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12)) {
  console.log(`${u.created_at} | ${u.email} | role=${u.user_metadata?.role} | confirmé=${u.email_confirmed_at ? 'oui' : 'NON'} | dernière connexion=${u.last_sign_in_at ?? 'jamais'}`);
}
