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
const { historyMock, summaryMock, topicsMock: topics, emptySummaryMock } = fixture.exports;
const summary = { ...summaryMock, latest_session_id: "mock-9" };
const history = historyMock.map((item, index) => ({ ...item, duration_seconds: 1234,
  topics: index === 8 ? [] : index % 2 ? ['Sorting'] : ['Array', 'Hash Table'],
  feedback_id: 'saved-' + item.session_id, feedback_status: 'reviewed',
  feedback_summary: index === 5 ? null : 'Saved feedback: explain the invariant and check boundary conditions.',
}));

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
    let overviewReads = 0;
    await page.route(/\/api\/progress(?:\/(history|summary|topics))?(?:\?.*)?$/, async route => {
      if (state === 'loading') await pending;
      if (state === 'error') return route.fulfill({ status: 503, json: { detail: 'Unavailable' } });
      const endpoint = new URL(route.request().url()).pathname.split('/').pop();
      const data = state === 'empty' ? { history: [], summary: emptySummaryMock, topics: { topics: [], weak_topics: [] } } : state === 'single' ? { history: [history[0]], summary: { ...summary, total_sessions: 1, change_vs_first: null, umpire_miss_rate: emptySummaryMock.umpire_miss_rate }, topics: { topics: [], weak_topics: [] } } : { history, summary, topics };
      if (endpoint === 'progress') overviewReads++;
      await route.fulfill({ json: endpoint === 'progress' ? { history: data.history, summary: data.summary } : data[endpoint] });
    });
    state = 'loading';
    await page.goto(`${base}/progress`);
    await page.getByText('Loading your progress…', { exact: true }).waitFor();
    state = 'success'; release();
    await page.getByRole('heading', { name: 'Your Progress' }).waitFor();
    await page.getByText('65.3%', { exact: true }).waitFor();
    await page.getByText('▲ 27.6 percentage points since your first interview', { exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'UMPIRE habits' }).count(), 0);
    assert.equal(await page.getByRole('heading', { name: 'Topic breakdown' }).count(), 0);
    const recent = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Previous Interviews', exact: true }) });
    assert.equal(await recent.locator('tbody tr').count(), 9);
    assert.match(await recent.locator('tbody tr').first().innerText(), /Practice interview/);
    assert.equal(await recent.locator('tbody tr a').first().getAttribute('href'), '/report/mock-9');
    const colors = await page.locator('.progress-stat-card').evaluateAll(cards => cards.map(card => getComputedStyle(card).backgroundColor));
    assert.deepEqual(colors, ['rgb(69, 102, 237)', 'rgb(255, 223, 79)', 'rgb(69, 102, 237)']);
    await recent.getByLabel('Search interviews', { exact: true }).fill('Two Sum');
    assert.equal(await recent.locator('tbody tr').count(), 1);
    await recent.getByRole('group', { name: 'Interview difficulty' }).getByRole('button', { name: 'Medium', exact: true }).click();
    await recent.getByText('No interviews match these filters.', { exact: true }).waitFor();
    await recent.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await recent.getByLabel('Interview topic', { exact: true }).selectOption('Hash Table');
    assert.equal(await recent.locator('tbody tr').count(), 4);
    await recent.getByLabel('Interview topic', { exact: true }).selectOption('All');
    await recent.getByLabel('Feedback status', { exact: true }).selectOption('pending');
    await recent.getByText('No interviews match these filters.', { exact: true }).waitFor();
    await recent.getByRole('button', { name: 'Clear filters', exact: true }).click();
    assert.equal(await recent.getByRole('columnheader', { name: 'Feedback summary', exact: true }).count(), 0);
    assert.equal(overviewReads, 1);
    await page.getByRole('heading', { name: 'Your trend', exact: true }).waitFor();
    assert.equal(await page.locator('.recharts-line-curve').count(), 1);
    assert.equal(await page.getByText('Latest overall score', { exact: true }).count(), 0);
    await page.getByText('Your average percentage', { exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'View your most recent interview report' }).getAttribute('href'), '/report/mock-9');
    await page.waitForFunction(() => document.querySelectorAll('.recharts-line-dots .recharts-dot').length === 9);
    assert.equal(await page.getByRole('group', { name: 'Score categories' }).count(), 0);
    assert.equal(await recent.locator('.history-score').count(), 9);
    await recent.getByRole('columnheader', { name: 'Date', exact: true }).waitFor();
    assert.equal(await recent.locator('.history-duration').first().innerText(), '20 min 34 sec');
    assert.match(await recent.locator('.history-mode-label').first().innerText(), /Mode: Company Interview/);
    assert.equal(await recent.getByRole('columnheader', {name:'Mode',exact:true}).count(),1);
    assert.ok(await recent.locator('.history-icon-math').count() > 0);
    assert.ok(await recent.locator('.history-icon-text').count() > 0);
    assert.equal(await recent.locator('thead th').count(), 5);
    assert.equal(await page.locator('.progress-category-rows > div').count(), 3);
    assert.ok(await recent.locator('.history-score strong').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)) >= 32);
    await page.waitForTimeout(1400); // Capture the completed line-draw animation.
    await page.locator('.recharts-line-dots circle').last().hover();
    const tooltip = page.locator('.recharts-tooltip-wrapper');
    await tooltip.getByText('Technical', { exact: true }).waitFor();
    assert.match(await tooltip.innerText(), /84\/100/);
    await tooltip.getByText('Reasoning', { exact: true }).waitFor();
    await tooltip.getByText('Communication', { exact: true }).waitFor();
    assert.equal(await page.locator('.recharts-line-curve').evaluate(el => getComputedStyle(el).stroke), 'rgb(69, 102, 237)');
    await page.mouse.move(0,0);
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-progress-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-progress-mobile.png'), fullPage: true });
    state = 'empty'; await page.reload();
    await page.getByRole('heading', { name: 'No interviews yet.' }).waitFor();
    state = 'single'; await page.reload();
    await page.getByRole('heading', { name: 'Previous Interviews', exact: true }).waitFor();
    assert.equal(await page.getByText('since your first interview', { exact: false }).count(), 0);
    state = 'error'; await page.reload();
    await page.getByRole('alert').filter({ hasText: "We couldn't load your progress" }).waitFor();
    state = 'success'; await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await page.getByText('65.3%', { exact: true }).waitFor();
    await page.goto(`${base}/progress?preview=mock`);
    await page.getByRole('heading', { name: 'Previous Interviews', exact: true }).waitFor();
    assert.equal(await page.getByText('Preview data', { exact: false }).count(), 0);
    assert.ok(overviewReads > 1, 'Preview query parameters must still load owned API records');
    await page.goto(`${base}/report`);
    await page.waitForURL('**/progress');
    await page.getByRole('heading', { name: 'Your Progress', exact: true }).waitFor();
    await page.route('**/api/feedback/report-fixture', route => route.fulfill({ json: {
      session: { id: 'report-fixture', status: 'completed', ended_at: '2026-10-29T18:00:00Z', problem_slug: 'two-sum' },
      problem: { title: 'Two Sum', difficulty: 'Easy' },
      feedback: { id: 'saved-report', overall_score: 82.1, technical_score: 84, reasoning_score: 80, communication_score: 82, report: { summary: 'A saved report.', full_summary: 'A saved detailed report.', umpire: Object.fromEntries(['understand','match','plan','implement','review','evaluate'].map(key => [key, {stars: 3, summary: 'Explain your approach.', details: 'Practice explaining the steps.'}])), actions: { fix: [], keep: [] } }, strengths: [], weaknesses: [], recommendations: [] },
    } }));
    await page.route('**/api/sessions/report-fixture/transcript', route => route.fulfill({ json: [] }));
    await page.goto(`${base}/report/report-fixture`);
    await page.getByRole('heading', { name: 'Two Sum report', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Your UMPIRE breakdown', exact: true }).waitFor();
    assert.equal(await page.locator('.report-stage').count(), 6);
    assert.equal(await page.locator('.report-score').count(), 3);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(os.tmpdir(), 'clario-feedback-overall.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('Progress browser checks passed: API data, loading, overall-score line chart, shared landing colors, interview metadata table, combined filters, report links, mobile, empty/single/error/retry, and no mock preview override.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
