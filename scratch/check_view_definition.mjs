import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkViewDefinition() {
  let data = null;
  let error = null;
  try {
     const res = await supabaseAdmin.rpc('exec_sql', {
        query: "SELECT definition FROM pg_views WHERE viewname = 'livreurs_view';"
     });
     data = res.data;
     error = res.error;
  } catch (e) {
     error = e.message;
  }
  
  if (error || !data) {
     console.log("exec_sql RPC not found or failed:", error);
  } else {
     console.log("View definition:", data);
     return;
  }
  
  // Alternative: run a query using raw SQL via a quick endpoint if we can, or just inspect metadata.
  // Actually, we don't have exec_sql. Let's see if we can read the view definition from a pg_views SELECT if Supabase exposes it?
  // Supabase postgrest exposes views in the API. We can't query pg_views via Postgrest unless it's exposed in the schema.
  // But we can check if there's any other way.
  // Let's query using the REST API to check the view columns and verify if they are returned correctly.
  // Let's run a query on a driver to see what phone_display and is_unlocked actually return!
  const { data: sample, error: err } = await supabaseAdmin.from('livreurs_view').select('phone_display, is_unlocked').limit(1);
  console.log("Sample row from view:", sample, err);
}

checkViewDefinition();
