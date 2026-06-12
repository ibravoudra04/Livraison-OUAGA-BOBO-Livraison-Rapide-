import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});

const EMAIL='admin@livraison.com';
const PASSWORD='LivraisonAdmin2026!'; // mot de passe admin — à communiquer au propriétaire

// existe déjà ?
const {data:list}=await admin.auth.admin.listUsers({perPage:1000});
const existing=list.users.find(u=>u.email===EMAIL);
if(existing){
  const {error}=await admin.auth.admin.updateUserById(existing.id,{
    password:PASSWORD, email_confirm:true,
    app_metadata:{role:'admin'}, user_metadata:{role:'admin',name:'Administrateur',phone:'+226 67 37 09 09'}
  });
  console.log(error?('Erreur maj: '+error.message):'Compte admin existant mis à jour: '+existing.id);
} else {
  const {data,error}=await admin.auth.admin.createUser({
    email:EMAIL, password:PASSWORD, email_confirm:true,
    app_metadata:{role:'admin'}, user_metadata:{role:'admin',name:'Administrateur',phone:'+226 67 37 09 09'}
  });
  console.log(error?('Erreur création: '+error.message):'Compte admin créé: '+data.user.id);
}
// Vérifier la connexion
const pub=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),{auth:{persistSession:false}});
const {data:login,error:le}=await pub.auth.signInWithPassword({email:EMAIL,password:PASSWORD});
console.log('Test connexion admin:', le?('ECHEC: '+le.message):('OK, app_role='+login.user.app_metadata?.role));
