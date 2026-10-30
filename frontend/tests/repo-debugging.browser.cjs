/* Run against the local dev servers; see docs/repo-debugging.md. No production dependency. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const solutions = require('../../backend/tests/fixtures/repo_solutions.json')['shopping-cart-01'];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => {
    // Monaco 0.55 can reject a canceled diagnostic task when switching models.
    // Ignore only that upstream teardown cancellation, never application errors.
    if (error.message === 'Canceled' && error.stack?.includes('monaco-editor@') && error.stack.includes('at setModel')) return;
    errors.push(error.message);
  });
  const base = process.env.CLARIO_TEST_URL || 'http://localhost:5173';
  // Test-only profile fixture. Production authentication is unchanged.
  await page.route('**/__dev/profile', route => route.fulfill({ json: {
    user: { id: 'repo-browser-test', email: 'repo-browser@example.test' },
    profile: { id: 'repo-browser-test', display_name: 'Duck Debugger', assessment_completed: true, preferred_language: 'Python', starting_difficulty: 'Easy', weekly_interview_goal: 3 },
  } }));
  // Evaluate with real Piston while avoiding writes to the user's account in this UI check.
  await page.route('**/api/repo-challenges/*/submit', async route => {
    const response = await page.request.post(route.request().url().replace('/submit', '/run'), { data: route.request().postDataJSON() });
    assert.equal(response.status(), 200);
    await route.fulfill({ json: { ...await response.json(), submission: { saved: false, submission_id: null, message: 'Browser smoke test: evaluation complete; persistence intentionally mocked.' } } });
  });
  await page.goto(`${base}/interview`);
  const modes = page.getByRole('region', { name: 'Interview mode selector' });
  await modes.waitFor();
  assert.equal(await modes.getByRole('button').count(), 6);
  const colors = await modes.getByRole('button').evaluateAll(buttons => buttons.map(button => getComputedStyle(button).backgroundColor));
  assert.deepEqual(colors, ['rgb(48, 84, 237)', 'rgb(255, 253, 248)', 'rgb(255, 253, 248)', 'rgb(255, 223, 79)', 'rgb(48, 84, 237)', 'rgb(255, 253, 248)']);
  await modes.getByRole('button').filter({ hasText: 'Repo Debugging' }).click();
  await page.getByRole('link').filter({ hasText: 'The Cart That Charges the Wrong Amount' }).click();
  await page.getByRole('heading', { name: 'The Cart That Charges the Wrong Amount', exact: true }).waitFor();
  await page.waitForFunction(() => window.monaco?.editor?.getModels().some(model => model.uri.path.endsWith('/main.py')), { timeout: 45000 });
  const explorer = page.getByRole('navigation', { name: 'Repository files' });
  await page.getByRole('complementary', { name: 'Interview call' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Start interview', exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Hide files', exact: false }).click();
  assert.equal(await explorer.count(), 0);
  await page.getByRole('button', { name: 'Show files', exact: false }).click();
  const open = name => explorer.locator(`[data-repository-file="${name}"]`).click();
  const get = name => page.evaluate(name => window.monaco.editor.getModels().find(model => model.uri.path.endsWith('/' + name))?.getValue(), name);
  const set = (name, text) => page.evaluate(({ name, text }) => window.monaco.editor.getModels().find(model => model.uri.path.endsWith('/' + name)).setValue(text), { name, text });
  assert.equal(await explorer.locator('[data-repository-file]').count(), 6);
  await page.getByRole('complementary', { name: 'Challenge brief' }).getByRole('button', { name: 'Close brief' }).click();
  await page.getByRole('button', { name: 'Open brief', exact: true }).click();
  const main = await get('main.py');
  await set('main.py', main + '\n# browser draft edit\n');
  await open('cart.py');
  const cart = await get('cart.py');
  assert.ok(!cart.includes('browser draft edit'));
  await open('main.py');
  assert.ok((await get('main.py')).includes('browser draft edit'));
  await page.getByRole('button', { name: 'Close main.py', exact: true }).click();
  await open('main.py');
  assert.ok((await get('main.py')).includes('browser draft edit'));
  await open('README.md');
  const readme = await get('README.md');
  await page.locator('.monaco-editor textarea').focus();
  await page.keyboard.press('Control+End');
  await page.keyboard.insertText('attempted-readonly-edit');
  assert.equal(await get('README.md'), readme);
  await page.getByRole('button', { name: 'Run Tests', exact: false }).click();
  await page.getByText(/\d+ checks did not pass\./).waitFor();
  for (const [name, source] of Object.entries(solutions)) {
    await open(name);
    await set(name, source);
  }
  await page.getByRole('button', { name: 'Run Tests', exact: false }).click();
  await page.getByText('All behavior checks passed.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Submit', exact: false }).click();
  await page.getByText('Browser smoke test: evaluation complete; persistence intentionally mocked.').waitFor();
  await page.waitForTimeout(300);
  await page.reload();
  await page.getByText('Restored your browser draft', { exact: false }).waitFor();
  await open('cart.py');
  await page.waitForFunction(() => window.monaco?.editor?.getModels().some(model => model.uri.path.endsWith('/cart.py') && model.getValue().includes('from decimal import')));
  await page.getByRole('button', { name: 'Reset files', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Keep editing' }).click();
  assert.ok((await get('cart.py')).includes('from decimal import'));
  await page.getByRole('button', { name: 'Reset files', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset files', exact: true }).click();
  await page.waitForFunction(() => window.monaco.editor.getModels().some(model => model.uri.path.endsWith('/cart.py') && !model.getValue().includes('from decimal import')));
  await page.goto(`${base}/settings`);
  await page.getByRole('radio', { name: /Dark/ }).locator('..').click();
  await page.goto(`${base}/repo-debugging/shopping-cart-01`);
  await page.getByRole('heading', { name: 'The Cart That Charges the Wrong Amount', exact: true }).waitFor();
  await page.screenshot({ path: path.join(os.tmpdir(), 'repo-debugging-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(os.tmpdir(), 'repo-debugging-mobile.png'), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false);
  assert.deepEqual(errors, []);
  console.log('PASS: repeating-color mode grid, video-call panel, retractable explorer, independent edits, tabs, read-only files, real Piston fail/pass, submit UI, draft restore, reset, theme, and mobile width.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
