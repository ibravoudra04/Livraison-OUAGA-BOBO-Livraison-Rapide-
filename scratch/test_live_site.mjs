import { firefox } from 'playwright';

async function testLiveSite() {
  console.log("Launching Firefox browser...");
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Listen for page errors
  page.on('pageerror', err => {
    console.log(`[BROWSER PAGEERROR]: ${err.message}`);
  });

  // Listen for failed network requests
  page.on('requestfailed', request => {
    console.log(`[BROWSER REQFAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Listen for response details (especially to Supabase)
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('supabase.co')) {
      console.log(`[SUPABASE RESPONSE] ${response.status()} ${url}`);
      try {
        if (response.status() >= 400) {
          const text = await response.text();
          console.log(`   Error body: ${text}`);
        }
      } catch (e) {
        // ignore
      }
    }
  });

  console.log("Navigating to https://livraisonrapide.app...");
  try {
    await page.goto('https://livraisonrapide.app', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Let's click through any welcome portal if it exists
    console.log("Checking for Welcome Portal start button...");
    const startBtn = page.locator('button:has-text("Démarrer")');
    if (await startBtn.isVisible()) {
      console.log("Clicking start button...");
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Check if there is a city counter or online counter
    const counterText = await page.locator('#online-counter-text').innerText().catch(() => 'NOT FOUND');
    console.log("Online counter text on page:", counterText);
    
    // Check Leaflet markers count
    const markers = await page.locator('.custom-driver-dot').count();
    console.log("Leaflet custom-driver-dot count:", markers);

    // Take screenshot for verification
    await page.screenshot({ path: 'scratch/live_site_screenshot.png' });
    console.log("Screenshot saved to scratch/live_site_screenshot.png");

  } catch (err) {
    console.error("Navigation failed:", err.message);
  } finally {
    await browser.close();
  }
}

testLiveSite();
