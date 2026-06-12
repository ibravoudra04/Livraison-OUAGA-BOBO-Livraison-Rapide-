import { chromium } from 'playwright';
import fs from 'fs';
const BASE='http://localhost:3000';
const acc=JSON.parse(fs.readFileSync('scratch/test_accounts.json','utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},
  geolocation:{latitude:acc.driverLat,longitude:acc.driverLng},permissions:['geolocation']});
await ctx.addInitScript(()=>{try{sessionStorage.setItem('hasPaidMapService','true');}catch(e){}});
const page=await ctx.newPage();
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1200);
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
await page.locator('text=/\(0 avis\)/').click(); await page.waitForTimeout(1500);

const info = await page.evaluate(()=>{
  const m=document.getElementById('reviews-modal');
  if(!m) return {exists:false};
  const cs=getComputedStyle(m);
  const card=m.querySelector('.payment-card');
  const cb=card?.getBoundingClientRect();
  // élément réellement au centre de l'écran
  const cx=window.innerWidth/2, cy=window.innerHeight/2;
  const top=document.elementFromPoint(cx,cy);
  return { exists:true, display:cs.display, zIndex:cs.zIndex, opacity:cs.opacity,
    cardBox: cb?{x:Math.round(cb.x),y:Math.round(cb.y),w:Math.round(cb.width),h:Math.round(cb.height)}:null,
    topElementAtCenter: top? (top.id||top.className||top.tagName):null };
});
console.log(JSON.stringify(info,null,2));
await browser.close();
