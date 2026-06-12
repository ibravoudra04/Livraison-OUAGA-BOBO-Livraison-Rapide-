import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const {data:users}=await admin.auth.admin.listUsers({perPage:1000});
const zz=users.users.filter(u=>/ZZ |AUDIT|Verif|FauxAdmin|22609000/i.test((u.user_metadata?.name||'')+u.email));
console.log('Comptes de test résiduels:', zz.length, zz.map(u=>u.email));
const {count:susp}=await admin.from('livreurs').select('*',{count:'exact',head:true}).eq('status','suspendu');
console.log('Livreurs suspendu (doit être 0):', susp);
const adminU=users.users.find(u=>u.email==='admin@livraison.com');
console.log('Compte admin@livraison.com:', adminU?('OK app_role='+adminU.app_metadata?.role):'ABSENT');
for(const t of ['clients_livraison','livreurs','avis','chats_livraison']){ const {count}=await admin.from(t).select('*',{count:'exact',head:true}); console.log('  ',t,':',count); }
