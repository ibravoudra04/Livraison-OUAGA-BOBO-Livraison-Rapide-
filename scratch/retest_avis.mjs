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

// login client de test
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000001');
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(4000);
await page.goto(BASE,{waitUntil:'networkidle'}); await page.waitForTimeout(1500);
await page.click('#portal-btn-find'); await page.waitForTimeout(1000);
await page.locator('.loc-city-card',{hasText:'Ouagadougou'}).click(); await page.waitForTimeout(600);
await page.locator('.loc-option-btn-card',{hasText:'Voir la carte'}).click(); await page.waitForTimeout(2500);
await page.locator('#map-locate-btn').click().catch(()=>{}); await page.waitForTimeout(2000);
await page.locator('text=Détecter un livreur').click(); await page.waitForTimeout(2500);

// ouvrir la modale d'avis
await page.locator('text=/\(0 avis\)/').click(); await page.waitForTimeout(1500);
// vérifier la VISIBILITÉ réelle (opacity)
const vis = await page.evaluate(()=>{ const m=document.getElementById('reviews-modal'); if(!m) return {o:'absent'}; const cs=getComputedStyle(m); return {o:cs.opacity, pe:cs.pointerEvents}; });
console.log('   modale opacity:', JSON.stringify(vis));
ok('B3 - Fenêtre avis VISIBLE (opacity=1)', vis.o==='1');
await page.screenshot({path:SHOT+'F5_avis_visible.png'});

// donner un avis 5 étoiles
await page.locator('#reviews-modal button:has-text("Donner un avis")').click(); await page.waitForTimeout(800);
const stars=page.locator('#reviews-modal svg[width="32"]');
await stars.nth(4).click(); await page.waitForTimeout(400);
await page.locator('#reviews-modal textarea').fill('Excellent livreur (test audit)');
await page.screenshot({path:SHOT+'F6_avis_rempli.png'});
await page.locator('#reviews-modal button:has-text("Envoyer")').click(); await page.waitForTimeout(3500);
await page.screenshot({path:SHOT+'F7_avis_envoye.png'});
const success=await page.locator('text=/Merci pour votre avis/i').count();
ok('B3 - Avis envoyé avec succès', success>0);

// vérif base
await new Promise(r=>setTimeout(r,1000));
const {data:avis}=await admin.from('avis').select('stars,text,client_id,rider_id').eq('rider_id',acc.driverId).eq('client_id',acc.clientId);
const found=(avis||[])[0];
ok('B3 - Avis enregistré en base (colonne stars)', !!found && Number(found.stars)===5);
console.log('   avis en base:', JSON.stringify(found));

console.log('\n--- ERREURS JS ---\n'+logs.filter(l=>/ERR|error|400|stars|rating/i.test(l)).slice(0,6).join('\n'));
await browser.close();
console.log('\n=== RESUME AVIS ===\n'+R.join('\n'));
