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

async function testLoggedInView() {
  // Let's create a temporary client user and log in, then query the view
  const rand = Math.floor(Math.random() * 100000);
  const email = `test_client_${rand}@livraison.com`;
  const password = `client_pwd_${rand}`;

  console.log("Creating test client user...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: 'client', name: 'Test Client', phone: `+226 00 00 ${rand}` }
    }
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError.message);
    return;
  }

  const userId = signUpData.user.id;
  console.log("Client created with ID:", userId);

  // Sign in to establish session
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error("Sign in failed:", signInError.message);
    return;
  }

  console.log("Signed in successfully. Querying livreurs_view...");
  const { data: viewData, error: viewError } = await supabase.from('livreurs_view').select('id, phone_display, is_unlocked');
  if (viewError) {
    console.error("Error querying view:", viewError.message);
  } else {
    console.log("Livreurs view returned rows:", viewData?.length);
    console.log("Sample rows:");
    console.log(viewData?.slice(0, 3));
  }

  // Clean up user
  const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  await supabaseAdmin.auth.admin.deleteUser(userId);
  console.log("Test client user cleaned up.");
}

testLoggedInView();
