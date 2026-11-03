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
  async function rate(page, score) {
    await page.getByRole('slider').focus();
    await page.getByRole('slider').press('Home');
    for (let i = 1; i < score; i++) await page.getByRole('slider').press('ArrowRight');
  }
  try {
    await scenario('custom fields, required ratings, language changes, complete submission and saved answers', {assessed: false}, async (page, state) => {
      await page.goto(`${base}/assessment`);
      const next = page.getByRole('button', {name: 'Continue', exact: true});
      await page.getByText('Yes', {exact: true}).click(); await continueForm(page);
      await page.getByText('Other', {exact: true}).click();
      const used = page.getByLabel('Which language have you used?', {exact: true});
      await used.waitFor(); assert.ok(await next.isDisabled());
      await used.fill('   '); assert.ok(await next.isDisabled());
      await used.fill('Go'); await continueForm(page);
      await page.getByText('Other', {exact: true}).click();
      const custom = page.getByLabel('Your preferred programming language');
      await custom.waitFor(); assert.ok(await next.isDisabled());
      await custom.fill('C++'); await continueForm(page);
      await page.getByRole('heading', {name: 'How comfortable are you with C++?'}).waitFor();
      assert.ok(await next.isDisabled()); assert.equal(await page.getByRole('slider').getAttribute('min'), '1');
      await rate(page, 7);
      await page.getByRole('button', {name: 'Back', exact: true}).click();
      await page.getByText('Java', {exact: true}).click();
      assert.equal(await custom.count(), 0);
      await continueForm(page);
      await page.getByRole('heading', {name: 'How comfortable are you with Java?'}).waitFor();
      assert.ok(await next.isDisabled());
      await page.getByRole('button', {name: 'Back', exact: true}).click();
      await page.getByText('Other', {exact: true}).click(); assert.equal(await custom.inputValue(), '');
      await custom.fill('C++'); await continueForm(page); await rate(page, 7); await continueForm(page);
      await continueForm(page); // optional struggle topics
      await page.getByText('3', {exact: true}).click(); await continueForm(page);
      await continueForm(page); // company
      await page.getByLabel('Interview date (optional)').fill('2027-01-15'); await continueForm(page);
      await page.getByText('Intermediate', {exact: true}).click(); await continueForm(page);
      assert.equal(await page.getByText('When are you preparing to interview?', {exact: true}).count(), 0);
      const progress = page.getByRole('progressbar');
      assert.equal(Number(await progress.getAttribute('aria-valuenow')) + 1, Number(await progress.getAttribute('aria-valuemax')));
      await page.getByRole('button', {name: 'Finish & choose an interview'}).click();
      await page.waitForURL('**/interview');
      assert.equal(state.posts.length, 1);
      assert.equal(state.posts[0].preferred_language, 'C++');
      assert.equal(state.posts[0].other_language_used, 'Go');
      assert.equal(state.posts[0].language_comfort, 7);
      assert.equal(state.posts[0].language, 'python3');
      assert.equal(state.posts[0].timeline, undefined);
      await page.goto(`${base}/recommended`);
      await page.getByText('Two Sum', {exact: true}).first().waitFor();
    });
    for (const coded of [false, true]) await scenario(`non-LeetCode path coded=${coded} has required language comfort`, {}, async page => {
      await page.goto(`${base}/assessment`);
      await page.getByText('No', {exact: true}).click(); await continueForm(page);
      await page.getByText(coded ? 'Yes' : 'No', {exact: true}).click(); await continueForm(page);
      if (coded) {
        await page.getByText('Other', {exact: true}).click();
        await page.getByLabel('Which language have you used?', {exact: true}).fill('Rust');
        await page.getByText('Both', {exact: true}).click();
        assert.equal(await page.getByLabel('Which language have you used?', {exact: true}).count(), 0);
        await page.getByText('Other', {exact: true}).click();
        assert.equal(await page.getByLabel('Which language have you used?', {exact: true}).inputValue(), '');
        await page.getByText('Both', {exact: true}).click(); await continueForm(page);
      }
      await page.locator('label').filter({has: page.locator('input[value="Python"]')}).click(); await continueForm(page);
      await page.getByRole('heading', {name: 'How comfortable are you with Python?'}).waitFor();
      assert.ok(await page.getByRole('button', {name:'Continue',exact:true}).isDisabled());
      await rate(page, 1); await continueForm(page);
    });
    console.log(`${passed} scenarios passed`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode = 1;});
