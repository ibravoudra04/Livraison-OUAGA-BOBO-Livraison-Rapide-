import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = 'c:/Users/HP/Livraison Rapide OUAGA et BOBO/.env.local';
const content = fs.readFileSync(envFile, 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('livreurs').select('id, name, phone').in('phone', ['+226 64 00 03 35', '+22664000335', '76458210', '+22676458210', '+226 73 57 64 20', '+22673576420', '+226 64 89 95 16', '+22664899516']);
  console.log('Livreurs with matching phones:', data);
  if (error) console.error(error);
  
  const { data: d2, error: e2 } = await supabase.from('clients_livraison').select('id, name, phone').in('phone', ['+226 64 00 03 35', '+22664000335', '76458210', '+22676458210', '+226 73 57 64 20', '+22673576420', '+226 64 89 95 16', '+22664899516']);
  console.log('Clients with matching phones:', d2);
  if (e2) console.error(e2);
}
run();
