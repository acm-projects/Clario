// Read-only smoke check against the live local problems API.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto((process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173') + '/problems');
    await page.locator('.library-problem-action').first().waitFor({ timeout: 30000 });
    const count = await page.locator('.library-problem-action').count();
    assert.ok(count > 0);
    assert.deepEqual(errors, []);
    console.log(`PASS: live Problem Library renders ${count} problems; no JavaScript runtime errors.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
