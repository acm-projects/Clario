const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(15000);
    const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
    // Serve Monaco from the installed package so this check does not depend on a CDN.
    await page.route('**/monaco-editor@*/min/vs/**', route => {
      const relative = new URL(route.request().url()).pathname.split('/min/vs/')[1];
      return route.fulfill({ path: path.join(__dirname, '../node_modules/monaco-editor/min/vs', relative) });
    });
    const starter = 'print("fresh starter")\n';
    const challenge = { id: 'fresh-fixture', title: 'Fresh repository', difficulty: 'Easy', language: 'python', languages: ['python', 'cpp'], topics: [], category: 'Debugging', estimatedMinutes: 15, description: 'Repair the fixture.', objective: 'Repair.', expectedBehavior: 'Correct.', constraints: [], entrypoint: 'main.py', files: [{ path: 'main.py', content: starter, language: 'python', readOnly: false }] };
    await page.addInitScript(challenge => {
      const key = 'clario:repo-draft:v1:fresh-test:fresh-fixture';
      localStorage.setItem(key, JSON.stringify({ starter: JSON.stringify(challenge.files), files: { 'main.py': '# old interview' } }));
      sessionStorage.setItem(key + ':submitted', JSON.stringify({ 'main.py': '# old submitted interview' }));
    }, challenge);
    await page.route('**/__dev/profile', route => route.fulfill({ json: { user: { id: 'fresh-test', email: 'fresh@example.test' }, profile: { id: 'fresh-test', display_name: 'Fresh Tester', assessment_completed: true, preferred_language: 'Python', starting_difficulty: 'Easy' } } }));
    await page.route('**/voice/*session*', route => route.fulfill({ status: 403, json: { detail: 'Voice not configured for this fixture' } }));
    await page.route(/\/api\/repo-challenges\/fresh-fixture(?:\?.*)?$/, route => route.fulfill({ json: challenge }));
    let failFinish = true;
    await page.route('**/api/repo-challenges/fresh-fixture/finish', route => route.fulfill(failFinish ? { status: 503, json: { detail: 'Try again' } } : { json: { saved: true, submission_id: 'fresh-report', message: 'Saved' } }));
    await page.route('**/api/sessions/**', route => route.fulfill({ status: 404, json: { detail: 'Fixture report' } }));
    const openEditor = async () => {
      const information = page.getByRole('dialog').getByLabel('Interview information');
      await information.waitFor();
      await information.evaluate(node => { node.scrollTop = node.scrollHeight; node.dispatchEvent(new Event('scroll')); });
      await page.getByRole('button', { name: 'Start interview', exact: true }).click();
      await page.getByRole('heading', { name: challenge.title, exact: true }).waitFor();
      await page.waitForFunction(() => window.monaco?.editor?.getModels().some(model => model.uri.path.endsWith('/main.py')), null, { timeout: 60000 });
    };
    const code = () => page.evaluate(() => window.monaco.editor.getModels().find(model => model.uri.path.endsWith('/main.py')).getValue());
    const edit = value => page.evaluate(value => window.monaco.editor.getModels().find(model => model.uri.path.endsWith('/main.py')).setValue(value), value);
    const drafts = () => page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('clario:repo-draft:v2:fresh-test:')));
    await page.goto(`${base}/interview/repo/fresh-fixture`);
    await openEditor();
    console.log('Checking fresh starter and refresh');
    assert.equal(await code(), starter);
    await edit('# previous interview\n');
    await page.waitForFunction(() => Object.values(localStorage).some(value => value.includes('# previous interview')));
    await page.getByLabel('Repository language').selectOption('cpp');
    await openEditor();
    await page.waitForFunction(() => window.monaco?.editor?.getModels().some(model => model.uri.path.includes('/cpp/')));
    await page.getByLabel('Repository language').selectOption('python');
    await openEditor();
    await page.waitForFunction(() => window.monaco?.editor?.getModels().some(model => model.uri.path.includes('/python/') && model.getValue() === '# previous interview\n'));
    await page.reload();
    await openEditor();
    assert.equal(await code(), '# previous interview\n', 'Refresh preserves the current interview');
    console.log('Checking failed finish and successful finish');
    await page.getByRole('button', { name: 'End interview', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Try again' }).waitFor();
    assert((await drafts()).length > 0, 'Failed finish retains the draft');
    failFinish = false;
    await page.getByRole('button', { name: 'End interview', exact: true }).click();
    await page.waitForURL('**/report/fresh-report');
    console.log('Checking next interview');
    assert.deepEqual(await drafts(), [], 'Finish and unmount leave no completed draft');
    await page.goto(`${base}/interview/repo/fresh-fixture`);
    await openEditor();
    assert.equal(await code(), starter, 'Next interview starts fresh');
    assert.equal(await page.getByRole('button', { name: 'Submit', exact: true }).isEnabled(), true);
    console.log('PASS: old drafts ignored; language switching and refresh retain active code; failed finish preserves drafts; completed interviews clear drafts; the next interview starts fresh.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
