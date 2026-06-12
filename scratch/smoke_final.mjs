import { chromium } from 'playwright';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844}});
await ctx.addInitScript(()=>{try{sessionStorage.setItem('hasPaidMapService','true');}catch(e){}});
const page=await ctx.newPage();
const errs=[]; page.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));

await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
ok('Page d accueil charge', (await page.title()).includes('Livraison'));
await page.click('#portal-btn-find'); await page.waitForTimeout(900);
ok('Portail localisation', await page.locator('.loc-city-card').count()>=2);
await page.locator('.loc-city-card',{hasText:'Ouagadougou'}).click(); await page.waitForTimeout(500);
await page.locator('.loc-option-btn-card',{hasText:'Voir la carte'}).click(); await page.waitForTimeout(3000);
const markers = await page.locator('.custom-driver-dot').count();
ok('Carte + marqueurs (viewport)', markers>0);
console.log('   marqueurs visibles:', markers);
ok('Compteur livreurs affiché', /\d+ livreurs/.test(await page.locator('#online-counter-text').textContent().catch(()=>'')));
await page.locator('text=Détecter un livreur').click(); await page.waitForTimeout(2000);
ok('Fiche livreur s ouvre', await page.locator('text=/Appeler|Discuter/').count()>0);
await page.screenshot({path:SHOT+'SMOKE_final.png'});

// erreurs JS critiques ?
const critical = errs.filter(e=>!/Images loaded lazily|favicon|manifest|404 \(\)/.test(e));
ok('Aucune erreur JS critique', critical.length===0);
if(critical.length) console.log('   erreurs:', critical.slice(0,5).join(' | '));
await browser.close();
console.log('\n=== SMOKE FINAL ===\n'+R.join('\n'));
