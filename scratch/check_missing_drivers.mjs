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

async function checkMissingDrivers() {
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
     console.error("Error fetching users:", authError);
     return;
  }
  
  const { data: livreurs, error: dbError } = await supabaseAdmin.from('livreurs').select('id');
  if (dbError) {
     console.error("Error fetching livreurs:", dbError);
     return;
  }
  
  const livreurIds = new Set(livreurs.map(l => l.id));
  
  const missingLivreurs = users.filter(u => 
      u.user_metadata?.role === 'rider' && !livreurIds.has(u.id)
  );
  
  console.log(`Found ${missingLivreurs.length} 'rider' users in auth.users who are NOT in the 'livreurs' table.`);
  
  if (missingLivreurs.length > 0) {
      console.log("Missing users:");
      missingLivreurs.forEach(u => {
          console.log(`- ID: ${u.id}, Phone: ${u.phone || u.user_metadata?.phone}, Created: ${u.created_at}`);
      });
  }
}

checkMissingDrivers();
