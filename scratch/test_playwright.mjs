import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Aller sur le site
  await page.goto('https://livraisonrapide.app', { waitUntil: 'networkidle' });
  
  // Attendre un peu que les données chargent
  await page.waitForTimeout(5000);
  
  // Cliquer sur le bouton "Lancer la recherche" pour fermer le Welcome Portal
  const btnFind = await page.$('#portal-btn-find');
  if (btnFind) {
    await btnFind.click();
    await page.waitForTimeout(2000);
    
    // Cliquer sur la ville Ouagadougou
    const cityCards = await page.$$('.loc-city-card');
    if (cityCards.length > 0) {
      // Lire le texte pour voir le nombre de livreurs
      const text = await cityCards[0].innerText();
      console.log('City Card Ouaga:', text);
      await cityCards[0].click();
      await page.waitForTimeout(2000);
      
      // Cliquer sur "Voir la carte en direct"
      const mapBtn = await page.$$('.loc-option-btn-card');
      if (mapBtn.length > 0) {
        await mapBtn[0].click();
        await page.waitForTimeout(2000);
      }
    }
  }
  
  // Chercher le badge des livreurs
  const badge = await page.$('#online-counter-text');
  if (badge) {
    const text = await badge.innerText();
    console.log('Badge text:', text);
  } else {
    console.log('Badge not found!');
  }
  
  // Regarder les messages d'erreur console
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await browser.close();
})();
