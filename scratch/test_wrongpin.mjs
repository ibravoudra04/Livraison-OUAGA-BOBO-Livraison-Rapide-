import { chromium } from 'playwright';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1200);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000001');
await page.locator('#auth-drawer input[type="password"]').fill('0000');
await page.locator('#auth-drawer button:has-text("Se connecter")').click();
// attendre la fin du chargement (bouton revient à "Se connecter")
await page.waitForFunction(()=>{const b=document.querySelector('#auth-drawer button.btn-primary');return b&&!b.textContent.includes('...');},{timeout:15000}).catch(()=>{});
await page.waitForTimeout(800);
const err = await page.locator('#auth-drawer >> text=/incorrect/i').count();
console.log(err>0?'✅ Mauvais PIN => message "incorrect" affiché':'❌ pas de message');
await page.screenshot({path:SHOT+'09_client_mauvais_pin.png'});

// Champs vides => HTML5 required bloque ?
await page.locator('#auth-drawer input[type="tel"]').fill('');
await page.locator('#auth-drawer input[type="password"]').fill('');
await page.locator('#auth-drawer button:has-text("Se connecter")').click();
await page.waitForTimeout(800);
const stillOpen = await page.locator('#auth-drawer').count();
console.log(stillOpen>0?'✅ Champs vides => formulaire bloque (required)':'❌');
await browser.close();
