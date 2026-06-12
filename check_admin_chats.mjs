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

async function checkAdminChats() {
  const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@livraison.com',
    password: 'AdminPassword123!'
  });
  
  if (loginErr) return console.log("Login failed:", loginErr);
  
  const q2 = await supabase.from('chats_livraison').select('*, livreurs(name), clients_livraison(name)').limit(50);
  console.log("chats_livraison error:", q2.error);
  
  // Also let's check `tickets_support` since it has joins:
  const q3 = await supabase.from('tickets_support').select('*, clients_livraison(name, phone), livreurs(name, phone)').order('created_at', { ascending: false });
  console.log("tickets_support error:", q3.error);
  
}

checkAdminChats();
