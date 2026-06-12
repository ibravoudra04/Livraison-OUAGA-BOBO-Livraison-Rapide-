import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});

const {data:all,error}=await admin.from('push_subscriptions').select('id,user_id,subscription,created_at').order('created_at',{ascending:false});
if(error){ console.log('Erreur:',error.message); process.exit(1); }
console.log('Total abonnements push avant:', all.length);

// Dédoublonnage : garder le plus récent par (user_id + endpoint)
const seen=new Set(); const toDelete=[]; let noEndpoint=0;
for(const row of all){
  let endpoint=null;
  try{ endpoint = typeof row.subscription==='string'? JSON.parse(row.subscription).endpoint : row.subscription?.endpoint; }catch(e){}
  if(!endpoint){ noEndpoint++; continue; } // on ne touche pas aux lignes illisibles
  const key=row.user_id+'|'+endpoint;
  if(seen.has(key)) toDelete.push(row.id); else seen.add(key);
}
console.log('Endpoints uniques (user+device):', seen.size, '| doublons à supprimer:', toDelete.length, '| illisibles laissés:', noEndpoint);

// Supprimer par lots
let deleted=0;
for(let i=0;i<toDelete.length;i+=100){
  const batch=toDelete.slice(i,i+100);
  const {error:de}=await admin.from('push_subscriptions').delete().in('id',batch);
  if(de){ console.log('Erreur suppression lot:',de.message); break; }
  deleted+=batch.length;
}
console.log('Doublons supprimés:', deleted);
const {count}=await admin.from('push_subscriptions').select('*',{count:'exact',head:true});
console.log('Total abonnements push après:', count);
