import { chromium } from 'playwright';

const OUT = 'C:/Users/jomalyne/AppData/Local/Temp/claude/C--Users-jomalyne-PLACEHOLDER/f1903b22-96ae-4b69-97f4-52faf8f528a2/scratchpad';
const BASE = 'http://localhost:5173';

const browser = await chromium.launch({ args: ['--no-sandbox'] });

async function freshPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));
  return { ctx, page };
}

// ── Test 1: wrong password on an existing (seeded) account must be REJECTED ──
{
  const { ctx, page } = await freshPage();
  await page.goto(BASE);
  await page.locator('a:has-text("Log In"), button:has-text("Log In")').first().click().catch(async () => {
    // LandingNav might render it differently; fall back to clicking "Join GuidHer" area login link.
    await page.locator('text=Log In').first().click();
  });
  await page.waitForSelector('#l-email', { timeout: 10000 });
  await page.fill('#l-email', 'admin@gmail.com');
  await page.fill('#l-pw', 'WRONG_PASSWORD_123');
  await page.click('button[type="submit"]:has-text("Log In")');
  await page.waitForTimeout(1500);
  const errText = await page.locator('.status-err').first().textContent().catch(() => null);
  console.log('TEST 1 (wrong password) -> error shown:', errText);
  await page.screenshot({ path: `${OUT}/auth-01-wrong-password.png` });
  await ctx.close();
}

// ── Test 2: correct password on the admin account must SUCCEED and show admin button ──
{
  const { ctx, page } = await freshPage();
  await page.goto(BASE);
  await page.locator('text=Log In').first().click();
  await page.waitForSelector('#l-email', { timeout: 10000 });
  await page.fill('#l-email', 'admin@gmail.com');
  await page.fill('#l-pw', 'Passw0rd!');
  await page.click('button[type="submit"]:has-text("Log In")');
  await page.waitForTimeout(2500);
  console.log('TEST 2 (correct admin password) -> URL after login:', page.url());
  const profileBtnText = await page.locator('.nav-profile-btn').first().textContent().catch(() => null);
  console.log('TEST 2 -> profile button text:', profileBtnText);
  await page.waitForTimeout(1000); // let useAuthUser's role subscription resolve
  const adminBtnCount = await page.locator('button[aria-label="Admin dashboard"]').count();
  console.log('TEST 2 -> admin button visible:', adminBtnCount > 0);
  await page.screenshot({ path: `${OUT}/auth-02-admin-logged-in.png` });
  await ctx.close();
}

// ── Test 3: signing up a brand-new account, then logging out and back in with the SAME
//    password must succeed, and with a WRONG password must fail. ──
{
  const email = `newuser_${Date.now()}@gmail.com`;
  const password = 'MyRealPass123';

  const { ctx, page } = await freshPage();
  await page.goto(BASE);
  await page.locator('text=Log In').first().click();
  await page.waitForSelector('#l-email', { timeout: 10000 });
  await page.locator('text=Sign up').first().click();
  await page.waitForSelector('#su-name', { timeout: 10000 });
  await page.fill('#su-name', 'New Test User');
  await page.fill('#su-email', email);
  await page.fill('#su-password', password);
  await page.fill('#su-confirm', password);
  await page.click('button[type="submit"]:has-text("Next")');
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]:has-text("Create Account")');
  await page.waitForTimeout(2000);
  console.log('TEST 3a (signup) -> URL after signup:', page.url());
  await page.screenshot({ path: `${OUT}/auth-03-signup-done.png` });

  // Go to profile, sign out.
  await page.goto(`${BASE}/profile`);
  await page.waitForTimeout(1000);
  const nameShown = await page.locator('.profile-name').first().textContent().catch(() => null);
  console.log('TEST 3b -> profile name after signup:', nameShown);
  await page.locator('button:has-text("Sign out")').first().click();
  await page.waitForTimeout(1000);

  // Log back in with correct password.
  await page.locator('text=Log In').first().click();
  await page.waitForSelector('#l-email', { timeout: 10000 });
  await page.fill('#l-email', email);
  await page.fill('#l-pw', password);
  await page.click('button[type="submit"]:has-text("Log In")');
  await page.waitForTimeout(2000);
  console.log('TEST 3c (correct password relogin) -> URL:', page.url());

  // Sign out again, try wrong password.
  await page.goto(`${BASE}/profile`);
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Sign out")').first().click();
  await page.waitForTimeout(800);
  await page.locator('text=Log In').first().click();
  await page.waitForSelector('#l-email', { timeout: 10000 });
  await page.fill('#l-email', email);
  await page.fill('#l-pw', 'totally-wrong-password');
  await page.click('button[type="submit"]:has-text("Log In")');
  await page.waitForTimeout(1500);
  const err3 = await page.locator('.status-err').first().textContent().catch(() => null);
  console.log('TEST 3d (wrong password on real new account) -> error shown:', err3);
  await page.screenshot({ path: `${OUT}/auth-04-newuser-wrong-password.png` });

  await ctx.close();
}

await browser.close();
