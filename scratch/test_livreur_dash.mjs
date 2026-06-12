import { chromium } from 'playwright';
import fs from 'fs';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();
const logs=[]; page.on('console',m=>logs.push(m.text())); page.on('pageerror',e=>logs.push('ERR '+e.message));

await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
// Connexion livreur de test (09000002) — il est ACTIF et a reçu un message
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000002');
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(4500);
await page.screenshot({path:SHOT+'22_livreur_dashboard.png'});
ok('Connexion livreur => tableau de bord', await page.locator('text=/Mon Espace Livreur|Bonjour|Statut de votre compte/i').count()>0);

// Éléments du dashboard
ok('Statut du compte affiché', await page.locator('text=/Statut de votre compte/i').count()>0);
ok('Position GPS en direct affichée', await page.locator('text=/Position GPS en Direct/i').count()>0);
ok('Section Messages Clients présente', await page.locator('text=/Messages Clients/i').count()>0);

// La conversation du client de test doit apparaître
await page.waitForTimeout(1500);
const convo = await page.locator('text=/ZZ Test Client AUDIT|Client/i').count();
ok('Conversation reçue du client visible', convo>0);
await page.screenshot({path:SHOT+'23_livreur_messages.png'});

// Ouvrir la conversation et répondre
const convoBtn = page.locator('#driver-dash-chats-list button').first();
if(await convoBtn.count()>0){
  await convoBtn.click(); await page.waitForTimeout(2000);
  const chatOpen = await page.locator('text=/Écrivez un message/i').count();
  ok('Chat livreur->client ouvert', chatOpen>0);
  await page.screenshot({path:SHOT+'24_livreur_chat.png'});
  // Voir le message reçu du client
  const recu = await page.locator('text=/message de TEST audit/i').count();
  ok('Message du client visible côté livreur', recu>0);
}

console.log('\n--- ERREURS JS ---\n'+logs.filter(l=>/ERR|error/i.test(l)).slice(0,6).join('\n'));
await browser.close();
console.log('\n=== RESUME LIVREUR DASHBOARD ===\n'+R.join('\n'));
