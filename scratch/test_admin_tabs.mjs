import { chromium } from 'playwright';
import fs from 'fs';
const BASE='http://localhost:3000', SHOT='audit_screenshots/';
const R=[]; const ok=(n,c)=>{R.push(`${c?'✅':'❌'} ${n}`);console.log(`${c?'✅':'❌'} ${n}`);};
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await (await browser.newContext({viewport:{width:390,height:844}})).newPage();
await page.goto(BASE,{waitUntil:'networkidle',timeout:60000}); await page.waitForTimeout(1500);
await page.locator('button:has-text("Se connecter")').first().click(); await page.waitForTimeout(900);
await page.locator('#auth-drawer input[type="tel"]').fill('09000009');
await page.locator('#auth-drawer input[type="password"]').fill('1234');
await page.locator('#auth-drawer button:has-text("Se connecter")').click(); await page.waitForTimeout(5000);
await page.setViewportSize({width:1280,height:900}); await page.waitForTimeout(1500);

async function backToOverview(){
  for(let i=0;i<4;i++){
    if(await page.locator('text=Configuration & Tarifs').count()>0) break;
    await page.locator('button:has-text("Retour")').first().click().catch(()=>{}); await page.waitForTimeout(700);
  }
}
async function openTab(label,shot){ await backToOverview(); await page.locator('text='+label).first().click(); await page.waitForTimeout(2000); await page.screenshot({path:SHOT+shot}); }

await openTab('Statistiques Plateforme','29_admin_stats.png');
ok('Statistiques: revenus/métriques', await page.locator('text=/Revenus Confirmés|Revenus Théoriques|Déblocages/i').count()>0);
await openTab('Litiges & Support','30_admin_litiges.png');
ok('Litiges affiché', await page.locator('text=/Litige|Aucun|ouvert|signal/i').count()>0);
await openTab('Analytiques Journalières','31_admin_analytics.png');
ok('Analytiques 14j', await page.locator('text=/14 derniers jours|Activité quotidienne|Ouagadougou/i').count()>0);
await openTab('Reçus de Paiement','32_admin_paiements.png');
ok('Reçus paiement', await page.locator('text=/Reçu|VALIDE|PP260|Aucun|montant/i').count()>0);
await browser.close();
console.log('\n=== RESUME ADMIN TABS ===\n'+R.join('\n'));
