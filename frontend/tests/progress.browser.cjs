/* Run with the Vite dev server and local development auth bypass enabled. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const os = require('node:os');
const path = require('node:path');
const compiled = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/mocks/progressMock.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const fixture = { exports: {} };
vm.runInNewContext(compiled.outputText, fixture);
const { historyMock: history, summaryMock: summary, topicsMock: topics, emptySummaryMock } = fixture.exports;

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/__dev/profile', route => route.fulfill({ json: {
      user: { id: 'progress-test', email: 'progress@example.test' },
      profile: { id: 'progress-test', display_name: 'Progress Tester', assessment_completed: true, preferred_language: 'Python', starting_difficulty: 'Easy', weekly_interview_goal: 3 },
    } }));
    const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
    let state = 'success';
    let release;
    let pending = new Promise(resolve => { release = resolve; });
    await page.route('**/api/progress/*', async route => {
      if (state === 'loading') await pending;
      if (state === 'error') return route.fulfill({ status: 503, json: { detail: 'Unavailable' } });
      const endpoint = new URL(route.request().url()).pathname.split('/').pop();
      const data = state === 'empty' ? { history: [], summary: emptySummaryMock, topics: { topics: [], weak_topics: [] } } : state === 'single' ? { history: [history[0]], summary: { ...summary, total_sessions: 1, change_vs_first: null, umpire_miss_rate: emptySummaryMock.umpire_miss_rate }, topics: { topics: [], weak_topics: [] } } : { history, summary, topics };
      await route.fulfill({ json: data[endpoint] });
    });
    state = 'loading';
    await page.goto(`${base}/progress`);
    await page.getByText('Loading your progress…', { exact: true }).waitFor();
    state = 'success'; release();
    await page.getByRole('heading', { name: 'Your Progress' }).waitFor();
    await page.getByText('65.3', { exact: true }).waitFor();
    await page.getByText('▲ 27.6 since your first interview', { exact: true }).waitFor();
    await page.getByText('Skipped in 56%', { exact: true }).waitFor();
    const recent = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Recent interviews', exact: true }) });
    assert.equal(await recent.locator('li').count(), 5);
    assert.match(await recent.locator('li').first().innerText(), /Company Interview/);
    assert.equal(await recent.locator('li a').first().getAttribute('href'), '/report/mock-9');
    const overall = page.getByRole('button', { name: 'Overall', exact: true });
    await overall.click();
    assert.equal(await overall.getAttribute('aria-pressed'), 'true');
    const technical = page.getByRole('button', { name: 'Technical', exact: true });
    await technical.click(); await overall.click();
    assert.equal(await technical.getAttribute('aria-pressed'), 'true');
    assert.equal(await overall.getAttribute('aria-pressed'), 'false');
    await overall.click();
    await page.locator('.recharts-line-dots .recharts-dot').first().hover();
    await page.locator('.recharts-tooltip-wrapper').filter({ hasText: 'Two Sum' }).waitFor();
    const barColors = await page.locator('.recharts-bar-rectangle path').evaluateAll(nodes => nodes.map(n => n.getAttribute('fill')));
    assert.equal(barColors.filter(color => color === '#c87819').length, 3);
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-progress-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-progress-mobile.png'), fullPage: true });
    state = 'empty'; await page.reload();
    await page.getByRole('heading', { name: 'No interviews yet.' }).waitFor();
    state = 'single'; await page.reload();
    await page.getByText('No UMPIRE observations recorded yet.').waitFor();
    assert.equal(await page.getByText('since your first interview', { exact: false }).count(), 0);
    state = 'error'; await page.reload();
    await page.getByRole('alert').filter({ hasText: "We couldn't load your progress" }).waitFor();
    state = 'success'; await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await page.getByText('65.3', { exact: true }).waitFor();
    await page.goto(`${base}/progress?preview=mock`);
    await page.getByText('Preview data · These are sample interviews.').waitFor();
    assert.deepEqual(errors, []);
    console.log('Progress browser checks passed: API data, loading, toggles, tooltip, weak topics, recent links, mobile, empty, single, error/retry, mock preview.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
