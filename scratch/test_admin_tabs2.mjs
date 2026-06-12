import { chromium } from 'playwright';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await (await browser.newContext({viewport:{width:1280,height:900}})).newPage();
// login admin (desktop: fermer welcome via Lancer la recherche n'est pas nécessaire; on clique le header)
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
// au format desktop, le bouton header "Se connecter" ouvre le drawer; le welcome portal intercepte -> on réduit d'abord
await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(500);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000009');
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(5000);
await page.setViewportSize({width:1280,height:900}); await page.waitForTimeout(1500);

const tabs=[
  ['Litiges & Support','30_admin_litiges.png',/Litige|Aucun|ouvert|Support/i],
  ['Analytiques Journalières','31_admin_analytics.png',/14 derniers jours|Activité|Ouagadougou/i],
  ['Reçus de Paiement','32_admin_paiements.png',/Reçu|VALIDE|PP260|Aucun|montant/i],
  ['Configuration & Tarifs','33_admin_config.png',/Tarifs|Annonce|Notification Push/i],
];
for(const [label,shot,rx] of tabs){
  // s'assurer d'être sur la vue globale
  for(let i=0;i<3;i++){ if(await page.locator('text=Configuration & Tarifs').count()>0) break; await page.locator('button:has-text("Retour")').first().click().catch(()=>{}); await page.waitForTimeout(600); }
  await page.locator('text='+label).first().click(); await page.waitForTimeout(2000);
  await page.screenshot({path:SHOT+shot});
  ok('Onglet "'+label+'"', await page.locator('text='+rx.source.split('|')[0]).count()>0 || (await page.locator('body').innerText()).match(rx)!=null);
}
await browser.close();
console.log('\n=== RESUME ADMIN TABS ===\n'+R.join('\n'));
