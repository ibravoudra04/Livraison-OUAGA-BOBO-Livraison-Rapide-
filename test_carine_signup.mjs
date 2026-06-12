import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = 'c:/Users/HP/Livraison Rapide OUAGA et BOBO/.env.local';
const content = fs.readFileSync(envFile, 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  const rand = Math.floor(Math.random() * 10000);
  const email = `22664000335${rand}@livraison.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'testpin_secure_pad',
    options: {
        data: {
            role: 'rider',
            name: 'Carine',
            phone: '+226 64 00 03 35',
            lat: 12.3714,
            lng: -1.5197,
            initial: 'C',
            city: 'ouaga',
            status: 'en attente',
            subscription_paid: false,
            vehicle: 'Moto'
        }
    }
  });
  console.log('Signup error:', error);
  console.log('User ID:', data?.user?.id);
  
  // Wait a sec for trigger
  await new Promise(r => setTimeout(r, 1000));
  
  if (data?.user?.id) {
     const { data: dbData, error: dbError } = await supabase.from('livreurs').select('*').eq('id', data.user.id);
     console.log('In DB:', dbData);
  }
}
run();
