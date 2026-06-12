// Helpers partagés pour l'audit Playwright/Edge
import { chromium } from 'playwright';
export const BASE = 'http://localhost:3000';
export const SHOT = 'audit_screenshots/';

export async function newBrowser() {
  return chromium.launch({ channel: 'msedge', headless: true });
}
export async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts });
  const page = await ctx.newPage();
  page._logs = [];
  page.on('console', m => page._logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => page._logs.push(`[PAGEERROR] ${e.message}`));
  return page;
}
export function errLogs(page) {
  return page._logs.filter(l => /error|PAGEERROR/i.test(l));
}

// Va de l'accueil jusqu'à la carte d'une ville (ferme le portail localisation)
export async function gotoMap(page, city = 'Ouagadougou') {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.click('#portal-btn-find');
  await page.waitForTimeout(1200);
  await page.locator('.loc-city-card', { hasText: city }).click();
  await page.waitForTimeout(800);
  await page.locator('.loc-option-btn-card', { hasText: 'Voir la carte' }).click();
  await page.waitForTimeout(2500);
}
