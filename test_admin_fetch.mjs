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
const SUPABASE_ANON_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testAdminImpersonation() {
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  const adminUser = users.users.find(u => u.app_metadata && u.app_metadata.role === 'admin');
  
  if (!adminUser) return;

  // We can query with the service role but set the auth context!
  // Wait, Supabase js doesn't support setting auth.uid() directly on the server client easily without JWT.
  // Actually, we can just use the Admin JWT if we know the JWT secret, but we don't.
  
  // Let's just create a test function that checks RLS manually:
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
     query: `
        SET role authenticated;
        SET request.jwt.claims TO '{"sub": "${adminUser.id}", "app_metadata": {"role": "admin"}}';
        SELECT count(*) FROM public.livreurs;
     `
  });
  console.log("Count with RLS:", data, error);
}

testAdminImpersonation();
