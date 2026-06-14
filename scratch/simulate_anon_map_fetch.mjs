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

async function simulateAnonMapFetch() {
  const city = 'Ouagadougou';
  const dbCity = city === 'Ouagadougou' ? 'ouaga' : (city === 'Bobo-Dioulasso' ? 'bobo' : city);
  
  console.log(`Simulating map fetch for city: ${city} (${dbCity})...`);
  const { data, error } = await supabase
    .from('livreurs_view')
    .select('*')
    .eq('city', dbCity)
    .in('status', ['actif', 'approved']);

  if (error) {
    console.error("❌ Map fetch failed:", error.message);
  } else {
    console.log(`✅ Map fetch returned ${data?.length} drivers.`);
    if (data && data.length > 0) {
      console.log("Sample driver location and status:", {
        id: data[0].id,
        name: data[0].name,
        city: data[0].city,
        status: data[0].status,
        lat: data[0].lat,
        lng: data[0].lng,
        is_unlocked: data[0].is_unlocked
      });
    }
  }
}

simulateAnonMapFetch();
