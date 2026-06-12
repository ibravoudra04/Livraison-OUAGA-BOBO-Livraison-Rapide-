import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});

// 1. Aucun compte ZZ / AUDIT / 0900000x résiduel
const {data:users}=await admin.auth.admin.listUsers({perPage:1000});
const zz=users.users.filter(u=>/ZZ |AUDIT|2260900000|2260900001/i.test((u.user_metadata?.name||'')+u.email));
console.log('Comptes de test résiduels (ZZ/AUDIT/0900000x):', zz.length, zz.map(u=>u.email));

// 2. avis de test supprimé
const {count:avisCount}=await admin.from('avis').select('*',{count:'exact',head:true});
console.log('Lignes dans avis:', avisCount, '(doit être 0)');

// 3. compte admin intact
const adminU=users.users.find(u=>u.email==='admin@livraison.com');
console.log('Compte admin@livraison.com:', adminU? ('OK, app_role='+adminU.app_metadata?.role) : 'ABSENT ❌');

// 4. fichiers storage identities résiduels des comptes test
const testDrivers=['adc2975f-fa07-4be2-9ee6-9a8897d5cc71'];
for(const d of testDrivers){ const {data}=await admin.storage.from('identities').list(d); if(data&&data.length) console.log('RESTE storage pour',d,':',data.length); }
console.log('Vérification storage terminée.');

// 5. état final des tables
for(const t of ['clients_livraison','livreurs','chats_livraison','avis','paiements']){
  const {count}=await admin.from(t).select('*',{count:'exact',head:true});
  console.log('  ',t,':',count);
}
