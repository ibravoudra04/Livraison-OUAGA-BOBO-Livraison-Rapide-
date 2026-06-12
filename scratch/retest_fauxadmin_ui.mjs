import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};

// Créer un faux admin (user_metadata.role=admin SEULEMENT, pas app_metadata)
const EMAIL='22609000011@livraison.com', PWD='1234_secure_pad';
const {data:list}=await admin.auth.admin.listUsers({perPage:1000});
let ex=list.users.find(u=>u.email===EMAIL); if(ex) await admin.auth.admin.deleteUser(ex.id);
const {data:cre}=await admin.auth.admin.createUser({email:EMAIL,password:PWD,email_confirm:true,
  user_metadata:{role:'admin',name:'ZZ FauxAdmin UI',phone:'+226 09 00 00 11'}});
acc.ids.push(cre.user.id); acc.emails.push(EMAIL); acc.fauxAdminUiId=cre.user.id; fs.writeFileSync('scratch/test_accounts.json',JSON.stringify(acc,null,2));

const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000011');
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(5000);
await page.screenshot({path:SHOT+'F8_fauxadmin_ui.png'});
const adminUI = await page.locator('text=/Espace Administration/i').count();
ok('B1 frontend - Faux admin NE voit PAS le tableau de bord admin', adminUI===0);
console.log('   (le faux admin est traité comme client : '+(await page.locator('text=/Compte Gratuit|Mon Compte Client|connecter/i').count()>0?'oui':'autre')+')');
await browser.close();
console.log('\n=== RESUME FAUX ADMIN UI ===\n'+R.join('\n'));
