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
    email: 'admin@livraison.com',
    password: '1234_secure_pad' // Password we just reset
  });
  
  if (loginErr) return console.log("Login failed:", loginErr);
  
  console.log("Logged in. User:", sessionData.user?.email);
  console.log("App metadata role:", sessionData.user?.app_metadata?.role);

  const tables = ['deblocages', 'livreurs', 'chats_livraison', 'clients_livraison', 'tickets_support', 'annonces', 'paiements'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    console.log(`Fetch ${table}:`, data ? `SUCCESS (${data.length} rows)` : 'FAIL', error?.message || '');
  }
}

testAdmin();
