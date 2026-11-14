// Regression for the approved InterviewReport loading-state fix. No live API writes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let fail = true;
    await page.route('**/api/feedback/part5-report', route => route.fulfill({
      status: fail ? 503 : 200,
      json: fail ? { detail: 'Report temporarily unavailable' } : {
        session: { id: 'part5-report', status: 'completed', ended_at: '2026-10-30T12:00:00Z', problem_slug: 'two-sum' },
        problem: { title: 'Two Sum', difficulty: 'Easy' },
        feedback: { id: 'part5-feedback', technical_score: 80, overall_score: 80, report: { summary: 'Part 5 report loaded successfully.' }, strengths: ['Clear solution'], recommendations: ['Keep practicing'] },
      },
    }));
    await page.goto((process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173') + '/report/part5-report');
    await page.getByRole('heading', { name: 'Your report is not ready' }).waitFor();
    await page.getByText('Report temporarily unavailable', { exact: true }).waitFor();
    fail = false;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await page.getByRole('heading', { name: 'Two Sum report', exact: true }).waitFor();
    await page.getByText('Part 5 report loaded successfully.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('alert').count(), 0);
    await page.reload(); await page.getByRole('heading', { name: 'Two Sum report', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: InterviewReport failure, retry, saved report, refresh and no rendering errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
