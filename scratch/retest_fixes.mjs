import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});

// ===== TEST 1 : CONNEXION ADMIN (B4) =====
{
  const page=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();
  await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
  await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
  await page.locator('#auth-drawer input[type="tel"]').fill('67370909');
  await page.locator('#auth-drawer input[type="password"]').fill('LivraisonAdmin2026!');
  await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(5000);
  ok('B4 - Connexion admin (67370909 + nouveau mdp) ouvre Espace Administration', await page.locator('text=/Espace Administration/i').count()>0);
  await page.screenshot({path:SHOT+'F1_admin_login_ok.png'});
  await page.context().close();
}

// ===== TEST 2 : INSCRIPTION CLIENT VIA UI (B2) =====
{
  const newClientPhone='09000005';
  // nettoyer si existe
  const {data:list}=await admin.auth.admin.listUsers({perPage:1000});
  const ex=list.users.find(u=>u.email==='22609000005@livraison.com'); if(ex) await admin.auth.admin.deleteUser(ex.id);

  const page=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();
  await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
  await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
  const lien = page.locator('text=/Créer un compte client/i');
  ok('B2 - Lien "Créer un compte client" présent dans la connexion', await lien.count()>0);
  await page.screenshot({path:SHOT+'F2_lien_inscription_client.png'});
  if(await lien.count()>0){
    await lien.click(); await page.waitForTimeout(1500);
    // Le formulaire d'inscription client doit apparaître
    const form = await page.locator('text=/Créer mon compte Client|Nom Complet/i').count();
    ok('B2 - Formulaire inscription client affiché', form>0);
    await page.screenshot({path:SHOT+'F3_form_inscription_client.png'});
    if(form>0){
      await page.locator('#client-register-panel input[type="text"]').first().fill('ZZ Client UI AUDIT');
      await page.locator('#client-register-panel input[type="tel"]').fill(newClientPhone);
      await page.locator('#client-register-panel input[type="password"]').fill('1234');
      await page.locator('#client-register-panel button:has-text("Créer mon compte")').click();
      await page.waitForTimeout(4000);
      await page.screenshot({path:SHOT+'F4_client_inscrit.png'});
      // Vérif base
      const {data:list2}=await admin.auth.admin.listUsers({perPage:1000});
      const created=list2.users.find(u=>u.email==='22609000005@livraison.com');
      ok('B2 - Compte client créé en base via UI', !!created);
      if(created){ acc.ids.push(created.id); acc.emails.push('22609000005@livraison.com'); acc.uiClientId=created.id; fs.writeFileSync('scratch/test_accounts.json',JSON.stringify(acc,null,2)); 
        const {data:prof}=await admin.from('clients_livraison').select('name').eq('id',created.id).maybeSingle();
        console.log('   profil client:', JSON.stringify(prof));
      }
    }
  }
  await page.context().close();
}
await browser.close();
console.log('\n=== RESUME RE-TEST CORRECTIONS (1/2) ===\n'+R.join('\n'));
