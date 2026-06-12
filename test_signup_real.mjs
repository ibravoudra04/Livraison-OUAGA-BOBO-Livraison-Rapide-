import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ftbhmfdlvrykfbanajfp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YmhtZmRsdnJ5a2ZiYW5hamZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjEwNzAsImV4cCI6MjA5NTM5NzA3MH0.dK8-E2psZ4oCY6P8GXHsREWBFORLRI9H71x-mT82Pp8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSignup() {
  console.log("1. Starting driver registration test...");
  
  const phoneNormalized = '+22676543210'; // Test number
  const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
  const securePassword = "testpin_secure_pad";
  
  console.log("2. Signing up with:", { virtualEmail, securePassword });
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: virtualEmail,
    password: securePassword,
    options: {
      data: {
        role: 'rider',
        name: 'Test Driver',
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

  console.log("3. Signup result:");
  if (authError) {
    console.error("Auth Error:", authError.message);
  } else {
    console.log("Auth Data User ID:", authData.user?.id);
    console.log("Auth Data Session:", authData.session ? "Created" : "Null");
  }

  const alreadyRegistered =
        (authError && authError.message.toLowerCase().includes('already registered')) ||
        (!authError && authData.user && !authData.session);

  console.log("4. alreadyRegistered flag evaluates to:", alreadyRegistered);

  if (alreadyRegistered) {
    console.log("5. Attempting to log in because alreadyRegistered is true...");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: securePassword,
    });
    if (loginError) {
        console.error("6. Login Error:", loginError.message);
    } else {
        console.log("6. Login Success! Session:", loginData.session ? "Created" : "Null");
    }
  }

  // Cleanup: delete the test user if it was created
  if (authData?.user?.id) {
    // Note: Deleting a user requires service_role key, which we don't use here.
    // It will remain in the DB.
  }
}

testSignup();
