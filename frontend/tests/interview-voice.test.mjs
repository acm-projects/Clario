import test from 'node:test';
import assert from 'node:assert/strict';
import { SilenceTracker } from '../src/lib/interviewVoice.ts';

test('silence intervals exclude interviewer speech and unmonitored gaps', () => {
  const tracker = new SilenceTracker();
  for (let i = 0; i < 10; i++) tracker.sample((i + 1) * .2, .2, 0, true);
  tracker.sample(2.2, .2, 0, false);
  tracker.sample(10, 7.8, 0, true);
  tracker.sample(10.2, .2, .5, true);
  tracker.close();
  assert.equal(tracker.capture.silence_intervals.length, 1);
  assert.ok(Math.abs(tracker.capture.silent_seconds - 2) < .01);
  assert.ok(Math.abs(tracker.capture.silence_intervals[0].duration_seconds - 2) < .01);
  assert.ok(Math.abs(tracker.capture.monitored_seconds - 2.2) < .01);
});
