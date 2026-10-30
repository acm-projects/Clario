// Run against the existing local development server. All account/API writes are mocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
const answers = { experience: 'intermediate', confident_topics: ['Array'], struggle_topics: ['Hash Table'], companies: ['Google'], language: 'java', timeline: 'this_month' };
const problem = { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topics: ['Array', 'Hash Table'], reason: 'You said you struggle with Hash Table.' };
const detail = { ...problem, leetcode_id: 1, description_html: '<p>Find two numbers.</p>', starter_code: { python3: 'class Solution: pass', java: 'class Solution {}' }, example_testcases: '[2,7]\n9' };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let passed = 0;
  async function scenario(name, initial, run) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => console.error('Browser error:', error.message));
    const state = { assessed: true, assessmentError: null, recommendationError: false, problems: [problem], submitFailures: 0, posts: [], sessions: [], ...initial };
    const saved = () => ({ user_id: 'part4-test-user', updated_at: '2026-10-30T12:00:00Z', answers: state.answers || answers });
    await page.route('**/__dev/profile', route => route.fulfill({ json: { user: { id: 'part4-test-user', email: 'test@example.test' }, profile: { id: 'part4-test-user', display_name: 'Part Four', preferred_language: 'Python', starting_difficulty: 'Easy', assessment_completed: true, weekly_interview_goal: 3 } } }));
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (!path.startsWith('/api/')) return route.fallback();
      if (path === '/api/assessment/me') {
        if (state.assessmentWait) await state.assessmentWait;
        if (state.assessmentError === 'network') return route.abort();
        if (state.assessmentError) return route.fulfill({ status: state.assessmentError, json: { detail: 'Assessment check failed' } });
        return route.fulfill({ status: state.assessed ? 200 : 404, json: state.assessed ? saved() : { detail: 'No assessment yet' } });
      }
      if (path === '/api/assessment' && request.method() === 'POST') {
        state.posts.push(request.postDataJSON());
        if (state.submitWait) await state.submitWait;
        if (state.submitFailures-- > 0) return route.fulfill({ status: 503, json: { detail: 'Please retry saving' } });
        state.assessed = true; state.answers = request.postDataJSON();
        return route.fulfill({ json: saved() });
      }
      if (path === '/api/recommendations') {
        assert.equal(new URL(request.url()).searchParams.get('limit'), '5');
        if (state.recommendationWait) await state.recommendationWait;
        return route.fulfill({ status: state.recommendationError ? 503 : 200, json: state.recommendationError ? { detail: 'Recommendation service unavailable' } : { has_assessment: state.assessed, problems: state.problems } });
      }
      if (path === '/api/sessions' && request.method() === 'POST') {
        state.sessions.push(request.postDataJSON());
        if (state.sessionFailure) return route.fulfill({ status: 503, json: { detail: 'Could not start interview' } });
        return route.fulfill({ json: { id: 'part4-session', ...request.postDataJSON(), status: 'in_progress', started_at: new Date().toISOString(), ended_at: null } });
      }
      if (path === '/api/sessions/part4-session') return route.fulfill({ json: { id: 'part4-session', mode: 'practice', problem_slug: problem.slug, language: 'java', status: 'in_progress', started_at: new Date().toISOString(), ended_at: null, problem: detail, latest_code: null } });
      return route.fulfill({ json: path === '/api/problems/two-sum' ? detail : [] });
    });
    try { await run(page, state); passed++; console.log('PASS:', name); }
    catch (error) { console.error('Scenario:', name, 'URL:', page.url(), 'Body:', await page.evaluate(() => document.body?.innerText.slice(0, 1600))); throw error; }
    finally { await context.close(); }
  }
  async function waitText(page, text) { await page.getByText(text, { exact: true }).first().waitFor(); }
  async function continueForm(page) { await page.getByRole('button', { name: 'Continue', exact: true }).click(); }
  try {
    await scenario('assessment required answers, payload, saving lock, failure preservation and retry navigation', { assessed: false, submitFailures: 1 }, async (page, state) => {
      await page.goto(`${base}/assessment`);
      const next = page.getByRole('button', { name: 'Continue', exact: true });
      await next.waitFor(); assert.equal(await next.isDisabled(), true);
      await page.getByText('Yes', { exact: true }).click(); await continueForm(page);
      await page.getByText('Java', { exact: true }).last().click(); await continueForm(page);
      await continueForm(page); // Explicitly accept the displayed comfort rating.
      await page.getByText('Hash Table', { exact: true }).click(); await continueForm(page);
      await page.getByText('3', { exact: true }).click(); await continueForm(page);
      await page.getByLabel('Companies (optional)').fill('Google'); await continueForm(page);
      await continueForm(page); // The date stays optional.
      assert.equal(await next.isDisabled(), true);
      await page.getByText('Intermediate', { exact: true }).click(); await continueForm(page);
      await page.getByText('Array', { exact: true }).click(); await continueForm(page);
      const finish = page.getByRole('button', { name: 'Finish & choose an interview' });
      assert.equal(await finish.isDisabled(), true);
      await page.getByText('This month', { exact: true }).click();
      let release;
      state.submitWait = new Promise(resolve => { release = resolve; });
      await finish.click();
      await page.getByRole('button', { name: 'Saving...' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Saving...' }).isDisabled(), true);
      assert.equal(state.posts.length, 1);
      assert.deepEqual(state.posts[0], answers);
      release(); await waitText(page, 'Please retry saving');
      assert.equal(new URL(page.url()).pathname, '/assessment');
      assert.equal(await page.getByRole('radio', { name: 'This month' }).isChecked(), true);
      state.submitWait = null;
      await finish.click(); await page.waitForURL(`${base}/interview`);
      await page.locator('.mode-page').waitFor();
      assert.equal(state.posts.length, 2);
      assert.deepEqual(state.posts[1], answers);
      await page.getByRole('button', { name: /Recommended/ }).first().click();
      await page.waitForURL(`${base}/recommended`);
    });
    for (const target of ['/dashboard', '/interview']) {
      await scenario(`${target}: missing assessment redirects once without a loop`, { assessed: false }, async page => {
        await page.goto(base + target); await page.waitForURL(`${base}/assessment`);
        await page.getByRole('heading', { name: 'Have you used LeetCode before?' }).waitFor();
        await page.reload(); await page.getByRole('heading', { name: 'Have you used LeetCode before?' }).waitFor();
        assert.equal(new URL(page.url()).pathname, '/assessment');
      });
      await scenario(`${target}: loading gate, saved assessment, error and retry`, { assessmentError: 503 }, async (page, state) => {
        let release;
        state.assessmentWait = new Promise(resolve => { release = resolve; });
        await page.goto(base + target); await waitText(page, 'Checking your assessment...');
        assert.equal(await page.locator('.app-sidebar-layout').count(), 0);
        release(); state.assessmentWait = null;
        await waitText(page, 'Assessment check failed');
        assert.equal(new URL(page.url()).pathname, target);
        state.assessmentError = null;
        await page.getByRole('button', { name: 'Try again', exact: true }).click();
        await page.locator('.app-sidebar-layout').waitFor();
        assert.equal(new URL(page.url()).pathname, target);
      });
    }
    await scenario('network failure stays on Dashboard and offers retry', { assessmentError: 'network' }, async page => {
      await page.goto(`${base}/dashboard`); await page.getByRole('alert').waitFor();
      assert.equal(new URL(page.url()).pathname, '/dashboard');
      assert.equal(await page.getByRole('button', { name: 'Try again' }).count(), 1);
    });
    await scenario('recommendations loading, error, retry, content, badge, saved Java, session mode and refresh', { recommendationError: true }, async (page, state) => {
      await page.goto(`${base}/recommended`); await waitText(page, 'Recommendation service unavailable');
      state.recommendationError = false;
      await page.getByRole('button', { name: 'Try again' }).click();
      await page.getByRole('button', { name: 'Two Sum' }).waitFor();
      await waitText(page, problem.reason); await waitText(page, 'Hash Table');
      assert.equal(await page.locator('.library-difficulty-easy').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(227, 240, 230)');
      await page.reload(); await page.getByRole('button', { name: 'Two Sum' }).waitFor();
      await page.getByRole('button', { name: 'Start interview', exact: true }).click();
      await page.waitForURL(/\/interview\/two-sum\?session=part4-session&mode=recommended/);
      assert.deepEqual(state.sessions, [{ problem_slug: 'two-sum', mode: 'practice', language: 'java' }]);
    });
    await scenario('recommendations request shows loading before content', {}, async (page, state) => {
      let release; state.recommendationWait = new Promise(resolve => { release = resolve; });
      await page.goto(`${base}/recommended`); await page.locator('[aria-busy="true"]').waitFor();
      assert.equal(await page.getByRole('button', { name: 'Two Sum' }).count(), 0);
      release(); await page.getByRole('button', { name: 'Two Sum' }).waitFor();
    });
    await scenario('empty recommendations and no-assessment call to action', { problems: [] }, async (page, state) => {
      await page.goto(`${base}/recommended`); await waitText(page, 'You’re all caught up.');
      state.assessed = false;
      await page.reload(); await waitText(page, 'Take the assessment for better picks.');
      await page.getByRole('link', { name: 'Take the Assessment' }).click();
      await page.waitForURL(`${base}/assessment`);
    });
    await scenario('session creation failure supports retry without losing recommendations', { sessionFailure: true }, async (page, state) => {
      await page.goto(`${base}/recommended`); await page.getByRole('button', { name: 'Start interview', exact: true }).click();
      await waitText(page, 'Could not start interview');
      assert.equal(new URL(page.url()).pathname, '/recommended');
      assert.equal(await page.getByRole('button', { name: 'Start interview', exact: true }).isEnabled(), true);
      state.sessionFailure = false;
      await page.getByRole('button', { name: 'Start interview', exact: true }).click();
      await page.waitForURL(/\/interview\/two-sum/);
    });
    await scenario('Recommended mobile layout fits the viewport', {}, async page => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${base}/recommended`); await page.getByRole('button', { name: 'Two Sum' }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    });
    await scenario('legacy Recommended selection links use the personalized page', {}, async page => {
      await page.goto(`${base}/interview?mode=recommended`);
      await page.waitForURL(`${base}/recommended`);
      await page.getByRole('button', { name: 'Two Sum' }).waitFor();
    });
    await scenario('assessment mobile layout and existing library/custom/surprise routes still render', {}, async page => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${base}/assessment`);
      await page.getByRole('heading', { name: 'Have you used LeetCode before?' }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await page.goto(`${base}/problems`); await page.getByRole('heading', { name: 'Problem library', exact: true }).waitFor();
      for (const mode of ['custom', 'surprise_me']) {
        await page.goto(`${base}/interview?mode=${mode}`);
        await page.locator('#mode-detail-heading').waitFor();
        assert.equal(new URL(page.url()).searchParams.get('mode'), mode);
      }
    });
    console.log(`PASS: ${passed} browser scenarios`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
