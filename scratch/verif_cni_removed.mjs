import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local','utf-8');
const URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const ANON = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)?.[1]?.trim();
const sb = createClient(URL, ANON); // comme un visiteur public

// 1) Tenter de lire les CNI (doit ECHOUER : colonne supprimee de la vue)
const cni = await sb.from('livreurs_view').select('cni_recto, cni_verso').limit(1);
console.log('Lecture CNI via API publique :', cni.error ? `BLOQUE -> ${cni.error.message}` : `ENCORE EXPOSE -> ${JSON.stringify(cni.data)}`);

// 2) Verifier que la carte marche toujours (colonnes legitimes)
const ok = await sb.from('livreurs_view').select('id, name, selfie, phone_display, is_unlocked').in('status',['actif','approved']).limit(3);
console.log('Carte (colonnes legitimes) :', ok.error ? `ERREUR -> ${ok.error.message}` : `OK -> ${ok.data.length} livreurs lus`);
