import test from 'node:test';
import assert from 'node:assert/strict';
import { InterviewNudges, interviewNudge, NUDGE_PREFIX, canNudge } from '../src/lib/interviewNudges.ts';

test('nudges every thirty seconds without duplicate ticks', () => {
  const clock = new InterviewNudges();
  assert.equal(clock.due(29.9, true), false);
  assert.equal(clock.due(30, true), true);
  assert.equal(clock.due(31, true), false);
  assert.equal(clock.due(60, true), true);
});
test('background throttling emits one current nudge without replaying missed intervals', () => {
  const clock = new InterviewNudges();
  assert.equal(clock.due(30, true), true);
  assert.equal(clock.due(185, true), true);
  assert.equal(clock.due(186, true), false);
  assert.equal(clock.due(210, true), true);
});
test('speaking defers a nudge and reconnect retains cadence', () => {
  const clock = new InterviewNudges();
  assert.equal(clock.due(30, false), false);
  assert.equal(clock.due(34, true), true);
  assert.equal(clock.due(35, true), false);
});
test('timer cue uses elapsed time and the current interview phase', () => {
  assert.ok(interviewNudge(61, false).startsWith(NUDGE_PREFIX));
  assert.match(interviewNudge(61, false), /61 seconds/);
  assert.match(interviewNudge(61, false), /current progress/);
  assert.match(interviewNudge(61, true), /submitted approach/);
  assert.match(interviewNudge(61, true), /Do not restart/);
});

test('hosted silence prompts cannot be followed by a second timer prompt five seconds later', () => {
  assert.equal(canNudge(35000, 30000, false), false);
  assert.equal(canNudge(59999, 30000, false), false);
  assert.equal(canNudge(60000, 30000, false), true);
  assert.equal(canNudge(60000, 30000, true), false);
});
