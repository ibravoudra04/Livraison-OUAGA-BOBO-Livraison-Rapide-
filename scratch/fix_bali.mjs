import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const {data:before}=await admin.from('livreurs').select('id,name,status').eq('status','suspendu');
const {error}=await admin.from('livreurs').update({status:'actif'}).eq('status','suspendu');
console.log('Restauration:', error?error.message:'OK -> '+(before||[]).map(b=>b.name+' remis actif').join(', '));
const {count}=await admin.from('livreurs').select('*',{count:'exact',head:true}).eq('status','suspendu');
console.log('Livreurs suspendu restants (doit être 0):', count);
