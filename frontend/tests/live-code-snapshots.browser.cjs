/* Local UI regression: voice transport and APIs are fixtures; no account writes. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, permissions: ['microphone', 'camera'] });
    const base = process.env.CLARIO_TEST_URL || 'http://127.0.0.1:5173';
    const contexts = () => page.evaluate(() => window.__calls.flatMap(call => call.contexts));
    const snapshots = async () => (await contexts()).filter(text => text.startsWith('Background editor update:')).map(text => JSON.parse(text.slice(text.indexOf('\n') + 1)));
    let runs = 0, saves = 0;
    // Serve the installed Monaco build so this test does not depend on CDN access.
    await page.route(/https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@[^/]+\/min\/vs\/(.*)/, route => {
      const relative = new URL(route.request().url()).pathname.split('/min/vs/')[1];
      return route.fulfill({path:require('node:path').join(__dirname,'../node_modules/monaco-editor/min/vs',relative)});
    });
    await page.route('**/node_modules/.vite/deps/@elevenlabs_client.js*', route => route.fulfill({ contentType: 'application/javascript', body: `
      export const Conversation = {startSession: async options => {
        for (const key of ['repo_name', 'bug_summary', 'root_cause']) {
          if (!options.dynamicVariables?.[key]) throw new Error('Missing agent variable: ' + key);
        }
        if (!options.signedUrl) throw new Error('Authenticated voice session is required');
        const call = {contexts: [], cues: []};
        (window.__calls ??= []).push(call);
        window.__voiceOptions = options;
        options.onModeChange({mode:'listening'});
        return {sendContextualUpdate: text => call.contexts.push(text),sendUserMessage: text => call.cues.push(text),getInputVolume:()=>0,endSession:async()=>options.onDisconnect()};
      }};` }));
    await page.route('**/__dev/profile', route => route.fulfill({ json: { user: { id: 'snapshot-test', email: 'snapshot@example.test' }, profile: { id: 'snapshot-test', display_name: 'Snapshot Tester', assessment_completed: true, preferred_language: 'Python' } } }));
    await page.route('**/voice/*session*', route => route.fulfill({ json: { signed_url: 'wss://example.test', variables: { problem_title: 'Fixture', problem_description: 'Debug.', repo_name: 'Fixture', bug_summary: 'Debug.', root_cause: 'The fixture starts with an incorrect cart total.' } } }));
    await page.route(/\/api\/repo-challenges\/snapshot-fixture(?:\?.*)?$/, route => route.fulfill({ json: {
      id: 'snapshot-fixture', title: 'Snapshot repository', difficulty: 'Medium', language: 'python', languages: ['python', 'cpp'], category: 'Debugging', estimatedMinutes: 20,
      description: 'Debug the cart.', objective: 'Repair it.', expectedBehavior: 'Correct totals.', constraints: [], entrypoint: 'main.py', files: [
        {path:'main.py',content:'print(1)',language:'python',readOnly:false},
        {path:'cart.py',content:'total = 1',language:'python',readOnly:false},
        {path:'README.md',content:'Read-only instructions',language:'markdown',readOnly:true},
      ],
    } }));
    await page.route('**/run/tests', route => { runs++; return route.fulfill({ json: {} }); });
    await page.route('**/api/repo-challenges/*/run', route => { runs++; return route.fulfill({ json: {} }); });
    const problem = { slug: 'snapshot-fixture', leetcode_id: 1, title: 'Snapshot question', difficulty: 'Easy', topics: [], description_html: '<p>Write a solution.</p>', example_testcases: '', starter_code: { python3: 'class Solution: pass', java: 'class Solution {}' } };
    await page.route('**/api/sessions/snapshot-session', route => route.fulfill({ json: { id: 'snapshot-session', problem_slug: problem.slug, language: 'python3', mode: 'custom', started_at: new Date().toISOString(), ended_at: null, latest_code: null, problem } }));
    await page.route('**/api/sessions/snapshot-session/snapshots', route => { saves++; return route.fulfill({ json: {} }); });

    async function edit(path, values) {
      await page.waitForFunction(path => window.monaco?.editor?.getModels().some(model => model.uri.path.endsWith(path)), path, { timeout: 45000 });
      await page.locator('.monaco-editor').waitFor();
      // A Monaco model exists before React's onMount subscription is installed.
      await page.waitForTimeout(150);
      await page.evaluate(({ path, values }) => {
        const model = window.monaco.editor.getModels().find(model => model.uri.path.endsWith(path));
        for (const value of values) model.setValue(value);
      }, { path, values });
    }
    async function waitSnapshot(file, code) {
      try { await page.waitForFunction(({ file, code }) => {
        const text = window.__calls?.at(-1)?.contexts.filter(text => text.startsWith('Background editor update:')).at(-1);
        return text && JSON.parse(text.slice(text.indexOf('\n') + 1)).files[file] === code;
      }, { file, code }); } catch (error) {
        console.log(await page.evaluate(() => ({ contexts: window.__calls, models: window.monaco?.editor.getModels().map(model => ({ uri: model.uri.toString(), code: model.getValue() })), drafts: Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.includes('repo-draft'))) })));
        throw error;
      }
    }
    await page.goto(`${base}/interview/repo/snapshot-fixture`);
    await waitSnapshot('main.py', 'print(1)');
    assert.deepEqual((await snapshots()).at(-1).files, { 'main.py': 'print(1)', 'cart.py': 'total = 1' });
    const initialCount = (await snapshots()).length;
    await edit('/main.py', ['print(2)', 'print(3)', 'print(4)']);
    await waitSnapshot('main.py', 'print(4)');
    assert.equal((await snapshots()).length, initialCount + 1);
    await page.locator('[data-repository-file="cart.py"]').click();
    await edit('/cart.py', ['total = 42']);
    await waitSnapshot('cart.py', 'total = 42');
    assert.equal((await snapshots()).at(-1).files['main.py'], 'print(4)');
    await page.evaluate(() => window.__voiceOptions.onError('Connection lost'));
    await edit('/cart.py', ['total = 43']);
    await page.waitForFunction(() => window.__calls.length === 2);
    await waitSnapshot('cart.py', 'total = 43');
    assert.match((await contexts()).join('\n'), /Resume this ongoing interview/);
    assert.equal(await page.evaluate(() => window.__calls.flatMap(call => call.cues).length), 0);
    assert.equal(runs, 0); assert.equal(saves, 0);

    await page.goto(`${base}/interview/snapshot-fixture?session=snapshot-session`);
    await waitSnapshot('solution.py', 'class Solution: pass');
    await edit('/solution.python3', ['class Solution:\n    def solve(self):\n        return 42']);
    await waitSnapshot('solution.py', 'class Solution:\n    def solve(self):\n        return 42');
    await edit('/solution.python3', ['']);
    await waitSnapshot('solution.py', '');
    assert.equal(saves, 0); assert.equal(runs, 0);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page.getByText('Final code submitted. Follow-up questions are now in progress.').waitFor();
    assert.equal(saves, 1); assert.equal(runs, 0);
    assert.equal(await page.evaluate(() => window.__calls.flatMap(call => call.cues).length), 1);
    assert.match((await contexts()).at(-1), /submitted the following code snapshot/);
    console.log('PASS: both editors share automatic snapshots; bursts coalesce; multi-file context, clears, reconnect/latest edits, and manual review work without extra user turns, test runs or autosave writes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
