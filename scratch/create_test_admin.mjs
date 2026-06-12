import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const email='22609000009@livraison.com', pwd='1234_secure_pad';
// Créer via admin API avec les 2 métadonnées admin
const {data,error}=await admin.auth.admin.createUser({
  email, password: pwd, email_confirm:true,
  user_metadata:{ role:'admin', name:'ZZ Admin Test AUDIT', phone:'+226 09 00 00 09' },
  app_metadata:{ role:'admin' }
});
if(error){ console.log('Erreur création admin test:', error.message); process.exit(1); }
console.log('Admin test créé:', data.user.id, email);
acc.adminTestId=data.user.id; acc.adminTestEmail=email;
if(!acc.ids.includes(data.user.id)){ acc.ids.push(data.user.id); acc.emails.push(email); }
fs.writeFileSync('scratch/test_accounts.json',JSON.stringify(acc,null,2));
