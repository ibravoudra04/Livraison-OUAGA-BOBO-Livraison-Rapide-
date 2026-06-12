import { newBrowser, newPage, BASE, SHOT } from './lib_audit.mjs';
const browser = await newBrowser();
const page = await newPage(browser);
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);

// 1. Bouton "Se connecter" en haut
await page.locator('button:has-text("Se connecter")').first().click().catch(e=>console.log('pas de bouton Se connecter haut'));
await page.waitForTimeout(1200);
await page.screenshot({ path: SHOT + '08_auth_drawer.png' });
const bodyTxt = await page.locator('body').innerText();
console.log('Drawer auth contient "Créer un compte" ?', /créer un compte|pas encore|inscription|s\'inscrire/i.test(bodyTxt) ? 'OUI' : 'NON');
console.log('Drawer auth contient "Numéro" ?', /numéro/i.test(bodyTxt) ? 'OUI':'NON');

// Lister tous les liens/boutons visibles dans le drawer
const links = await page.locator('#auth-drawer a, #auth-drawer button').allInnerTexts().catch(()=>[]);
console.log('Éléments cliquables du drawer auth:', JSON.stringify(links));

// 2. Chercher partout un moyen de créer un compte CLIENT
console.log('\nRecherche globale de "client" dans la page:');
console.log('  "Compte Client" présent:', /compte client/i.test(bodyTxt));
console.log('  "Devenir livreur" présent:', /devenir livreur/i.test(await page.locator('body').innerText()));
await browser.close();
