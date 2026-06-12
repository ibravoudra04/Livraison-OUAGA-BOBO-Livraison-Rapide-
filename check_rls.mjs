import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
  let { data, error } = await supabase.rpc('run_sql', { sql_query: "SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('livreurs', 'clients_livraison', 'chats_livraison', 'paiements');" });
  if (error) {
     console.log("Error running run_sql:", error);
     console.log("Let's try creating run_sql function...");
     
     // Note: we can't create it via client API if it's not supported, but we'll try an edge function or just do raw REST.
     // Instead of SQL, maybe we can just query the rest API directly, but pg_policies is not exposed!
  } else {
     console.log(JSON.stringify(data, null, 2));
  }
}

check();
