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
  
  const safe = (query) => Promise.resolve(query).catch(e => ({ data: null, count: null, error: e }));

  const [ r0, r1, r2, r3, r4, r5, r6, r7, r8, r9 ] = await Promise.all([
    safe(supabase.from('deblocages').select('created_at').order('created_at', { ascending: false })),
    safe(supabase.from('livreurs').select('*', { count: 'exact', head: true })),
    safe(supabase.from('livreurs').select('*').eq('status', 'en attente')),
    safe(supabase.from('chats_livraison').select('created_at').order('created_at', { ascending: false })),
    safe(supabase.from('chats_livraison').select('*, livreurs(name), clients_livraison(name)').order('created_at', { ascending: false }).limit(50)),
    safe(supabase.from('livreurs').select('*').order('created_at', { ascending: false })),
    safe(supabase.from('clients_livraison').select('*', { count: 'exact' }).order('created_at', { ascending: false })),
    safe(supabase.from('tickets_support').select('*, clients_livraison(name, phone), livreurs(name, phone)').order('created_at', { ascending: false })),
    safe(supabase.from('annonces').select('*').order('created_at', { ascending: false })),
    safe(supabase.from('paiements').select('*').order('created_at', { ascending: false })),
  ]);

  console.log("deblocages error:", r0.error);
  console.log("livreurs exact count:", r1.count, "error:", r1.error);
  console.log("livreurs attente data:", r2.data?.length, "error:", r2.error);
  console.log("chats_livraison created_at:", r3.data?.length, "error:", r3.error);
  console.log("chats_livraison join:", r4.data?.length, "error:", r4.error);
  console.log("livreurs all:", r5.data?.length, "error:", r5.error);
  console.log("clients_livraison count:", r6.count, "error:", r6.error);
  console.log("tickets_support join:", r7.data?.length, "error:", r7.error);
  console.log("annonces:", r8.data?.length, "error:", r8.error);
  console.log("paiements:", r9.data?.length, "error:", r9.error);
}

testAdmin();
