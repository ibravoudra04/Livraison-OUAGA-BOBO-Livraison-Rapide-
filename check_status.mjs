import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkStatus() {
  const { data, error } = await supabase.from('livreurs_view').select('id, status');
  const actifs = data?.filter(d => d.status === 'actif').length;
  const en_attente = data?.filter(d => d.status === 'en attente').length;
  const suspendus = data?.filter(d => d.status === 'suspendu').length;
  
  console.log(`Actifs: ${actifs}, En attente: ${en_attente}, Suspendus: ${suspendus}`);
}

checkStatus();
