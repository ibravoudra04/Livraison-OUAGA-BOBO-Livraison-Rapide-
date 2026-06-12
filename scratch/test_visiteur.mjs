import { newBrowser, newPage, errLogs, BASE, SHOT } from './lib_audit.mjs';
const browser = await newBrowser();
const R = [];
const ok = (n, c) => { R.push(`${c?'✅':'❌'} ${n}`); console.log(`${c?'✅':'❌'} ${n}`); };

// --- A. Visiteur non payant : paywall ---
let page = await newPage(browser);
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
ok('Accueil charge', (await page.title()).includes('Livraison'));
await page.click('#portal-btn-find'); await page.waitForTimeout(1000);
ok('Portail localisation (2 villes)', await page.locator('.loc-city-card').count() >= 2);
const ouagaDesc = await page.locator('.loc-city-card', { hasText: 'Ouagadougou' }).locator('.city-desc').textContent().catch(()=>'?');
console.log('   Compteur portail Ouaga:', ouagaDesc);
await page.locator('.loc-city-card', { hasText: 'Ouagadougou' }).click(); await page.waitForTimeout(600);
await page.locator('.loc-option-btn-card', { hasText: 'Voir la carte' }).click(); await page.waitForTimeout(2500);
const counter = await page.locator('#online-counter-text').textContent().catch(()=>'?');
ok('Carte chargee ('+counter+')', /\d+ livreurs/.test(counter||''));
const payBtn = await page.locator('text=/Utiliser les services/').count();
ok('PAYWALL 200F bloque le visiteur (meme periode gratuite)', payBtn > 0);
await page.screenshot({ path: SHOT + '03_paywall_visiteur.png' });
await page.context().close();

// --- B. Visiteur "ayant payé" (sessionStorage) : carte + fiche livreur + appel ---
page = await newPage(browser);
await page.addInitScript(() => { try { sessionStorage.setItem('hasPaidMapService','true'); } catch(e){} });
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1200);
await page.click('#portal-btn-find'); await page.waitForTimeout(1000);
await page.locator('.loc-city-card', { hasText: 'Ouagadougou' }).click(); await page.waitForTimeout(600);
await page.locator('.loc-option-btn-card', { hasText: 'Voir la carte' }).click(); await page.waitForTimeout(2500);
const payBtn2 = await page.locator('text=/Utiliser les services/').count();
ok('Acces carte debloque apres paiement simule', payBtn2 === 0);
await page.screenshot({ path: SHOT + '04_carte_debloquee.png' });

// Switch Bobo
const cityBtns = page.locator('.city-btn');
await cityBtns.filter({ hasText: 'Bobo' }).click().catch(()=>{});
await page.waitForTimeout(1500);
const cBobo = await page.locator('#online-counter-text').textContent().catch(()=>'?');
console.log('   Compteur Bobo:', cBobo);
await page.screenshot({ path: SHOT + '05_carte_bobo.png' });
await cityBtns.filter({ hasText: 'Ouaga' }).click().catch(()=>{});
await page.waitForTimeout(1500);

// Détecter un livreur -> fiche
const detect = page.locator('text=Détecter un livreur');
ok('Bouton "Détecter un livreur" present', await detect.count() > 0);
if (await detect.count() > 0) {
  await detect.click(); await page.waitForTimeout(2000);
  await page.screenshot({ path: SHOT + '06_fiche_livreur.png' });
  ok('Fiche livreur (Appeler/Discuter)', await page.locator('text=/Appeler/').count() > 0);
  // Le téléphone est-il visible (période gratuite) ?
  const tel = await page.locator('text=/Téléphone/i').count();
  console.log('   Bloc téléphone present dans la fiche:', tel>0?'OUI':'NON');
  // Cliquer Discuter sans être connecté => doit demander connexion
  const discuter = page.locator('text=/Discuter/').first();
  if (await discuter.count()>0){
    await discuter.click(); await page.waitForTimeout(1500);
    const authPrompt = await page.locator('text=/connecter|connexion|créer un compte/i').count();
    ok('Chat sans compte => invite connexion', authPrompt > 0);
    await page.screenshot({ path: SHOT + '07_chat_requiert_connexion.png' });
  }
}

console.log('\n--- ERREURS JS ---');
console.log(errLogs(page).slice(0,10).join('\n') || 'aucune');
await browser.close();
console.log('\n=== RESUME VISITEUR ===\n' + R.join('\n'));
