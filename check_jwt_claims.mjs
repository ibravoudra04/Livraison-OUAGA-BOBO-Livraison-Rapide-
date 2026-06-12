import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseJwt (token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

async function testAdminLogin() {
  // Let's try to login with 22667370909@livraison.com or 67370909@livraison.com
  // We can force login using the service key to get a user and then generate a link, 
  // or we can use the password I just set (AdminPassword123!) for admin@livraison.com
  const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@livraison.com',
    password: 'AdminPassword123!'
  });
  
  if (loginErr) {
    console.error("Login failed:", loginErr);
    return;
  }
  
  const token = sessionData.session.access_token;
  const decoded = parseJwt(token);
  console.log("Decoded JWT claims:");
  console.log(JSON.stringify(decoded, null, 2));
}

testAdminLogin();
