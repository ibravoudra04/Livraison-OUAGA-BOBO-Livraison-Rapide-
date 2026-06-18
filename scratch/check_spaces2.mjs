import { firefox } from 'playwright';

async function testSpaces() {
  console.log("Launching browser...");
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[PAGEERROR]: ${err.message}`);
  });

  try {
    console.log("Navigating to http://localhost:3000 ...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    console.log("Clicking 'Se connecter' button...");
    const connectBtn = page.locator('text="Se connecter"').first();
    if (await connectBtn.isVisible()) {
        await connectBtn.click();
        await page.waitForTimeout(2000);
        
        console.log("Opening Espace Client...");
        const clientBtn = page.locator('text="Compte Client"').first();
        if (await clientBtn.isVisible()) {
            await clientBtn.click();
            await page.waitForTimeout(1000);
            console.log("--- TEXT IN CLIENT SPACE ---");
            console.log((await page.innerText('#client-drawer')).substring(0, 1000));
            
            // Go back
            const backBtn = page.locator('.btn-back-drawer').first();
            if (await backBtn.isVisible()) {
                await backBtn.click();
                await page.waitForTimeout(1000);
            }
        } else {
            console.log("Compte Client button not found!");
        }

        console.log("Opening Espace Livreur...");
        const driverBtn = page.locator('text="Connexion Livreur"').first();
        if (await driverBtn.isVisible()) {
            await driverBtn.click();
            await page.waitForTimeout(1000);
            console.log("--- TEXT IN DRIVER SPACE ---");
            console.log((await page.innerText('#driver-drawer')).substring(0, 1000));
        } else {
            console.log("Connexion Livreur button not found!");
        }
    } else {
        console.log("'Se connecter' button NOT FOUND.");
    }

  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    await browser.close();
  }
}

testSpaces();
