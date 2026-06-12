import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const g = (k) => env.match(new RegExp(k + '=(.+)'))[1].trim().replace(/^['"]|['"]$/g, '');
const admin = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const acc = JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
// Coordonnées uniques pour isoler le marqueur de test (légèrement décalé du centre)
const lat = 12.4000, lng = -1.4500;
const { error } = await admin.from('livreurs').update({ status: 'actif', lat, lng }).eq('id', acc.driverId);
console.log('Livreur test -> actif:', error ? error.message : 'OK', '@', lat, lng);
acc.driverLat = lat; acc.driverLng = lng;
fs.writeFileSync('scratch/test_accounts.json', JSON.stringify(acc, null, 2));
