import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('https://livraisonrapide.app', { waitUntil: 'networkidle', timeout: 60000 });
await page.screenshot({ path: 'audit_screenshots/00_accueil.png' });
console.log('Titre:', await page.title());
console.log('OK - capture audit_screenshots/00_accueil.png');
await browser.close();
