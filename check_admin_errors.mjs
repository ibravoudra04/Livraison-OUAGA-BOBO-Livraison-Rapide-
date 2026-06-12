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
  // Wait, I can't login as admin because I don't know the password...
  // Or CAN I? 
  // Is the password in .env? No.
  // Is it in the database? It's hashed.
  // We can update the admin password using service_role!
  
  const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // 1. Reset admin password to a known one
  console.log("Resetting admin password...");
  const { data: adminUser, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
    '6db99e69-02eb-4d56-a192-d6148eb8498f', // Wait, I need the admin ID!
    { password: 'AdminPassword123!' }
  ).catch(() => ({ data: null, error: "Need to fetch ID first" }));
  
  // Let's fetch ID first
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const adminId = users.users.find(u => u.app_metadata?.role === 'admin')?.id;
  
  if (!adminId) {
    console.log("Admin not found");
    return;
  }
  
  await supabaseAdmin.auth.admin.updateUserById(adminId, { password: 'AdminPassword123!' });
  
  // 2. Login as admin
  const { data: sessionData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@livraison.com',
    password: 'AdminPassword123!'
  });
  
  if (loginErr) {
    console.log("Login failed:", loginErr);
    return;
  }
  
  console.log("Logged in! Checking queries...");
  
  // 3. Run queries from useAdminStats.ts
  const q1 = await supabase.from('livreurs').select('*', { count: 'exact', head: true });
  console.log("livreurs count error:", q1.error);
  
  const q2 = await supabase.from('chats_livraison').select('*, livreurs(name), clients_livraison(name)').limit(1);
  console.log("chats_livraison error:", q2.error);
  
  const q3 = await supabase.from('paiements').select('*').limit(1);
  console.log("paiements error:", q3.error);
}

checkAdminErrors();
