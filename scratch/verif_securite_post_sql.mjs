import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const url=g('NEXT_PUBLIC_SUPABASE_URL'), anon=g('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const admin=createClient(url,g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};

const EMAIL='22609000099@livraison.com', PWD='1234_secure_pad';
const {data:list}=await admin.auth.admin.listUsers({perPage:1000});
const ex=list.users.find(u=>u.email===EMAIL); if(ex) await admin.auth.admin.deleteUser(ex.id);
const {data:cre}=await admin.auth.admin.createUser({email:EMAIL,password:PWD,email_confirm:true,
  user_metadata:{role:'admin',name:'ZZ Verif FauxAdmin',phone:'+226 09 00 00 99'}});
const fauxId=cre.user.id;

console.log('=== Le FAUX admin (user_metadata.role=admin) doit être BLOQUÉ ===');
const faux=createClient(url,anon,{auth:{persistSession:false}});
await faux.auth.signInWithPassword({email:EMAIL,password:PWD});

const {data:cl}=await faux.from('clients_livraison').select('id');
ok('Faux admin NE lit PAS tous les clients', (cl||[]).length<=1);
console.log('   clients visibles:', (cl||[]).length, '(doit être 0)');

const {data:lv}=await faux.from('livreurs').select('id,phone');
ok('Faux admin NE lit PAS la table livreurs (numéros bruts)', (lv||[]).length===0);
console.log('   livreurs bruts visibles:', (lv||[]).length, '(doit être 0)');

const {data:ch}=await faux.from('chats_livraison').select('*');
ok('Faux admin NE lit PAS les chats', (ch||[]).length===0);

const {data:tk}=await faux.from('tickets_support').select('*');
ok('Faux admin NE lit PAS les tickets', (tk||[]).length===0);

const {data:pu}=await faux.from('push_subscriptions').select('*');
const foreignPush=(pu||[]).filter(p=>p.user_id!==fauxId);
ok('Faux admin NE lit PAS les push des autres', foreignPush.length===0);
console.log('   push étrangers visibles:', foreignPush.length, '(doit être 0)');

// ÉCRITURE — test SÛR : capture, tente, restaure si jamais ça passe
const {data:realDrv}=await admin.from('livreurs').select('id,status').limit(1).maybeSingle();
const orig=realDrv.status;
await faux.from('livreurs').update({status: orig==='actif'?'suspendu':'actif'}).eq('id',realDrv.id);
const {data:after}=await admin.from('livreurs').select('status').eq('id',realDrv.id).maybeSingle();
const blocked = after.status===orig;
ok('Faux admin NE peut PAS modifier un livreur', blocked);
if(!blocked){ await admin.from('livreurs').update({status:orig}).eq('id',realDrv.id); console.log('   (statut restauré à',orig,')'); }
else console.log('   statut livreur réel inchangé:', after.status);

const {data:liv2}=await faux.from('livreurs_view').select('phone_display').limit(3);
console.log('   (via la vue publique, le faux admin voit les téléphones masqués/période gratuite — normal)');
await faux.auth.signOut();

console.log('\n=== Le VRAI admin (app_metadata) garde son accès ===');
const real=createClient(url,anon,{auth:{persistSession:false}});
const {error:le}=await real.auth.signInWithPassword({email:'admin@livraison.com',password:'LivraisonAdmin2026!'});
ok('Connexion vrai admin OK', !le);
const {data:rc}=await real.from('clients_livraison').select('id');
const {data:rl}=await real.from('livreurs').select('id');
ok('Vrai admin lit tous les clients', (rc||[]).length>=1);
ok('Vrai admin lit tous les livreurs', (rl||[]).length>=1);
console.log('   admin voit', (rc||[]).length,'clients et',(rl||[]).length,'livreurs');
await real.auth.signOut();

await admin.auth.admin.deleteUser(fauxId);
console.log('\nFaux admin temporaire supprimé.');
const allOk=R.every(l=>l.startsWith('✅'));
console.log('\n=== RESUME ===\n'+R.join('\n'));
console.log(allOk?'\n🎉 FAILLE FERMÉE et accès admin préservé.':'\n⚠️ Certains contrôles échouent encore.');
