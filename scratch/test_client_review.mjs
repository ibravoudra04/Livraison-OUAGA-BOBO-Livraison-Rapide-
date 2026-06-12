import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const env=fs.readFileSync('.env.local','utf8'); const g=k=>env.match(new RegExp(k+'=(.+)'))[1].trim().replace(/^['"]|['"]$/g,'');
const admin=createClient(g('NEXT_PUBLIC_SUPABASE_URL'),g('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};

const browser=await chromium.launch({channel:'msedge',headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},
  geolocation:{latitude:acc.driverLat,longitude:acc.driverLng},permissions:['geolocation']});
await ctx.addInitScript(()=>{try{sessionStorage.setItem('hasPaidMapService','true');}catch(e){}});
const page=await ctx.newPage();
const logs=[]; page.on('console',m=>logs.push(m.text())); page.on('pageerror',e=>logs.push('ERR '+e.message));

await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000001');
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(4000);
await page.goto(BASE,{waitUntil:'networkidle'}); await page.waitForTimeout(1500);
await page.click('#portal-btn-find'); await page.waitForTimeout(1000);
await page.locator('.loc-city-card',{hasText:'Ouagadougou'}).click(); await page.waitForTimeout(600);
await page.locator('.loc-option-btn-card',{hasText:'Voir la carte'}).click(); await page.waitForTimeout(2500);
await page.locator('#map-locate-btn').click().catch(()=>{}); await page.waitForTimeout(2500);
await page.locator('text=Détecter un livreur').click(); await page.waitForTimeout(2500);

// Ouvrir la modale en cliquant la ligne note/étoiles
await page.locator('text=/\(0 avis\)/').click();
await page.waitForSelector('#reviews-modal', { timeout: 8000 });
await page.waitForTimeout(800);
ok('Modale Avis ouverte', await page.locator('#reviews-modal').count()>0);
await page.screenshot({path:SHOT+'15_avis_modale.png'});

await page.locator('#reviews-modal button:has-text("Donner un avis")').click();
await page.waitForTimeout(800);
// 5 étoiles
const stars = page.locator('#reviews-modal svg[width="32"]');
ok('Formulaire avis affiché (étoiles)', await stars.count()>=5);
await stars.nth(4).click(); await page.waitForTimeout(400);
await page.locator('#reviews-modal textarea').fill('Avis de test audit');
await page.screenshot({path:SHOT+'16_avis_rempli.png'});
await page.locator('#reviews-modal button:has-text("Envoyer")').click();
await page.waitForTimeout(3500);
await page.screenshot({path:SHOT+'17_avis_resultat.png'});
const success = await page.locator('text=/Merci pour votre avis/i').count();
const errMsg = await page.locator('#reviews-modal >> text=/Erreur|ne pouvez|contactés/i').count();
console.log('   Succès affiché:', success, '| Message erreur affiché:', errMsg);
ok('Avis ECHOUE comme prévu (bug colonne rating/stars)', success===0);

await new Promise(r=>setTimeout(r,1000));
const {count}=await admin.from('avis').select('*',{count:'exact',head:true}).eq('rider_id',acc.driverId);
ok('Aucun avis en base (confirme le bug)', (count||0)===0);
console.log('   avis en base:', count);
console.log('\n--- LOGS pertinents ---\n'+logs.filter(l=>/avis|rating|stars|400|error|ERR/i.test(l)).slice(0,8).join('\n'));
await browser.close();
console.log('\n=== RESUME CLIENT AVIS ===\n'+R.join('\n'));
