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

async function testRegistration() {
  const phoneNormalized = '+226 71 99 99 99'; // Dummy test phone
  const virtualEmail = '22671999999@livraison.com';
  const securePassword = '4321_secure_pad';
  const name = 'Testeur IA';

  console.log("Attempting to sign up...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: virtualEmail,
    password: securePassword,
    options: {
      data: {
        role: 'rider',
        name: name,
        phone: phoneNormalized,
        vehicle: 'Moto',
        lat: 12.3714,
        lng: -1.5197,
        initial: 'T',
        city: 'ouaga',
        status: 'en attente',
        subscription_paid: false
      }
    }
  });

  if (authError) {
    console.log("Sign up error:", authError);
    return;
  }
  
  console.log("Signed up successfully! User ID:", authData.user?.id);
  
  // Wait 2 seconds to let the trigger finish just in case (though it's synchronous in PG)
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Checking if user is in 'livreurs' table...");
  const { data: driverData, error: driverError } = await supabase
    .from('livreurs_view')
    .select('id, name, status')
    .eq('id', authData.user?.id)
    .single();
    
  if (driverError) {
      console.error("User NOT found in livreurs_view:", driverError);
  } else {
      console.log("Success! User found in livreurs:", driverData);
  }
  
  // Clean up
  console.log("Cleaning up test user...");
  const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  console.log("Cleanup complete.");
}

testRegistration();
