import test from 'node:test';
import assert from 'node:assert/strict';
import { LiveCodeSnapshots } from '../src/lib/liveCodeSnapshots.ts';

const snapshot = (code, extra = {}) => ({ language: 'python', files: { 'main.py': code }, ...extra });
const payload = context => JSON.parse(context.slice(context.indexOf('\n') + 1));

test('connection starts with the latest snapshot including edits made while offline', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sync = new LiveCodeSnapshots(), sent = [];
  sync.update(snapshot('old'));
  sync.update(snapshot('latest'));
  t.mock.timers.tick(5000);
  sync.connect(context => sent.push(context));
  assert.equal(sent.length, 1);
  assert.equal(payload(sent[0]).files['main.py'], 'latest');
  assert.match(sent[0], /do not interrupt/);
  sync.disconnect();
});

test('typing bursts share only their newest state at one second', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sync = new LiveCodeSnapshots(), sent = [];
  sync.connect(context => sent.push(context));
  sync.update(snapshot('p'));
  t.mock.timers.tick(300);
  sync.update(snapshot('print(1)'));
  t.mock.timers.tick(699);
  assert.equal(sent.length, 0);
  t.mock.timers.tick(1);
  assert.equal(payload(sent[0]).files['main.py'], 'print(1)');
  sync.update(snapshot('print(1)'));
  t.mock.timers.tick(3000);
  assert.equal(sent.length, 1);
  sync.disconnect();
});

test('continuous typing sends the latest edit every second', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sync = new LiveCodeSnapshots(), sent = [];
  sync.connect(context => sent.push(context));
  sync.update(snapshot('0'));
  for (let i = 1; i <= 2; i++) {
    t.mock.timers.tick(400);
    sync.update(snapshot(String(i)));
  }
  t.mock.timers.tick(200);
  assert.equal(sent.length, 1);
  assert.equal(payload(sent[0]).files['main.py'], '2');
  sync.update(snapshot('3'));
  t.mock.timers.tick(600);
  sync.update(snapshot('4'));
  t.mock.timers.tick(399);
  assert.equal(sent.length, 1);
  t.mock.timers.tick(1);
  assert.equal(sent.length, 2);
  assert.equal(payload(sent[1]).files['main.py'], '4');
  sync.disconnect();
});

test('disconnect cancels queued sends; reconnect receives latest edits and all files', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sync = new LiveCodeSnapshots(), old = [], resumed = [];
  sync.connect(context => old.push(context));
  sync.update(snapshot('pending'));
  sync.disconnect();
  sync.update({ language: 'cpp', activeFile: 'cart.hpp', files: { 'cart.hpp': 'new cart', 'checkout.hpp': 'new checkout' } });
  t.mock.timers.tick(5000);
  assert.equal(old.length, 0);
  sync.connect(context => resumed.push(context));
  assert.deepEqual(payload(resumed[0]), { language: 'cpp', activeFile: 'cart.hpp', files: { 'cart.hpp': 'new cart', 'checkout.hpp': 'new checkout' } });
  sync.disconnect();
});

test('clearing code and reverting to a previously sent snapshot are handled correctly', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sync = new LiveCodeSnapshots(), sent = [];
  sync.update(snapshot('original'));
  sync.connect(context => sent.push(context));
  sync.update(snapshot('temporary'));
  sync.update(snapshot('original'));
  t.mock.timers.tick(2000);
  assert.equal(sent.length, 1);
  sync.update(snapshot(''));
  sync.flush();
  assert.equal(payload(sent[1]).files['main.py'], '');
  sync.disconnect();
});

test('failed sends are retried without dropping the newest edit or escaping into the editor', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sync = new LiveCodeSnapshots(), sent = [];
  let attempts = 0;
  sync.update(snapshot('first'));
  sync.connect(context => { if (++attempts === 1) throw new Error('socket closed'); sent.push(context); });
  sync.update(snapshot('newest'));
  t.mock.timers.tick(1000);
  assert.equal(payload(sent[0]).files['main.py'], 'newest');
  t.mock.timers.tick(3000);
  assert.equal(attempts, 2);
  sync.disconnect();
});
