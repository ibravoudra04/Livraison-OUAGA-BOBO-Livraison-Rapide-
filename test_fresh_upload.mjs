import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = 'c:/Users/HP/Livraison Rapide OUAGA et BOBO/.env.local';
const content = fs.readFileSync(envFile, 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const rand = Math.floor(Math.random() * 10000);
  const email = `testupload${rand}@livraison.com`;
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password: 'testpin_secure_pad',
    options: {
        data: { role: 'rider', phone: `+226 65 00 ${rand}` }
    }
  });
  
  if (authData?.session) {
     const dummyBlob = new Blob(['dummy content'], { type: 'image/jpeg' });
     const path = `${authData.user.id}/cni_recto_${Date.now()}`;
     const { data: uploadData, error: uploadError } = await supabase.storage
        .from('identities')
        .upload(path, dummyBlob, { contentType: 'image/jpeg' });
     console.log('Upload error:', uploadError);
  } else {
     console.log('No session', error);
  }
}
run();
