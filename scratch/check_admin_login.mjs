import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const url=g('NEXT_PUBLIC_SUPABASE_URL'), anon=g('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const admin=createClient(url,g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});

// Lister les comptes "admin"
const {data}=await admin.auth.admin.listUsers({perPage:1000});
const admins = data.users.filter(u=>/admin|67370909/.test(u.email||'') || u.app_metadata?.role==='admin');
console.log('Comptes admin/admin-like:');
for(const u of admins){ console.log(' -', u.email, '| app_role:', u.app_metadata?.role, '| user_role:', u.user_metadata?.role); }

// Tester les 2 hypothèses de connexion du code AuthDrawer
async function tryLogin(email, pwd){
  const c=createClient(url,anon,{auth:{persistSession:false}});
  const {data,error}=await c.auth.signInWithPassword({email,password:pwd});
  return error? 'ECHEC: '+error.message : 'OK (role app='+data.user.app_metadata?.role+')';
}
console.log('\nTest connexion admin@livraison.com / admin_secure_password_123 :', await tryLogin('admin@livraison.com','admin_secure_password_123'));
console.log('Test connexion 67370909@livraison.com / 1234 :', await tryLogin('67370909@livraison.com','1234'));
console.log('Test connexion 67370909@livraison.com / 1234_secure_pad :', await tryLogin('67370909@livraison.com','1234_secure_pad'));
