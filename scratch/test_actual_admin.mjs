import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdmin() {
  const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: '22667370909@livraison.com',
    password: '1234_secure_pad' // using the user's generated password logic
  });
  
  if (loginErr) return console.log("Login failed:", loginErr);
  
  console.log("Logged in as:", sessionData.user.email);
  console.log("App metadata:", sessionData.user.app_metadata);
  
  const { data, error, count } = await supabase.from('livreurs').select('*', { count: 'exact', head: true });
  console.log("Livreurs count for this user:", count, error);
}

testAdmin();
