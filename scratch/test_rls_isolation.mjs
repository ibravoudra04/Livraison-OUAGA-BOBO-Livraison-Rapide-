import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const url=g('NEXT_PUBLIC_SUPABASE_URL'), anon=g('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const admin=createClient(url,g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};

// Connexion en tant que CLIENT de test
const cli=createClient(url,anon,{auth:{persistSession:false}});
await cli.auth.signInWithPassword({email:acc.cEmail,password:acc.PIN+'_secure_pad'});
console.log('=== Client de test connecté ('+acc.clientId.substring(0,8)+') ===');

// 1. Lire les profils des AUTRES clients
const {data:otherClients}=await cli.from('clients_livraison').select('id,name,phone');
ok('Client ne voit QUE son profil (clients_livraison)', (otherClients||[]).length<=1 && (otherClients||[]).every(c=>c.id===acc.clientId));
console.log('   lignes clients visibles:', (otherClients||[]).length);

// 2. Lire la table livreurs BRUTE (numéros非masqués)
const {data:rawLiv}=await cli.from('livreurs').select('id,phone');
ok('Client ne peut PAS lire la table livreurs brute', (rawLiv||[]).length===0);
console.log('   lignes livreurs brutes visibles:', (rawLiv||[]).length);

// 3. Lire TOUS les paiements
const {data:pays}=await cli.from('paiements').select('*');
ok('Client ne voit pas les paiements des autres', (pays||[]).length===0 || (pays||[]).every(p=>p.client_id===acc.clientId));
console.log('   paiements visibles:', (pays||[]).length);

// 4. Lire les chats d'AUTRES personnes (ex: un vrai client<->livreur)
const {data:allChats}=await cli.from('chats_livraison').select('*');
const foreignChats=(allChats||[]).filter(c=>c.client_id!==acc.clientId && c.rider_id!==acc.clientId);
ok('Client ne voit pas les chats des autres', foreignChats.length===0);
console.log('   chats étrangers visibles:', foreignChats.length, '/ total visibles:', (allChats||[]).length);

// 5. Lire les push_subscriptions de tout le monde
const {data:pushAll}=await cli.from('push_subscriptions').select('*');
const foreignPush=(pushAll||[]).filter(p=>p.user_id!==acc.clientId);
ok('Client ne voit pas les push des autres', foreignPush.length===0);
console.log('   push étrangers visibles:', foreignPush.length);

// 6. ESCALADE : modifier le profil d'un AUTRE livreur (ex: vrai livreur)
const {data:someDriver}=await admin.from('livreurs').select('id').neq('id',acc.driverId).limit(1).maybeSingle();
if(someDriver){
  const {error:upErr,count}=await cli.from('livreurs').update({status:'suspendu'}).eq('id',someDriver.id);
  // vérifier que rien n'a changé
  const {data:after}=await admin.from('livreurs').select('status').eq('id',someDriver.id).maybeSingle();
  ok('Client ne peut PAS modifier un livreur', after.status!=='suspendu' || upErr!=null);
  console.log('   statut après tentative:', after?.status, '| err:', upErr?.message||'aucune (mais 0 ligne affectée)');
}
await cli.auth.signOut();

// 7. FAILLE SOUPÇONNÉE : faux admin via user_metadata uniquement
console.log('\n=== Test faux admin (user_metadata.role=admin SANS app_metadata) ===');
const fakeEmail='22609000010@livraison.com', fakePwd='1234_secure_pad';
let fakeId;
{ const {data,error}=await admin.auth.admin.createUser({ email:fakeEmail,password:fakePwd,email_confirm:true,
    user_metadata:{role:'admin',name:'ZZ FauxAdmin',phone:'+226 09 00 00 10'} });
  if(error){console.log('création faux admin:',error.message);} else {fakeId=data.user.id; acc.ids.push(fakeId); acc.emails.push(fakeEmail); acc.fakeAdminId=fakeId; fs.writeFileSync('scratch/test_accounts.json',JSON.stringify(acc,null,2));}
}
const fake=createClient(url,anon,{auth:{persistSession:false}});
await fake.auth.signInWithPassword({email:fakeEmail,password:fakePwd});
const {data:fakeClients}=await fake.from('clients_livraison').select('id');
ok('Faux admin NE lit PAS tous les clients (RLS app_metadata OK)', (fakeClients||[]).length<=1);
console.log('   clients visibles par faux admin:', (fakeClients||[]).length);
const {data:fakeLiv}=await fake.from('livreurs').select('id');
ok('Faux admin NE lit PAS la table livreurs', (fakeLiv||[]).length===0);
const {data:fakePush}=await fake.from('push_subscriptions').select('*');
const leak=(fakePush||[]).filter(p=>p.user_id!==fakeId);
ok('Faux admin NE lit PAS les push des autres (sinon FAILLE)', leak.length===0);
console.log('   >>> push étrangers lus par faux admin:', leak.length, leak.length>0?'⚠️ FAILLE CONFIRMÉE':'(ok)');
await fake.auth.signOut();

console.log('\n=== RESUME RLS ===\n'+R.join('\n'));
