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

    console.log("Taking homepage screenshot...");
    await page.screenshot({ path: 'scratch/home.png' });

    console.log("Clicking 'Se connecter' button...");
    const connectBtn = page.locator('text="Se connecter"').first();
    if (await connectBtn.isVisible()) {
        await connectBtn.click();
        await page.waitForTimeout(2000);
        console.log("Taking AuthDrawer screenshot...");
        await page.screenshot({ path: 'scratch/auth_drawer.png' });

        // Let's print out what is visible in the AuthDrawer
        const text = await page.locator('.drawer-container, .modal-content, body').innerText();
        console.log("--- TEXT IN AUTH DRAWER ---");
        console.log(text.substring(0, 1000));
        console.log("---------------------------");

        // Try to click client space
        console.log("Opening Espace Client...");
        const clientBtn = page.locator('text="Espace Client"').first();
        if (await clientBtn.isVisible()) {
            await clientBtn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'scratch/client_space.png' });
            console.log("--- TEXT IN CLIENT SPACE ---");
            console.log(await page.innerText('body'));
            
            // let's click back or close if there is a back button
            const backBtn = page.locator('button.btn-back-drawer').first();
            if (await backBtn.isVisible()) {
                await backBtn.click();
                await page.waitForTimeout(1000);
            }
        } else {
            console.log("Espace Client button not found!");
        }

        // Try to click driver space
        console.log("Opening Espace Livreur...");
        const driverBtn = page.locator('text="Espace Livreur"').first();
        if (await driverBtn.isVisible()) {
            await driverBtn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'scratch/driver_space.png' });
            console.log("--- TEXT IN DRIVER SPACE ---");
            console.log(await page.innerText('body'));
        } else {
            console.log("Espace Livreur button not found!");
        }
    } else {
        console.log("'Se connecter' button NOT FOUND.");
        console.log("Body text:");
        console.log(await page.innerText('body'));
    }

  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    await browser.close();
  }
}

testSpaces();
