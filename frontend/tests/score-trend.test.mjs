import test from 'node:test';
import assert from 'node:assert/strict';
import { overallScorePoints } from '../src/utils/scoreTrend.ts';
const row = (id, score, date = '2026-11-01T12:00:00Z') => ({ session_id: id, date, overall_score: score, technical_score: 99, communication_score: 98, problem_solving_score: 97, problem_title: id, problem_slug: id, mode: 'practice', difficulty: 'Easy' });

test('overall graph orders real overall scores without mixing in category scores', () => {
  const history = [row('later', 70, '2026-11-02T12:00:00Z'), row('first', 0), row('missing', null)];
  assert.deepEqual(overallScorePoints(history).map(p => [p.id, p.value]), [['first', 0], ['later', 70]]);
  assert.equal(history[0].session_id, 'later');
  assert.deepEqual([overallScorePoints(history)[1].technical, overallScorePoints(history)[1].reasoning, overallScorePoints(history)[1].communication], [99,97,98]);
});
test('unscored, invalid dates and invalid scores never become invented zeroes', () => {
  assert.deepEqual(overallScorePoints([row('null', null), row('bad', NaN), row('high', 101), row('negative', -1), row('date', 80, 'invalid')]), []);
  assert.equal(overallScorePoints([row('single', 100)]).length, 1);
});
