import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAdmin() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  
  const targetEmail = '22667370909@livraison.com';
  const u = users.users.find(u => u.email === targetEmail);
  if (u) {
    console.log("User 22667370909@livraison.com:");
    console.log("app_metadata:", u.app_metadata);
    console.log("user_metadata:", u.user_metadata);
  } else {
    console.log("User not found!");
  }
}

checkAdmin();
