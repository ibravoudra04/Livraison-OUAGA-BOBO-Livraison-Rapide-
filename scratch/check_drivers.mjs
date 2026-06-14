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

async function checkDrivers() {
  const { data, error } = await supabase.from('livreurs_view').select('id, name, city, status, lat, lng');
  if (error) {
    console.error("Error fetching drivers:", error);
    return;
  }
  
  console.log("Total drivers:", data.length);
  
  // Count by city and status
  const summary = {};
  data.forEach(d => {
    const key = `city:${d.city} | status:${d.status}`;
    summary[key] = (summary[key] || 0) + 1;
  });
  console.log("Drivers Summary:");
  console.log(JSON.stringify(summary, null, 2));

  console.log("\nSample 10 drivers:");
  console.log(data.slice(0, 10));
}

checkDrivers();
