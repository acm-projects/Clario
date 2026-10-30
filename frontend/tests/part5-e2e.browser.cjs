// Full HTTP journey through real FastAPI handlers with isolated in-memory storage.
// Start backend/tests/part5_server.py on port 8001 before running this script.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
const isolated = process.env.CLARIO_ISOLATED_URL || 'http://127.0.0.1:8001';
const results = { storage: 'isolated in-memory; no Supabase writes', checks: [], requests: [], console: [], runtimeErrors: [], unexpectedResponses: [], failedRequests: [] };
function pass(name, evidence) { results.checks.push({ name, status: 'PASS', evidence }); console.log('PASS:', name); }

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => results.runtimeErrors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) results.console.push({ type: message.type(), text: message.text(), location: message.location() }); });
  page.on('requestfailed', request => results.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => {
    if (response.status() >= 400) {
      const pathname = new URL(response.url()).pathname;
      if (!(pathname === '/api/assessment/me' && response.status() === 404) && !(pathname === '/run/tests' && response.status() === 502)) results.unexpectedResponses.push({ url: response.url(), status: response.status() });
    }
  });
  await page.route('**/__dev/profile', route => route.fetch({ url: isolated + '/__part5/profile' }).then(response => route.fulfill({ response })));
  async function forward(route) {
    const url = new URL(route.request().url());
    if (!(url.pathname.startsWith('/api/') || url.pathname === '/run/tests')) return route.fallback();
    const response = await route.fetch({ url: isolated + url.pathname + url.search });
    let body; try { body = await response.json(); } catch { body = null; }
    results.requests.push({ path: url.pathname, method: route.request().method(), status: response.status(), sent: route.request().postDataJSON(), received: body });
    await route.fulfill({ response });
  }
  await page.route('**/api/**', forward);
  await page.route('**/run/tests', forward);
  async function get(pathname) { const response = await context.request.get(isolated + pathname); assert.equal(response.status(), 200); return response.json(); }
  async function next() { await page.getByRole('button', { name: 'Continue', exact: true }).click(); }
  async function fillAssessment(topics) {
    await page.getByRole('heading', { name: 'Have you used LeetCode before?' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Continue', exact: true }).isDisabled(), true);
    await page.getByText('Yes', { exact: true }).click(); await next();
    await page.getByText('Python', { exact: true }).last().click(); await next();
    await next();
    for (const topic of topics) await page.getByText(topic, { exact: true }).click();
    await next(); await page.getByText('3', { exact: true }).click(); await next();
    await page.getByLabel('Companies (optional)').fill('Google'); await next();
    await next();
    assert.equal(await page.getByRole('button', { name: 'Continue', exact: true }).isDisabled(), true);
    await page.getByText('Intermediate', { exact: true }).click(); await next();
    await page.getByText('Array', { exact: true }).click(); await next();
    const finish = page.getByRole('button', { name: 'Finish & choose an interview' });
    assert.equal(await finish.isDisabled(), true);
    await page.getByText('This month', { exact: true }).click();
    await finish.click(); await page.waitForURL(`${base}/interview`);
    await page.locator('.mode-page').waitFor();
  }
  async function recommended() {
    await page.getByRole('button', { name: /Recommended/ }).first().click();
    await page.waitForURL(`${base}/recommended`);
    await page.getByRole('button', { name: 'Start interview', exact: true }).first().waitFor();
    return results.requests.filter(row => row.path === '/api/recommendations').at(-1).received;
  }
  function verifyRanking(data, topics) {
    assert.equal(data.has_assessment, true);
    assert.equal(data.problems.length, 5);
    for (const problem of data.problems) {
      const matches = problem.topics.filter(topic => topics.includes(topic));
      assert.ok(matches.length > 0, `Recommendation ${problem.slug} must match selected struggle topics`);
      for (const topic of matches) assert.ok(problem.reason.includes(topic));
      assert.equal(problem.difficulty, 'Medium');
    }
  }
  try {
    assert.equal((await get('/__part5/state')).user_assessments.length, 0, 'Restart isolated server for a fresh run');
    await page.goto(`${base}/dashboard`);
    await page.waitForURL(`${base}/assessment`);
    await page.getByRole('heading', { name: 'Have you used LeetCode before?' }).waitFor();
    assert.ok(results.requests.some(row => row.path === '/api/assessment/me' && row.status === 404));
    await page.reload(); await page.getByRole('heading', { name: 'Have you used LeetCode before?' }).waitFor();
    pass('New user redirect and stable Assessment page', 'Real GET /api/assessment/me returned 404; Dashboard redirected; refresh stayed on Assessment.');
    await fillAssessment(['Hash Table', 'Binary Search']);
    const initial = await get('/api/assessment/me');
    assert.deepEqual(initial.answers, { experience: 'intermediate', confident_topics: ['Array'], struggle_topics: ['Hash Table', 'Binary Search'], companies: ['Google'], language: 'python3', timeline: 'this_month' });
    assert.equal((await get('/__part5/state')).user_assessments.length, 1);
    pass('Required questions, payload, backend save and Selection navigation', 'POST saved exact answers in isolated store; GET returned them; UI arrived at /interview. Live Supabase writes not tested.');
    const first = await recommended(); verifyRanking(first, initial.answers.struggle_topics);
    for (const problem of first.problems) {
      await page.getByRole('button', { name: problem.title, exact: true }).waitFor();
      assert.ok(await page.getByText(problem.reason, { exact: true }).count());
    }
    const colors = await page.locator('[class*="library-difficulty-"]').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor));
    assert.ok(colors.every(color => color === 'rgb(255, 241, 203)'));
    pass('Recommended page and genuine backend personalization', { firstProblems: first.problems, assessment: initial.answers, badgeColors: colors });
    const chosen = first.problems[0];
    await page.getByRole('button', { name: chosen.title, exact: true }).click();
    await page.waitForURL(/\/interview\/[^/]+\?session=/);
    const sessionId = new URL(page.url()).searchParams.get('session');
    assert.equal(new URL(page.url()).pathname, '/interview/' + chosen.slug);
    assert.equal(new URL(page.url()).searchParams.get('mode'), 'recommended');
    const savedSession = await get('/api/sessions/' + sessionId);
    assert.equal(savedSession.mode, 'practice'); assert.equal(savedSession.language, 'python3'); assert.equal(savedSession.problem_slug, chosen.slug);
    await page.getByRole('heading', { name: new RegExp(chosen.title) }).waitFor();
    pass('Interview room, chosen problem, saved Python and compatible session mode', { url: page.url(), sessionId, mode: savedSession.mode, language: savedSession.language });
    // Verify editor rendering and controls separately from paid voice/external Piston.
    try {
      await page.locator('.monaco-editor').first().waitFor({ timeout: 20000 });
      await page.locator('.monaco-editor .view-lines').first().click();
      await page.keyboard.press('Control+End');
      await page.keyboard.press('Enter');
      await page.keyboard.type('# Part 5 isolated editor test');
      await page.waitForFunction(() => window.monaco?.editor.getModels().some(model => model.getValue().includes('Part 5 isolated editor test')));
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      await page.waitForFunction(starter => window.monaco?.editor.getModels().some(model => model.getLanguageId() === 'python' && model.getValue() === starter), savedSession.problem.starter_code.python3);
      assert.equal(await page.getByRole('button', { name: 'Python 3', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.getByRole('button', { name: 'Java', exact: true }).isDisabled(), true);
      pass('Monaco editor and Reset/language controls', 'Editor rendered, accepted typing, Reset restored starter, Python active and Java locked.');
    } catch (error) {
      const editorState = await page.evaluate(() => ({ text: document.querySelector('.monaco-editor .view-lines')?.textContent, models: window.monaco?.editor.getModels().map(model => model.getValue()) }));
      results.checks.push({ name: 'Monaco editor and Reset/language controls', status: 'FAIL', evidence: error.message, editorState });
      console.error('Editor state:', editorState);
      console.error('FAIL: editor controls:', error.message);
    }
    await page.locator('[data-sandbox-run]').click();
    await page.getByText('Isolated test: external code execution is disabled', { exact: true }).waitFor();
    assert.equal((await get('/__part5/state')).code_snapshots.length, 1);
    pass('Run control, snapshot save and execution-error display', 'Real Run handler saved a snapshot and displayed the deliberately disabled executor response. Actual Piston execution NOT TESTED.');
    await page.goto(`${base}/assessment`);
    // Tree is an available question option; Graph is not in this assessment.
    await fillAssessment(['Dynamic Programming', 'Tree']);
    const updated = await get('/api/assessment/me');
    assert.equal(updated.id, initial.id); assert.equal((await get('/__part5/state')).user_assessments.length, 1);
    assert.deepEqual(updated.answers.struggle_topics, ['Dynamic Programming', 'Tree']);
    const second = await recommended(); verifyRanking(second, updated.answers.struggle_topics);
    assert.ok(second.problems.every(problem => !first.problems.some(old => old.slug === problem.slug)));
    pass('Retake updates same assessment and changes ranking/reasons', { sameAssessmentId: updated.id, updated: updated.answers, secondProblems: second.problems });
    assert.equal(results.runtimeErrors.length, 0, JSON.stringify(results.runtimeErrors));
    assert.equal(results.unexpectedResponses.length, 0, JSON.stringify(results.unexpectedResponses));
    assert.equal(results.failedRequests.length, 0, JSON.stringify(results.failedRequests));
    pass('No unexpected browser runtime/network errors', { console: results.console, expectedStatuses: ['404 new-user assessment', '502 disabled isolated executor'] });
  } finally {
    const output = path.join(os.tmpdir(), 'clario-part5-evidence.json');
    fs.writeFileSync(output, JSON.stringify(results, null, 2));
    console.log('Evidence:', output);
    await browser.close();
  }
  if (results.checks.some(check => check.status === 'FAIL')) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
