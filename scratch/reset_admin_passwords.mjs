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

async function resetAdminPasswords() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  const targetEmails = ['admin@livraison.com', '67370909@livraison.com', '22667370909@livraison.com'];
  const newPassword = '1234_secure_pad';

  for (const user of users.users) {
    if (targetEmails.includes(user.email)) {
      console.log(`Resetting password for: ${user.email} (ID: ${user.id})...`);
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );
      if (updateErr) {
        console.error(`❌ Failed to update ${user.email}:`, updateErr.message);
      } else {
        console.log(`✅ Successfully updated ${user.email}`);
      }
    }
  }
}

resetAdminPasswords();
