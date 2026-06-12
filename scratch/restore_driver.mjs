import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});

// Le driver touché = celui retourné par select limit(1) (même requête)
const {data:touched}=await admin.from('livreurs').select('id,name,status,created_at,contacts_count,selfie,cni_recto').limit(1).maybeSingle();
console.log('Livreur ciblé par le test (limit 1):', JSON.stringify({id:touched.id,name:touched.name,status:touched.status,created:touched.created_at,contacts:touched.contacts_count,docs:!!(touched.selfie||touched.cni_recto)}));

// Tous les suspendu actuels
const {data:susp}=await admin.from('livreurs').select('id,name,status,created_at,contacts_count').eq('status','suspendu');
console.log('\nTous les livreurs en "suspendu" actuellement:', (susp||[]).length);
for(const s of (susp||[])) console.log('  -', s.name, '| créé', s.created_at?.substring(0,10), '| contacts', s.contacts_count);
