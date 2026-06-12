import { chromium } from 'playwright';
import fs from 'fs';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const acc = JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser = await chromium.launch({ channel:'msedge', headless:true });
const ctx = await browser.newContext({ viewport:{width:390,height:844},
  geolocation:{ latitude: acc.driverLat, longitude: acc.driverLng }, permissions:['geolocation'] });
await ctx.addInitScript(()=>{ try{sessionStorage.setItem('hasPaidMapService','true');}catch(e){} });
const page = await ctx.newPage();
const logs=[]; page.on('console',m=>logs.push(`[${m.type()}] ${m.text()}`)); page.on('pageerror',e=>logs.push(`[ERR] ${e.message}`));

await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);

// --- 1. Connexion : mauvais PIN ---
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(1000);
await page.locator('#auth-drawer input[type="tel"]').fill('09000001');
await page.locator('#auth-drawer input[type="password"]').fill('9999');
await page.locator('#auth-drawer button:has-text("Se connecter")').click();
await page.waitForTimeout(2500);
const errShown = await page.locator('text=/incorrect/i').count();
ok('Mauvais PIN => message d erreur', errShown>0);
await page.screenshot({ path: SHOT+'09_client_mauvais_pin.png' });

// --- 2. Connexion : bon PIN ---
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click();
await page.waitForTimeout(3500);
const dash = await page.locator('text=/Mon Compte Client|Espace Client|Compte Gratuit/i').count();
ok('Connexion client OK => tableau de bord', dash>0);
await page.screenshot({ path: SHOT+'10_client_dashboard.png' });

// --- 3. Premium : ouvrir l'écran (sans payer) ---
const premiumBtn = page.locator('text=/Passer Premium/i').first();
if (await premiumBtn.count()>0){
  await premiumBtn.click(); await page.waitForTimeout(2000);
  const payScreen = await page.locator('text=/Paiement Sécurisé|réseau|Orange/i').count();
  ok('Ecran paiement Premium s ouvre', payScreen>0);
  await page.screenshot({ path: SHOT+'11_client_premium_paiement.png' });
  // Fermer sans payer
  await page.locator('button:has-text("Retour")').first().click().catch(()=>{});
  await page.waitForTimeout(1000);
} else ok('Bouton Premium present', false);

// Fermer le drawer client pour revenir à la carte
await page.locator('button:has-text("Se déconnecter")').count(); // juste pour info
await page.keyboard.press('Escape').catch(()=>{});
// rechercher le bouton de fermeture du drawer
const closeX = page.locator('.drawer-close, [aria-label="Fermer"]').first();
await closeX.click().catch(()=>{});
await page.waitForTimeout(1500);

console.log('\n--- ERREURS JS ---');
console.log(logs.filter(l=>/\[ERR\]|error/i.test(l)).slice(0,8).join('\n')||'aucune');
fs.writeFileSync('scratch/_client_logs.txt', logs.join('\n'));
await browser.close();
console.log('\n=== RESUME CLIENT (partie 1) ===\n'+R.join('\n'));
