import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const MSG = 'Bonjour ceci est un message de TEST audit '+Date.now();

const browser=await chromium.launch({channel:'msedge',headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},
  geolocation:{latitude:acc.driverLat,longitude:acc.driverLng},permissions:['geolocation']});
await ctx.addInitScript(()=>{try{sessionStorage.setItem('hasPaidMapService','true');}catch(e){}});
const page=await ctx.newPage();
const logs=[]; page.on('console',m=>logs.push(m.text())); page.on('pageerror',e=>logs.push('ERR '+e.message));

// Connexion client
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000001');
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click();
await page.waitForTimeout(4000);

// Vérif erreur mauvais PIN (re-test rapide via 2e connexion fictive non nécessaire) -> on confirme dashboard
ok('Connexion client', await page.locator('text=/Mon Compte Client|Compte Gratuit/i').count()>0);

// Fermer le drawer client : recharger la page (session gardée)
await page.goto(BASE,{waitUntil:'networkidle'}); await page.waitForTimeout(1500);
// Aller à la carte
await page.click('#portal-btn-find'); await page.waitForTimeout(1000);
await page.locator('.loc-city-card',{hasText:'Ouagadougou'}).click(); await page.waitForTimeout(600);
await page.locator('.loc-option-btn-card',{hasText:'Voir la carte'}).click(); await page.waitForTimeout(2500);

// Positionner l'utilisateur (bouton locate) pour fixer userLocation sur le livreur test
await page.locator('#map-locate-btn').click().catch(()=>{}); await page.waitForTimeout(2500);
// Détecter le livreur le plus proche = livreur de test
await page.locator('text=Détecter un livreur').click(); await page.waitForTimeout(2500);
await page.screenshot({path:SHOT+'12_fiche_test_driver.png'});
const ficheName = await page.locator('text=/ZZ Test Livreur/i').count();
ok('Détecter ouvre la fiche du livreur de test', ficheName>0);

// Ouvrir le chat
await page.locator('text=/Discuter/').first().click(); await page.waitForTimeout(2000);
const chatOpen = await page.locator('text=/Discussion|Écrivez un message/i').count();
ok('Chat ouvert', chatOpen>0);
await page.screenshot({path:SHOT+'13_chat_ouvert.png'});

// Envoyer un message réel
await page.locator('input[placeholder="Écrivez un message..."]').fill(MSG);
await page.locator('form:has(input[placeholder="Écrivez un message..."]) button[type="submit"]').click();
await page.waitForTimeout(3000);
await page.screenshot({path:SHOT+'14_chat_message_envoye.png'});
const msgVisible = await page.locator(`text=${MSG.substring(0,30)}`).count();
ok('Message affiché dans le chat', msgVisible>0);

// VÉRIFICATION EN BASE
await new Promise(r=>setTimeout(r,1500));
const {data:dbMsg}=await admin.from('chats_livraison').select('*').eq('rider_id',acc.driverId).eq('client_id',acc.clientId).order('created_at',{ascending:false}).limit(5);
const found = (dbMsg||[]).find(m=>m.text===MSG);
ok('Message enregistré en base (chats_livraison)', !!found);
console.log('   Ligne DB:', found?JSON.stringify({sender:found.sender,text:found.text.substring(0,40),time:found.time}):'INTROUVABLE');

fs.writeFileSync('scratch/_client_chat_logs.txt',logs.join('\n'));
console.log('\n--- ERREURS JS ---\n'+logs.filter(l=>/ERR|error/i.test(l)).slice(0,8).join('\n'));
await browser.close();
console.log('\n=== RESUME CLIENT CHAT ===\n'+R.join('\n'));
