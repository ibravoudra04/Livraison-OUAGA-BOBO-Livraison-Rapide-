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
  const { data: users, error } = await supabase.auth.admin.listUsers();
  console.log("Sample metadata:", Array.from(new Set(users.users.map(u => u.user_metadata?.role)))
}
run();
