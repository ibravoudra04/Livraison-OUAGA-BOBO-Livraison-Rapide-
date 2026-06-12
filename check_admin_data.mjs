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

async function checkAdminErrors() {
  const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@livraison.com',
    password: 'AdminPassword123!'
  });
  
  if (loginErr) return console.log("Login failed:", loginErr);
  
  const q1 = await supabase.from('livreurs').select('*');
  console.log("livreurs data length:", q1.data?.length, "error:", q1.error);
  
  const q2 = await supabase.from('clients_livraison').select('*');
  console.log("clients_livraison data length:", q2.data?.length, "error:", q2.error);
}

checkAdminErrors();
