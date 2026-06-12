import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env variables
const envFile = 'c:/Users/HP/Livraison Rapide OUAGA et BOBO/.env.local';
if (!fs.existsSync(envFile)) {
  console.error(".env.local not found");
  process.exit(1);
}

const content = fs.readFileSync(envFile, 'utf8');
const env = {};
content.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function findDeleted() {
  console.log("Fetching auth users...");
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth error:", authError);
    return;
  }

  console.log("Fetching drivers in public.livreurs...");
  const { data: dbDrivers, error: dbError } = await supabase.from('livreurs').select('id, name, phone');
  if (dbError) {
    console.error("DB error:", dbError);
    return;
  }

  const dbDriverIds = new Set(dbDrivers.map(d => d.id));

  console.log("\nComparison:");
  for (const user of users) {
    const role = user.app_metadata?.role || user.user_metadata?.role;
    if (role === 'rider') {
      const existsInDb = dbDriverIds.has(user.id);
      console.log(`- User: ${user.user_metadata?.name || 'Unknown'} (${user.user_metadata?.phone || 'No phone'}), ID: ${user.id}, In DB: ${existsInDb}`);
      if (!existsInDb) {
        console.log(`  👉 Found deleted driver!`);
        console.log(`  Metadata:`, JSON.stringify(user.user_metadata, null, 2));
        console.log(`  App Metadata:`, JSON.stringify(user.app_metadata, null, 2));
        console.log(`  Email: ${user.email}`);
        console.log(`  Created at: ${user.created_at}`);
      }
    }
  }
}

findDeleted();
