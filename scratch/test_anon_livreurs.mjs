import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=')) supabaseKey = line.split('=')[1].trim();
  if (!supabaseKey && line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLivreurs() {
  const { data, error } = await supabase.from('livreurs_view').select('*').in('status', ['actif', 'approved']);
  if (error) {
    console.error('Error fetching livreurs_view select(*) no city:', error);
  } else {
    console.log(`livreurs_view select(*) no city count: ${data.length}`);
  }
}

checkLivreurs();
