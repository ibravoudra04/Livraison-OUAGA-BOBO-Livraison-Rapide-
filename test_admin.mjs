import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testAdmin() {
  // Let's get the list of users
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (userError) {
     console.error("Error fetching users:", userError);
     return;
  }
  
  const adminUser = users.users.find(u => u.app_metadata && u.app_metadata.role === 'admin');
  if (!adminUser) {
     console.log("NO ADMIN USER FOUND!");
     console.log("Users:", users.users.map(u => ({ email: u.email, role: u.app_metadata?.role })));
     return;
  }
  
  console.log("Admin user found:", adminUser.email);
  
  // Now let's try to simulate the admin client
  // Wait, the client uses an anon key and a session.
  const SUPABASE_ANON_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();
  
  // Create a client with anon key
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Login as admin? We don't have the password.
  // We can just use the service role key to see if the table is actually empty!
  
  const { data: livreurs, error: livreursError } = await supabaseAdmin.from('livreurs').select('id');
  console.log(`Service Role Livreurs count: ${livreurs?.length}`);
  
  const { data: clients, error: clientsError } = await supabaseAdmin.from('clients_livraison').select('id');
  console.log(`Service Role Clients count: ${clients?.length}`);
}

testAdmin();
