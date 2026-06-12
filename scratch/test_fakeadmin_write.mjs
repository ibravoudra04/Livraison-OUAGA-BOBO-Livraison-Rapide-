import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const url=g('NEXT_PUBLIC_SUPABASE_URL'), anon=g('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const admin=createClient(url,g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?(c==='WARN'?'⚠️':'✅'):'❌'} ${n}`);console.log(`${c?(c==='WARN'?'⚠️':'✅'):'❌'} ${n}`);};

const fake=createClient(url,anon,{auth:{persistSession:false}});
await fake.auth.signInWithPassword({email:acc.fakeAdminEmail||'22609000010@livraison.com',password:'1234_secure_pad'});

// Test WRITE sur le LIVREUR DE TEST uniquement (acc.driverId)
const before='actif';
await admin.from('livreurs').update({status:before}).eq('id',acc.driverId);
const {error:upErr}=await fake.from('livreurs').update({status:'suspendu'}).eq('id',acc.driverId);
const {data:after}=await admin.from('livreurs').select('status,is_verified').eq('id',acc.driverId).maybeSingle();
const modified = after.status==='suspendu';
ok('Faux admin peut MODIFIER un livreur'+(modified?' (FAILLE ÉCRITURE)':' -> bloqué'), modified?'WARN':true);
console.log('   statut livreur test après écriture faux admin:', after.status, '| err:', upErr?.message||'aucune');
// remettre actif
await admin.from('livreurs').update({status:'actif'}).eq('id',acc.driverId);

// Test lecture chats / tickets / deblocages par faux admin
const {data:chats}=await fake.from('chats_livraison').select('*');
ok('Faux admin lit TOUS les chats'+(((chats||[]).length>0)?' (FAILLE)':''), ((chats||[]).length>0)?'WARN':true);
const {data:tickets}=await fake.from('tickets_support').select('*');
ok('Faux admin lit les tickets support'+(((tickets||[]).length>0)?' (FAILLE)':''), ((tickets||[]).length>0)?'WARN':true);
const {data:liv}=await fake.from('livreurs').select('phone').limit(3);
console.log('   Numéros bruts lus par faux admin (paywall contourné):', (liv||[]).map(x=>x.phone).join(', '));

await fake.auth.signOut();
console.log('\n=== RESUME ECRITURE FAUX ADMIN ===\n'+R.join('\n'));
