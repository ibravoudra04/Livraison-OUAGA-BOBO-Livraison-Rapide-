import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});

const KEEP = new Set(['admin@livraison.com']); // ne JAMAIS supprimer le vrai admin
// Motifs de comptes de test : noms ZZ/AUDIT/Verif/FauxAdmin/Reg, e-mails de numéros de test 0900000x
const isTest = (u) => {
  if (KEEP.has(u.email)) return false;
  const name = (u.user_metadata?.name || '');
  const email = (u.email || '');
  return /\bZZ\b|AUDIT|Verif|FauxAdmin|ZZ Reg|Test/i.test(name)
      || /^226090000\d\d@livraison\.com$/.test(email)   // 22609000001..99
      || /^2260900\d{4}@livraison\.com$/.test(email);
};

const {data:list}=await admin.auth.admin.listUsers({perPage:1000});
const tests = list.users.filter(isTest);
console.log('Comptes de test détectés:', tests.length);
for(const u of tests) console.log('  -', u.email, '|', u.user_metadata?.name||'');

let deleted=0;
for(const u of tests){
  const {error}=await admin.auth.admin.deleteUser(u.id);
  if(error) console.log('  ECHEC suppression', u.email, ':', error.message);
  else deleted++;
}
console.log('\nSupprimés:', deleted, '/', tests.length);

// Nettoyer aussi d'éventuels fichiers storage orphelins des livreurs de test (dossiers = ids supprimés)
// (les ids supprimés sont déjà partis ; on liste les dossiers identities sans ligne livreur)
const {data:drivers}=await admin.from('livreurs').select('id');
const validIds=new Set((drivers||[]).map(d=>d.id));
const {data:folders}=await admin.storage.from('identities').list('', {limit:1000});
let orphanFiles=0;
for(const f of (folders||[])){
  if(f.id===null && !validIds.has(f.name)){ // dossier (pas un fichier) sans livreur correspondant
    const {data:inner}=await admin.storage.from('identities').list(f.name);
    if(inner && inner.length){ await admin.storage.from('identities').remove(inner.map(x=>`${f.name}/${x.name}`)); orphanFiles+=inner.length; }
  }
}
console.log('Fichiers identities orphelins supprimés:', orphanFiles);

// Vérif finale
console.log('\n=== ÉTAT FINAL ===');
const {data:list2}=await admin.auth.admin.listUsers({perPage:1000});
const residuel = list2.users.filter(isTest);
console.log('Comptes de test résiduels:', residuel.length, residuel.map(u=>u.email));
const adminU = list2.users.find(u=>u.email==='admin@livraison.com');
console.log('admin@livraison.com:', adminU?('OK app_role='+adminU.app_metadata?.role):'ABSENT ❌');
for(const t of ['clients_livraison','livreurs','chats_livraison','avis','paiements','push_subscriptions']){
  const {count}=await admin.from(t).select('*',{count:'exact',head:true}); console.log('  ',t,':',count);
}
const {count:susp}=await admin.from('livreurs').select('*',{count:'exact',head:true}).eq('status','suspendu');
console.log('   livreurs suspendu:', susp);
