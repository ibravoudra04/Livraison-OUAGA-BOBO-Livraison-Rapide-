import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
await page.goto('https://www.google.com', { timeout: 30000 });
console.log('google ->', await page.title());
await page.goto('https://livraisonrapide.app', { timeout: 60000 });
await page.waitForTimeout(3000);
console.log('livraisonrapide ->', await page.title());
// Si page Kaspersky, ouvrir les détails
const details = page.locator('text=Afficher les détails');
if (await details.count() > 0) {
  await details.first().click();
  await page.waitForTimeout(1000);
  console.log('--- Texte de la page de blocage ---');
  console.log((await page.innerText('body')).substring(0, 1500));
}
await page.screenshot({ path: 'audit_screenshots/00b_blocage_details.png', fullPage: true });
await browser.close();
