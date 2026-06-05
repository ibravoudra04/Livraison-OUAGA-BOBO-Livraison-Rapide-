import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');
const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(url, key);
supabase.from('livreurs_view').select('name, city').then(res => console.log('Livreurs Cities:', res.data, res.error));
supabase.from('clients_livraison').select('*').then(res => console.log('Clients:', res.data, res.error));
