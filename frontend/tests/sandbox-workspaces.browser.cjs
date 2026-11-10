/* Run with local Vite/backend/Piston. Profile, voice and coding session are fixtures;
   repository Run Tests uses the real sandbox and never writes account data. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, permissions: ['microphone', 'camera'] });
    const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
    await page.route('**/__dev/profile', route => route.fulfill({ json: {
      user: { id: 'workspace-test', email: 'workspace@example.test' },
      profile: { id: 'workspace-test', display_name: 'Workspace Tester', assessment_completed: true, preferred_language: 'Python', starting_difficulty: 'Medium' },
    } }));
    await page.route('**/node_modules/.vite/deps/@elevenlabs_client.js*', route => route.fulfill({ contentType: 'application/javascript', body: `export const Conversation = {startSession: async options => { options.onModeChange({mode:'listening'}); return {sendContextualUpdate(){},sendUserMessage(){},getInputVolume:()=>0,endSession:async()=>options.onDisconnect()}; }};` }));
    await page.route('**/voice/*session*', route => route.fulfill({ json: { signed_url: 'wss://example.test', variables: { problem_title: 'Fixture', problem_description: 'Investigate.', repo_name: 'Fixture', bug_summary: 'Investigate.' } } }));
    const problem = { slug: 'fixture', leetcode_id: 1, title: 'Resizable question', difficulty: 'Medium', topics: ['Array'], description_html: '<p>Explain and solve this example.</p>', example_testcases: '[1,2]', starter_code: { python3: 'class Solution:\n    def example(self, nums):\n        return nums\n', java: 'class Solution {}' } };
    await page.route('**/api/sessions/workspace-fixture', route => route.fulfill({ json: { id: 'workspace-fixture', problem_slug: 'fixture', language: 'python3', status: 'in_progress', mode: 'custom', started_at: new Date().toISOString(), ended_at: null, latest_code: null, problem } }));

    async function themeCheck(root, theme) {
      await page.getByRole('group', { name: 'Color theme' }).getByRole('button', { name: theme === 'light' ? 'Light' : 'Dark', exact: true }).click();
      await page.waitForFunction(({ root, theme }) => document.querySelector(root)?.dataset.theme === theme, { root, theme });
      const expected = theme === 'light' ? 'rgb(255, 252, 244)' : 'rgb(15, 26, 46)';
      try { await page.waitForFunction(expected => {
        const editor = document.querySelector('.monaco-editor .monaco-editor-background');
        return editor && getComputedStyle(editor).backgroundColor === expected;
      }, expected, { timeout: 45000 }); } catch (error) {
        console.log(await page.locator('.monaco-editor').evaluateAll(els => els.map(el => ({ color: getComputedStyle(el).backgroundColor, backgrounds: [...el.querySelectorAll('.monaco-editor-background')].map(bg => getComputedStyle(bg).backgroundColor) }))));
        await page.screenshot({ path: path.join(os.tmpdir(), 'clario-workspace-failure.png'), fullPage: true });
        throw error;
      }
    }
    async function resize(label, target) {
      const separator = page.getByRole('separator', { name: label, exact: true });
      const before = await page.locator(target).boundingBox();
      const value = Number(await separator.getAttribute('aria-valuenow'));
      await separator.focus();
      await separator.press('ArrowRight');
      assert.equal(Number(await separator.getAttribute('aria-valuenow')), value + 2);
      const after = await page.locator(target).boundingBox();
      assert.ok(after.width > before.width, 'Question width should increase');
      const box = await separator.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 35, box.y + box.height / 2);
      await page.mouse.up();
      assert.ok(Number(await separator.getAttribute('aria-valuenow')) > value + 2);
    }
    await page.goto(`${base}/interview/repo/shopping-cart-01`);
    await page.getByLabel('Repository language').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Repositories', exact: true }).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Repositories', exact: true }).count(), 0);
    await themeCheck('.repo-sandbox', 'light');
    await resize('Resize question and repository editor', '#repo-instructions');
    const border = await page.locator('.repo-editor-shell').evaluate(el => getComputedStyle(el).borderTopColor);
    assert.notEqual(border, 'rgba(0, 0, 0, 0)');
    await themeCheck('.repo-sandbox', 'dark');
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-repo-dark.png') });
    await page.getByLabel('Repository language').selectOption('cpp');
    await page.getByRole('button', { name: 'solution.hpp', exact: false }).first().waitFor();
    await page.getByRole('button', { name: 'Run Tests', exact: true }).click();
    await page.getByText(/checks did not pass/).waitFor({ timeout: 30000 });
    await themeCheck('.repo-sandbox', 'light');
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-repo-light.png') });
    await page.getByLabel('Repository language').selectOption('python');
    await page.getByRole('button', { name: 'main.py', exact: false }).first().waitFor();
    for (const width of [1024, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Repo overflow at ${width}`);
      await page.getByRole('button', { name: 'Dark', exact: true }).click();
      await page.getByRole('button', { name: 'Light', exact: true }).click();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/interview/fixture?session=workspace-fixture`);
    await page.getByRole('heading', { name: /Resizable question/ }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Problem Library', exact: true }).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Problem Library', exact: true }).count(), 0);
    await themeCheck('.interview-page', 'light');
    await resize('Resize problem and code editor', '.sandbox-problem');
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-custom-light.png') });
    await themeCheck('.interview-page', 'dark');
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-custom-dark.png') });
    for (const width of [1024, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Custom overflow at ${width}`);
      await page.getByRole('button', { name: 'Light', exact: true }).click();
      await page.getByRole('button', { name: 'Dark', exact: true }).click();
    }
    console.log('PASS: both editor themes, static labels, keyboard/pointer question resizing, subtle borders, real C++ run, language switching, and responsive widths.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
