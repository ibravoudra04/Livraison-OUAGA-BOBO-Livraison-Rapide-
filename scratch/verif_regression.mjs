import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const url=g('NEXT_PUBLIC_SUPABASE_URL'), anon=g('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const admin=createClient(url,g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const ids=[];

// 1) ANON : la carte (livreurs_view) doit rester lisible
const pub=createClient(url,anon,{auth:{persistSession:false}});
const {data:vmap,error:ve}=await pub.from('livreurs_view').select('name,phone_display,city,status').in('status',['actif','approved']);
ok('Carte publique : anon lit livreurs_view', !ve && (vmap||[]).length>0);
console.log('   livreurs visibles sur la carte:', (vmap||[]).length);

// 2) Créer client + livreur de test
const fmt=d=>'+226 '+d.match(/.{1,2}/g).join(' ');
async function mk(role, phone, extra){ const email=phone.replace(/\s+/g,'').replace('+','')+'@livraison.com';
  const c=createClient(url,anon,{auth:{persistSession:false}});
  const {data,error}=await c.auth.signUp({email,password:'1234_secure_pad',options:{data:{role,phone,name:'ZZ Reg '+role,...extra}}});
  if(error&&!/already/i.test(error.message)) console.log(role+' signUp err:',error.message);
  return {c, id:data?.user?.id, email};
}
const cli=await mk('client', fmt('09000051'), {});
const drv=await mk('rider', fmt('09000052'), {vehicle:'Moto',lat:12.4,lng:-1.45,initial:'Z',city:'ouaga',status:'actif'});
await new Promise(r=>setTimeout(r,1500));
if(cli.id) ids.push(cli.id); if(drv.id) ids.push(drv.id);
await admin.from('livreurs').update({status:'actif'}).eq('id',drv.id);

// 3) CLIENT lit son propre profil
const {data:own}=await cli.c.from('clients_livraison').select('*').eq('id',cli.id);
ok('Client lit son propre profil', (own||[]).length===1);

// 4) CLIENT insère un chat (participant)
const {error:chatErr}=await cli.c.from('chats_livraison').insert({rider_id:drv.id,client_id:cli.id,sender:'client',text:'reg test',time:'00:00'});
ok('Client peut envoyer un message (chat)', !chatErr);
if(chatErr) console.log('   chat err:', chatErr.message);

// 5) CLIENT poste un avis (période gratuite)
const {error:avisErr}=await cli.c.from('avis').insert({client_id:cli.id,rider_id:drv.id,stars:5,text:'reg avis'});
ok('Client peut poster un avis', !avisErr);
if(avisErr) console.log('   avis err:', avisErr.message);

// 6) CLIENT NE lit PAS le profil d'un autre client (isolation maintenue)
const {data:others}=await cli.c.from('clients_livraison').select('id');
ok('Isolation : client ne voit que lui-même', (others||[]).length===1);

await cli.c.auth.signOut(); await drv.c.auth.signOut();

// Nettoyage
for(const id of ids){ await admin.auth.admin.deleteUser(id); }
console.log('\nComptes de test régression supprimés.');
const allOk=R.every(l=>l.startsWith('✅'));
console.log('\n=== RESUME REGRESSION ===\n'+R.join('\n'));
console.log(allOk?'\n✅ Aucune régression : les usagers normaux fonctionnent.':'\n⚠️ Régression détectée.');
