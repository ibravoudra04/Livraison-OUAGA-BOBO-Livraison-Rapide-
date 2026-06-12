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

async function testSignup(dataObj) {
  const rand = Math.floor(Math.random() * 100000);
  const email = `testbug${rand}@livraison.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'testpin_secure_pad',
    options: { data: dataObj }
  });
  console.log('Signup error for', JSON.stringify(dataObj), ':', error?.message || 'Success');
}

async function run() {
  const r1 = Math.floor(Math.random() * 10000);
  await testSignup({ role: 'rider', phone: `+226 65 11 ${r1}` });
  
  const r2 = Math.floor(Math.random() * 10000);
  await testSignup({ 
    role: 'rider', 
    name: 'Test Full',
    phone: `+226 65 11 ${r2}`,
    lat: 12.3714,
    lng: -1.5197,
    initial: 'T',
    city: 'ouaga',
    status: 'en attente',
    subscription_paid: false,
    vehicle: 'Moto'
  });
  
  const r3 = Math.floor(Math.random() * 10000);
  await testSignup({ 
    role: 'rider', 
    name: 'Test Missing Lat',
    phone: `+226 65 11 ${r3}`,
    initial: 'T',
    city: 'ouaga',
    status: 'en attente',
    subscription_paid: false,
    vehicle: 'Moto'
  });
}
run();
