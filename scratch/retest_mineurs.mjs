import { chromium } from 'playwright';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();
const logs=[]; page.on('console',m=>logs.push(m.text())); page.on('pageerror',e=>logs.push('ERR '+e.message));

// connexion admin
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('67370909');
await page.locator('#auth-drawer input[type="password"]').fill('LivraisonAdmin2026!');
await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(5000);
ok('Admin connecté', await page.locator('text=/Espace Administration/i').count()>0);
await page.setViewportSize({width:1280,height:900}); await page.waitForTimeout(1000);

// onglet Config & Tarifs
await page.locator('text=Configuration & Tarifs').first().click(); await page.waitForTimeout(2000);
await page.screenshot({path:SHOT+'G1_admin_tarifs.png'});
const honest = await page.locator('text=/contactez votre développeur/i').count();
const noFakeSave = await page.locator('button:has-text("Sauvegarder les modifications")').count();
ok('M3 - Tarifs en lecture seule (note développeur)', honest>0);
ok('M3 - Faux bouton "Sauvegarder" retiré', noFakeSave===0);
ok('M3 - Tarifs affichés (200/5000/500)', (await page.locator('text=/200 FCFA/').count())>0);

console.log('\n--- ERREURS JS ---\n'+logs.filter(l=>/ERR|error/i.test(l)).slice(0,6).join('\n'));
await browser.close();
console.log('\n=== RESUME MINEURS ===\n'+R.join('\n'));
