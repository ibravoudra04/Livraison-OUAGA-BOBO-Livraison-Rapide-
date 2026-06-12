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

async function checkAllAdminQueries() {
  const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@livraison.com',
    password: 'AdminPassword123!'
  });
  
  if (loginErr) return console.log("Login failed:", loginErr);
  
  const [r0, r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
      supabase.from('deblocages').select('created_at').order('created_at', { ascending: false }),
      supabase.from('livreurs').select('*', { count: 'exact', head: true }),
      supabase.from('livreurs').select('*').eq('status', 'en attente'),
      supabase.from('chats_livraison').select('created_at').order('created_at', { ascending: false }),
      supabase.from('chats_livraison').select('*, livreurs(name), clients_livraison(name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('livreurs').select('*').order('created_at', { ascending: false }),
      supabase.from('clients_livraison').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
      supabase.from('tickets_support').select('*, clients_livraison(name, phone), livreurs(name, phone)').order('created_at', { ascending: false }),
      supabase.from('annonces').select('*').order('created_at', { ascending: false }),
      supabase.from('paiements').select('*').order('created_at', { ascending: false }),
  ]);
  
  console.log("r0 error (deblocages):", r0.error);
  console.log("r1 error (livreurs count):", r1.error);
  console.log("r2 error (livreurs attente):", r2.error);
  console.log("r3 error (chats_livraison created_at):", r3.error);
  console.log("r4 error (chats_livraison join):", r4.error);
  console.log("r5 error (livreurs order):", r5.error);
  console.log("r6 error (clients_livraison count):", r6.error);
  console.log("r7 error (tickets_support join):", r7.error);
  console.log("r8 error (annonces):", r8.error);
  console.log("r9 error (paiements):", r9.error);
}

checkAllAdminQueries();
