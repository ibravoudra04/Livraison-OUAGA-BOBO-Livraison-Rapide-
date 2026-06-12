import { chromium } from 'playwright';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844}});
await ctx.addInitScript(()=>{try{sessionStorage.setItem('hasPaidMapService','true');}catch(e){}});
const page=await ctx.newPage();
const logs=[]; page.on('console',m=>logs.push(m.text())); page.on('pageerror',e=>logs.push('ERR '+e.message));

await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1200);
await page.click('#portal-btn-find'); await page.waitForTimeout(900);
await page.locator('.loc-city-card',{hasText:'Ouagadougou'}).click(); await page.waitForTimeout(600);
await page.locator('.loc-option-btn-card',{hasText:'Voir la carte'}).click(); await page.waitForTimeout(3000);

// Exposer le centre de la carte Leaflet pour le test
async function getCenter(){
  return await page.evaluate(()=>{
    // Leaflet stocke l'instance sur le conteneur ._leaflet_map dans certaines versions ;
    // sinon on lit la transform du pane pour détecter un mouvement.
    const pane=document.querySelector('.leaflet-map-pane');
    return pane ? pane.style.transform : 'none';
  });
}
const nbMarkersBefore = await page.locator('.custom-driver-dot').count();
ok('Marqueurs rendus sur la carte', nbMarkersBefore>0);
console.log('   marqueurs visibles (viewport):', nbMarkersBefore);

// Déplacer la carte par glisser (drag) au centre de l'écran
const box = { x: 195, y: 420 };
await page.mouse.move(box.x, box.y);
await page.mouse.down();
await page.mouse.move(box.x-120, box.y-160, {steps:10});
await page.mouse.up();
await page.waitForTimeout(800);
const transformAfterPan = await getCenter();
await page.screenshot({path:SHOT+'P1_apres_deplacement.png'});

// Attendre 3.5s (le temps que d'éventuels re-rendus se produisent)
await page.waitForTimeout(3500);
const transformAfterWait = await getCenter();
await page.screenshot({path:SHOT+'P2_apres_attente.png'});

ok('La carte NE revient PAS en arrière après déplacement', transformAfterPan===transformAfterWait);
console.log('   transform après pan :', transformAfterPan);
console.log('   transform après 3.5s:', transformAfterWait);

const nbMarkersAfter = await page.locator('.custom-driver-dot').count();
console.log('   marqueurs après déplacement:', nbMarkersAfter);

console.log('\n--- ERREURS JS ---\n'+logs.filter(l=>/ERR|error/i.test(l)).slice(0,6).join('\n'));
await browser.close();
console.log('\n=== RESUME CARTE/PERF ===\n'+R.join('\n'));
