import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));

console.log('=== AVANT nettoyage ===');
for(const t of ['clients_livraison','livreurs','chats_livraison']){
  const {count}=await admin.from(t).select('*',{count:'exact',head:true});
  console.log(t,':',count);
}

// 1. Supprimer les fichiers storage uploadés (identities) des livreurs de test
const driverIds=[acc.driverId, acc.uiDriverId].filter(Boolean);
for(const did of driverIds){
  const {data:files}=await admin.storage.from('identities').list(did);
  if(files && files.length){
    const paths=files.map(f=>`${did}/${f.name}`);
    const {error}=await admin.storage.from('identities').remove(paths);
    console.log('Storage identities supprimés pour',did.substring(0,8),':',error?error.message:paths.length+' fichiers');
  }
}

// 2. Supprimer tous les comptes de test (cascade -> profils, chats, tickets, deblocages, push)
const allIds=[...new Set(acc.ids)];
console.log('\nSuppression de',allIds.length,'comptes de test...');
for(const id of allIds){
  const {error}=await admin.auth.admin.deleteUser(id);
  console.log(' -',id.substring(0,8),error?('ERREUR: '+error.message):'supprimé');
}

// 3. Vérifier qu'il ne reste aucune trace "ZZ ... AUDIT" ni numéros 0900000x
const {data:cliLeft}=await admin.from('clients_livraison').select('id,name,phone').like('phone','%09 00 00%');
const {data:drvLeft}=await admin.from('livreurs').select('id,name,phone').or('name.ilike.%AUDIT%,phone.like.%09 00 00%');
const {data:chatLeft}=await admin.from('chats_livraison').select('id,text').ilike('text','%TEST audit%');
console.log('\n=== APRÈS nettoyage : restes éventuels ===');
console.log('Clients test restants :', (cliLeft||[]).length, JSON.stringify(cliLeft||[]));
console.log('Livreurs test restants:', (drvLeft||[]).length, JSON.stringify(drvLeft||[]));
console.log('Messages test restants:', (chatLeft||[]).length);

console.log('\n=== Comptes restants par table ===');
for(const t of ['clients_livraison','livreurs','chats_livraison']){
  const {count}=await admin.from(t).select('*',{count:'exact',head:true});
  console.log(t,':',count);
}

// Vérifier que le parasite 22667370909 (client) existait avant — NE PAS le supprimer (pas créé par nous)
console.log('\nNote: compte parasite 22667370909@livraison.com (client) NON supprimé (préexistant, pas une donnée de test).');
