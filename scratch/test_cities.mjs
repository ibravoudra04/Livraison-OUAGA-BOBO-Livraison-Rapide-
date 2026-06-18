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

async function checkCities() {
  const url = `${supabaseUrl}/rest/v1/livreurs_view?select=city&status=in.%28actif%2Capproved%29`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });
    const data = await res.json();
    console.log('Cities in DB:', [...new Set(data.map(d => d.city))]);
  } catch(e) {}
}

checkCities();
