import { firefox } from 'playwright';

async function run() {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[PAGE] ${msg.text()}`));
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log("Navigated to site.");
    
    // 1. Click "Compte Client"
    await page.locator('.btn-role[onclick*="Client"]').click();
    await page.waitForTimeout(1000);
    
    // 2. Click "Créer un compte"
    await page.locator('text="Créer un compte"').click();
    await page.waitForTimeout(1000);
    
    // 3. Fill registration form
    const phoneInput = page.locator('.form-input-prefix').first();
    const pinInput = page.locator('.form-input-password').first();
    const nameInput = page.locator('input[type="text"]').first();
    
    // Random phone number
    const randomPhone = Math.floor(Math.random() * 9000000) + 1000000;
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
      await phoneInput.fill(`70${randomPhone}`);
      await pinInput.fill('1234');
      
      console.log("Submitting registration...");
      await page.locator('text="Créer mon compte Client"').click();
      await page.waitForTimeout(3000);
      
      // Wait to see what is displayed
      const drawerText = await page.innerText('#client-drawer');
      console.log("--- TEXT IN CLIENT DRAWER ---");
      console.log(drawerText.substring(0, 500));
    } else {
       console.log("Registration form not visible!");
    }
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
}
run();
