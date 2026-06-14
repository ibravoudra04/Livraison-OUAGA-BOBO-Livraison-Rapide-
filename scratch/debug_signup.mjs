import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugSignup() {
  const rand = Math.floor(Math.random() * 100000);
  const email = `debug_client_${rand}@livraison.com`;
  
  console.log("Attempting to create user via admin client...");
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { role: 'client', name: 'Debug Client', phone: `+226 00 00 ${rand}` }
  });

  if (error) {
    console.error("❌ Sign up failed via admin client. Error details:");
    console.error(error);
  } else {
    console.log("✅ User created successfully:", data.user.id);
    // clean up
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    console.log("Cleaned up.");
  }
}

debugSignup();
