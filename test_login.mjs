import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');
const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(url, key);

async function list() {
  const { data, error } = await supabase.from('livreurs').select('name, phone');
  console.log("Livreurs:", data, error?.message);
}
list();
