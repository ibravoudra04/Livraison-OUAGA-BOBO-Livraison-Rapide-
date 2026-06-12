import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
await page.goto('https://example.com', { timeout: 30000 });
console.log('example.com ->', await page.title());
const page2 = await browser.newPage();
await page2.goto('https://vercel.com', { timeout: 30000 }).catch(e => console.log('vercel err'));
console.log('vercel.com ->', await page2.title());
await browser.close();
