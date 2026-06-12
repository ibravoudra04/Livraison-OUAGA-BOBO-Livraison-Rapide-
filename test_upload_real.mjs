import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ftbhmfdlvrykfbanajfp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YmhtZmRsdnJ5a2ZiYW5hamZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjEwNzAsImV4cCI6MjA5NTM5NzA3MH0.dK8-E2psZ4oCY6P8GXHsREWBFORLRI9H71x-mT82Pp8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpload() {
  const phoneNormalized = '+22676543211'; // Another test number
  const virtualEmail = phoneNormalized.replace(/\s+/g, '').replace('+', '') + '@livraison.com';
  const securePassword = "testpin_secure_pad";
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: virtualEmail,
    password: securePassword,
    options: {
      data: {
        role: 'rider',
        name: 'Test Driver 2',
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

  const userId = authData?.user?.id;
  console.log("1. User ID:", userId);

  if (userId && authData.session) {
    // try to upload a dummy file
    const dummyBlob = new Blob(['dummy content'], { type: 'image/jpeg' });
    const path = `${userId}/cni_recto_${Date.now()}`;
    
    console.log("2. Attempting upload to path:", path);
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('identities')
        .upload(path, dummyBlob, { contentType: 'image/jpeg' });
        
    if (uploadError) {
        console.error("3. Upload Error:", uploadError.message);
    } else {
        console.log("3. Upload Success!");
        
        // now try to update the livreurs table
        const updatePayload = {
            cni_recto: 'dummy_url'
        };
        const { error: updateError } = await supabase
            .from('livreurs')
            .update(updatePayload)
            .eq('id', userId);
            
        if (updateError) {
            console.error("4. Update Error:", updateError.message);
        } else {
            console.log("4. Update Success!");
        }
    }
  }
}

testUpload();
