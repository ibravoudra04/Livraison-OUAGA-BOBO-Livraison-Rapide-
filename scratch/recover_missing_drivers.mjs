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

async function recoverMissingDrivers() {
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
  
  console.log(`Found ${missingLivreurs.length} missing riders to recover.`);
  
  let recoveredCount = 0;
  for (const u of missingLivreurs) {
      const meta = u.user_metadata || {};
      const phone = meta.phone || u.phone;
      const name = meta.name || 'Livreur Récupéré';
      
      const payload = {
          id: u.id,
          name: name,
          phone: phone,
          vehicle: meta.vehicle || 'Moto',
          lat: meta.lat || 12.3714,
          lng: meta.lng || -1.5197,
          initial: meta.initial || name.charAt(0).toUpperCase() || 'L',
          contacts_count: 0,
          subscription_paid: false,
          status: 'en attente', // Set them to pending so admin can validate them
          rating: 5.0,
          city: meta.city || 'ouaga',
          cni_recto: meta.cni_recto || null,
          cni_verso: meta.cni_verso || null,
          selfie: meta.selfie || null,
          created_at: u.created_at // Preserve original signup date
      };
      
      const { error: insertError } = await supabaseAdmin.from('livreurs').insert(payload);
      if (insertError) {
          console.error(`Failed to recover user ${u.id} (${phone}):`, insertError.message);
      } else {
          console.log(`Successfully recovered ${name} (${phone})`);
          recoveredCount++;
      }
  }
  
  console.log(`Recovery complete. Recovered ${recoveredCount}/${missingLivreurs.length} users.`);
}

recoverMissingDrivers();
