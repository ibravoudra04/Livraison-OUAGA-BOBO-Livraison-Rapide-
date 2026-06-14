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

async function checkLivreursFetch() {
  let query = supabase.from('livreurs_view').select('*');
  query = query.eq('city', 'ouaga');
  query = query.in('status', ['actif', 'approved']);
  
  const { data, error } = await query;
  console.log("Error:", error);
  console.log("Data length:", data?.length);
  if (data?.length > 0) {
     console.log("First record:", data[0]);
  }
}

checkLivreursFetch();
