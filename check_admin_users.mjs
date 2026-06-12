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

async function checkUsers() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) { console.error(error); return; }
  
  users.users.forEach(u => {
    if (u.app_metadata?.role === 'admin' || u.email?.includes('admin') || u.email?.includes('67370909')) {
      console.log(`User: ${u.email}`);
      console.log(`  app_metadata:`, u.app_metadata);
      console.log(`  user_metadata:`, u.user_metadata);
    }
  });
}

checkUsers();
