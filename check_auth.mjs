import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');
const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(url, key);

async function checkLogin() {
  const c = await supabase.auth.signInWithPassword({
    email: '22670999999@livraison.com',
    password: '1234_secure_pad'
  });
  console.log('Login Client Premium:', c.error ? c.error.message : 'Success');

  const r = await supabase.auth.signInWithPassword({
    email: '22676458210@livraison.com',
    password: '1234_secure_pad'
  });
  console.log('Login Rider:', r.error ? r.error.message : 'Success');
}
checkLogin();
