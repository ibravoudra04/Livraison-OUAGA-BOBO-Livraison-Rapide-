import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const PHONE='09000005', EMAIL='22609000005@livraison.com';
const {data:list}=await admin.auth.admin.listUsers({perPage:1000});
const ex=list.users.find(u=>u.email===EMAIL); if(ex){ await admin.auth.admin.deleteUser(ex.id); console.log('ancien compte test supprimé'); }

const page=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('text=/Créer un compte client/i').click({force:true}); await page.waitForTimeout(1800);
await page.screenshot({path:SHOT+'F3_form_inscription_client.png'});
const form = await page.locator('#client-register-panel').count();
ok('B2 - Formulaire inscription client affiché', form>0);
if(form>0){
  await page.locator('#client-register-panel input[type="text"]').first().fill('ZZ Client UI AUDIT');
  await page.locator('#client-register-panel input[type="tel"]').fill(PHONE);
  await page.locator('#client-register-panel input[type="password"]').fill('1234');
  await page.locator('#client-register-panel button[type="submit"]').click();
  await page.waitForTimeout(4500);
  await page.screenshot({path:SHOT+'F4_client_inscrit.png'});
  const {data:list2}=await admin.auth.admin.listUsers({perPage:1000});
  const created=list2.users.find(u=>u.email===EMAIL);
  ok('B2 - Compte client créé en base via UI', !!created);
  if(created){
    const {data:prof}=await admin.from('clients_livraison').select('name,phone').eq('id',created.id).maybeSingle();
    ok('B2 - Profil client créé par le trigger', !!prof);
    console.log('   profil:', JSON.stringify(prof));
    acc.ids.push(created.id); acc.emails.push(EMAIL); acc.uiClientId=created.id; fs.writeFileSync('scratch/test_accounts.json',JSON.stringify(acc,null,2));
    // le dashboard client doit s'afficher après inscription
    ok('B2 - Tableau de bord client affiché après inscription', await page.locator('text=/Compte Gratuit|Mon Compte Client/i').count()>0);
  }
}
await browser.close();
console.log('\n=== RESUME INSCRIPTION CLIENT ===\n'+R.join('\n'));
