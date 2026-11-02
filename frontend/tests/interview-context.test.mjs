import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRun, summarizeRunError } from '../src/lib/runContext.ts';
import { createSnapshotWriter } from '../src/lib/snapshotWriter.ts';

const result = {
  status: 'Wrong Answer', passed: 2, total: 3,
  cases: [{ case: 3, expected: '[0,1]', output: '[]', passed: false }],
  stdout: 'PRIVATE_STDOUT_DO_NOT_SEND', error: null,
};

test('context includes counts and failing case but never stdout', () => {
  const summary = summarizeRun(result);
  assert.match(summary, /2 of 3 tests passed/);
  assert.match(summary, /Test 3 failed: expected \[0,1\], got \[\]/);
  assert.ok(!summary.includes(result.stdout));
});

test('context stays bounded with large arrays and runtime traceback', () => {
  const summary = summarizeRun({ ...result, error: 'IndexError on line 8. '.repeat(1000),
    cases: [{ ...result.cases[0], expected: 'a'.repeat(10000) }] });
  assert.ok(summary.length <= 600);
  assert.match(summary, /IndexError on line 8/);
});

test('compile failure without cases still includes error; no invented pass counts', () => {
  assert.match(summarizeRun({ ...result, status: 'Compile Error', passed: 0, cases: [], error: 'SyntaxError' }), /SyntaxError/);
  assert.match(summarizeRunError(new Error('HTTP 502')), /no test verdict is available/);
});

test('unchanged autosaves are skipped but Run forces a snapshot', async () => {
  const calls = [];
  const save = createSnapshotWriter(async (...args) => calls.push(args));
  await save('session', 'code', false);
  await save('session', 'code', false);
  await save('session', 'code', true);
  assert.equal(calls.length, 2);
});

test('pending autosave cannot overwrite newer Run or final code', async () => {
  const calls = [];
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  const save = createSnapshotWriter(async (id, code) => {
    calls.push(code);
    if (code === 'old') await blocked;
  });
  const first = save('session', 'old', false);
  const run = save('session', 'run');
  const final = save('session', 'final');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, ['old']);
  release();
  await Promise.all([first, run, final]);
  assert.deepEqual(calls, ['old', 'run', 'final']);
});

test('failed save can retry identical code and does not block later saves', async () => {
  let attempts = 0;
  const save = createSnapshotWriter(async () => { if (++attempts === 1) throw new Error('offline'); });
  await assert.rejects(save('session', 'code', false));
  await save('session', 'code', false);
  assert.equal(attempts, 2);
});

test('different sessions have independent change detection', async () => {
  let calls = 0;
  const save = createSnapshotWriter(async () => { calls++; });
  await save('a', 'same', false);
  await save('b', 'same', false);
  assert.equal(calls, 2);
});

// Code-change notifications only go to an active call and are throttled per session.
const { createCodeActivityNotifier, CODE_ACTIVITY_UPDATE } = await import('../src/lib/codeActivity.ts');

test('code activity sends immediately, then at most once per 30 seconds', () => {
  let now = 0, calls = 0;
  const throttle = createCodeActivityNotifier(() => now);
  const notify = (id) => throttle(id, () => { calls++; return true; });
  assert.equal(notify('a'), true);
  now = 10_000;
  assert.equal(notify('a'), false);
  now = 29_999;
  assert.equal(notify('a'), false);
  now = 30_000;
  assert.equal(notify('a'), true);
  assert.equal(calls, 2);
});

test('inactive or failed sends do not throttle a later successful notification', () => {
  let active = false;
  const throttle = createCodeActivityNotifier(() => 0);
  const notify = (id) => throttle(id, () => active);
  assert.equal(notify('a'), false);
  active = true;
  assert.equal(notify('a'), true);
});

test('new sessions have an independent notification allowance', () => {
  const throttle = createCodeActivityNotifier(() => 0);
  const notify = (id) => throttle(id, () => true);
  assert.equal(notify('a'), true);
  assert.equal(notify('b'), true);
  assert.equal(notify('a'), false);
});

test('only persisted changed code is eligible for a code-activity notification', async () => {
  const save = createSnapshotWriter(async (_, code) => {
    if (code === 'error') throw new Error('offline');
  });
  assert.equal(await save('a', 'code', false), true);
  assert.equal(await save('a', 'code', false), false);
  await assert.rejects(save('a', 'error', false));
  assert.match(CODE_ACTIVITY_UPDATE, /get_current_code/);
  assert.ok(CODE_ACTIVITY_UPDATE.length < 600);
});

test('completed session stops queued and subsequent snapshot requests', async () => {
  let requests = 0;
  const completed = Object.assign(new Error('Session already completed'), { status: 400 });
  const save = createSnapshotWriter(async () => { requests++; throw completed; });
  const outcomes = await Promise.allSettled([
    save('done', 'first', false), save('done', 'queued', false), save('done', 'final'),
  ]);
  assert.ok(outcomes.every(outcome => outcome.status === 'rejected'));
  await assert.rejects(save('done', 'another edit', false));
  assert.equal(requests, 1);
});

test('unrelated HTTP 400 errors do not permanently disable saving', async () => {
  let requests = 0;
  const save = createSnapshotWriter(async () => {
    if (++requests === 1) throw Object.assign(new Error('Different validation error'), { status: 400 });
  });
  await assert.rejects(save('a', 'code', false));
  assert.equal(await save('a', 'code', false), true);
  assert.equal(requests, 2);
});
