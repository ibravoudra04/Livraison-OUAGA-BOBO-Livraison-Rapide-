import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyAdminDataAccess() {
  console.log("Logging in as admin@livraison.com...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@livraison.com',
    password: '1234_secure_pad'
  });

  if (authError) {
    console.error("❌ Sign in failed:", authError.message);
    return;
  }

  console.log("✅ Sign in successful. JWT Role:", authData.user.app_metadata?.role);

  // Run the Admin Dashboard queries
  console.log("\nRunning admin queries...");
  
  const deblocagesRes = await supabase.from('deblocages').select('created_at');
  console.log(`- deblocages: count=${deblocagesRes.data?.length}, error=${deblocagesRes.error?.message || null}`);
  
  const livreursCountRes = await supabase.from('livreurs').select('*', { count: 'exact', head: true });
  console.log(`- livreurs (count): count=${livreursCountRes.count}, error=${livreursCountRes.error?.message || null}`);
  
  const pendingLivreursRes = await supabase.from('livreurs').select('*').eq('status', 'en attente');
  console.log(`- livreurs (en attente): count=${pendingLivreursRes.data?.length}, error=${pendingLivreursRes.error?.message || null}`);

  const chatsRes = await supabase.from('chats_livraison').select('*, livreurs(name), clients_livraison(name)').limit(50);
  console.log(`- chats: count=${chatsRes.data?.length}, error=${chatsRes.error?.message || null}`);

  const allDriversRes = await supabase.from('livreurs').select('*');
  console.log(`- all drivers: count=${allDriversRes.data?.length}, error=${allDriversRes.error?.message || null}`);

  const clientsRes = await supabase.from('clients_livraison').select('*');
  console.log(`- clients: count=${clientsRes.data?.length}, error=${clientsRes.error?.message || null}`);

  const paiementsRes = await supabase.from('paiements').select('*');
  console.log(`- paiements: count=${paiementsRes.data?.length}, error=${paiementsRes.error?.message || null}`);

  await supabase.auth.signOut();
}

verifyAdminDataAccess();
