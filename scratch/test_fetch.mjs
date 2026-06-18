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

async function checkWithFetch() {
  const url = `${supabaseUrl}/rest/v1/livreurs_view?select=*&status=in.%28actif%2Capproved%29`;
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Origin': 'https://livraisonrapide.app'
      }
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    if (res.ok) {
      const data = JSON.parse(text);
      console.log('Data length:', data.length);
    } else {
      console.log('Error text:', text);
    }
  } catch(e) {
    console.error('Fetch failed:', e);
  }
}

checkWithFetch();
