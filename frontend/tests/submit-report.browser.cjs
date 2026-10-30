const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const id = 'b8c0ab0d-056c-46b2-8892-7a043d85f310';
    const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
    const session = { id, status: 'completed', ended_at: '2026-10-30T18:00:00Z', problem_slug: 'repo-debugging:example' };
    const problem = { title: 'Example repository', difficulty: 'Easy' };
    const feedback = { id, technical_score: 60, reasoning_score: null, communication_score: null, overall_score: 60, strengths: ['Scoped change'], weaknesses: ['Missing validation'], recommendations: ['Check edge cases'], report: { summary: 'Your submitted repository was reviewed.', evidence_limitations: ['No candidate transcript recorded.'] } };
    await page.route('**/__dev/profile', route => route.fulfill({ json: { user: { id: 'submit-test', email: 'submit@example.test' }, profile: { id: 'submit-test', display_name: 'Submit Tester', assessment_completed: true } } }));
    await page.route('**/api/repo-challenges/example', route => route.fulfill({ json: { id: 'example', ...problem, language: 'python', category: 'Debugging', estimatedMinutes: 20, description: 'Investigate the reported behavior.', objective: 'Fix the bug.', expectedBehavior: 'Correct output.', constraints: [], entrypoint: 'main.py', files: [{ path: 'main.py', content: 'print(1)', language: 'python', readOnly: false }] } }));
    let stored = false;
    let generated = 0;
    let release;
    const waiting = new Promise(resolve => { release = resolve; });
    await page.route('**/api/repo-challenges/example/submit', async route => {
      assert.equal(route.request().postDataJSON().files['main.py'], 'print(1)');
      stored = true;
      await route.fulfill({ json: { success: false, passed: 0, failed: 1, total: 1, tests: [], error: null, submission: { saved: true, submission_id: id, message: 'Saved' } } });
    });
    await page.route(`**/api/feedback/${id}`, async route => {
      assert.equal(stored, true);
      if (route.request().method() === 'GET') return route.fulfill({ json: { session, problem, feedback: generated > 0 ? feedback : null } });
      generated++;
      await waiting;
      await route.fulfill({ json: feedback });
    });
    await page.goto(`${base}/interview/repo/example`);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page.waitForURL(`**/report/${id}`);
    await page.getByText('Gemini is reviewing your interview and preparing your report...').waitFor();
    release();
    await page.getByText('Your submitted repository was reviewed.', { exact: true }).waitFor();
    await page.reload();
    await page.getByText('Your submitted repository was reviewed.', { exact: true }).waitFor();
    assert.equal(generated, 1);
    const codingId = '390d0554-8f0b-435b-95f6-6c1071c48299';
    const calls = [];
    await page.route('**/api/problems/two-sum', route => route.fulfill({ json: { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topics: [], description_html: '<p>Find two indices.</p>', starter_code: { python3: 'class Solution: pass' }, example_testcases: '' } }));
    await page.route('**/api/sessions', route => { calls.push('create'); return route.fulfill({ json: { id: codingId, problem_slug: 'two-sum', language: 'python3', status: 'in_progress' } }); });
    await page.route(`**/api/sessions/${codingId}/snapshots`, route => { calls.push('snapshot'); assert.equal(route.request().postDataJSON().code, 'class Solution: pass'); return route.fulfill({ json: {} }); });
    await page.route(`**/api/sessions/${codingId}/end`, route => { calls.push('end'); return route.fulfill({ json: { id: codingId, status: 'completed' } }); });
    await page.route(`**/api/feedback/${codingId}`, route => {
      if (route.request().method() === 'GET') return route.fulfill({ json: { session: { ...session, id: codingId }, problem: { title: 'Two Sum' }, feedback: null } });
      calls.push('generate'); return route.fulfill({ json: feedback });
    });
    await page.goto(`${base}/interview/two-sum`);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page.waitForURL(`**/report/${codingId}`);
    await page.getByText('Your submitted repository was reviewed.', { exact: true }).waitFor();
    assert.deepEqual(calls, ['create', 'snapshot', 'end', 'generate']);
    console.log('Submit saves evidence, redirects to its report, generates automatically, and reuses saved feedback after reload.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
