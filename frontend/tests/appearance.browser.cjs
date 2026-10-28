const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 const page = await browser.newPage({ colorScheme: 'dark' });
 const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
 await page.route('**/__dev/profile', route => route.fulfill({ json: {
  user: { id: 'appearance-test', email: 'appearance@example.test' },
  profile: { id: 'appearance-test', display_name: 'Theme Tester', assessment_completed: true, preferred_language: 'Python', starting_difficulty: 'Easy', weekly_interview_goal: 3 },
 } }));
 await page.goto(base);
 await page.evaluate(() => { localStorage.setItem('clario-theme', 'dark'); localStorage.removeItem('clario-settings-appearance'); });
 await page.goto(`${base}/dashboard`);
 await page.locator('.app-sidebar-layout').waitFor();
 assert.equal(await page.locator('[data-appearance]').getAttribute('data-appearance'), 'light');
 await page.goto(`${base}/settings`);
 await page.getByRole('radio', { name: /Dark/ }).locator('..').click();
 assert.equal(await page.locator('[data-appearance]').getAttribute('data-appearance'), 'dark');
 await page.reload();
 await page.getByRole('radio', { name: /Dark/ }).waitFor();
 assert.ok(await page.getByRole('radio', { name: /Dark/ }).isChecked());
 await page.goto(`${base}/dashboard`);
 await page.locator('.app-sidebar-layout').waitFor();
 assert.equal(await page.locator('[data-appearance]').getAttribute('data-appearance'), 'dark');
 await page.goto(`${base}/settings`);
 await page.getByRole('radio', { name: /Light/ }).locator('..').click();
 await page.goto(`${base}/repo-debugging/shopping-cart-01`);
 await page.getByRole('heading', { name: 'Shopping Cart Discount Bug', exact: true }).waitFor();
 assert.equal(await page.getByRole('group', { name: 'Color theme' }).count(), 0);
 assert.equal(await page.getByRole('button', { name: 'Dark mode', exact: true }).count(), 0);
 const background = await page.locator('.repo-workspace').evaluate(el => getComputedStyle(el).backgroundColor);
 assert.equal(background, 'rgb(251, 244, 223)');
 await browser.close();
 console.log('PASS: legacy dark preference and dark OS default to light; Settings opt-in persists across reload/navigation; light restored; interview theme controls absent.');
})().catch(error => { console.error(error); process.exit(1); });
