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
  const rand = Math.floor(Math.random() * 100000);
  const email = `2267000${rand}@livraison.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'testpin_secure_pad',
    options: {
        data: { role: 'rider', phone: `+226 70 00 ${rand}` }
    }
  });
  console.log('Signup data session:', data?.session);
  console.log('Signup data user:', data?.user?.id);
  console.log('Signup error:', error);
}
run();
