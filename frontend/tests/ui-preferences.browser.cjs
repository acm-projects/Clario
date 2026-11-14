const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/__dev/profile', route => route.fulfill({ json: {
    user: { id: 'ui-test', email: 'test@example.test' },
    profile: { id: 'ui-test', display_name: 'Sam', assessment_completed: true, preferred_language: 'Python', weekly_interview_goal: 3 },
  } }));
  await page.route('**/api/sessions', route => route.fulfill({ json: [0, 1, 2].map(offset => ({
    id: String(offset), problem_slug: 'two-sum', status: 'completed',
    ended_at: new Date(Date.now() - offset * 86400000).toISOString(),
    started_at: new Date(Date.now() - offset * 86400000).toISOString(), mode: 'practice', language: 'python3',
  })) }));
  await page.goto('http://localhost:5173/settings');
  await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
  assert.equal(await page.locator('[data-appearance]').getAttribute('data-appearance'), 'light');
  await page.getByLabel('Display name', { exact: true }).fill('Ada');
  await page.getByText('Welcome back, Ada.', { exact: true }).waitFor();
  await page.getByRole('radio', { name: /Dark/ }).evaluate(element => element.click());
  assert.equal(await page.locator('[data-appearance]').getAttribute('data-appearance'), 'dark');
  await page.getByRole('button', { name: 'Quick tour', exact: true }).click();
  await page.getByRole('dialog').getByRole('heading', { name: 'Your dashboard', exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, '/dashboard');
  await page.getByRole('dialog').getByRole('button', { name: /^Next/ }).click();
  await page.getByRole('dialog').getByRole('heading', { name: 'Start an interview', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Close dashboard tour' }).click();
  await page.waitForFunction(() => document.querySelector('.dashboard-streak')?.textContent === '3 days streak');
  assert.equal(await page.locator('.dashboard-streak').evaluate(element => getComputedStyle(element).color), 'rgb(24, 33, 55)');
  await page.getByRole('button', { name: 'Quick tour', exact: true }).click();
  await page.getByRole('dialog').getByRole('heading', { name: 'Your dashboard', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Close dashboard tour' }).click();
  await page.screenshot({ path: require('node:path').join(require('node:os').tmpdir(), 'clario-dashboard-dark.png'), fullPage: true });
  console.log('PASS: default light, Settings title, live name preview, dark setting, black 3-day streak text, automatic tour navigation, and restart at card one.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
