import test from 'node:test';
import assert from 'node:assert/strict';
import { skillScoresFromSummary } from '../src/lib/skillScores.ts';

test('radar uses the same saved category averages as progress', () => {
  assert.deepEqual(skillScoresFromSummary({ average_by_category: { technical: 81, problem_solving: 63.5, communication: 42 } }), [
    { label: 'Technical', score: 81 }, { label: 'Communication', score: 42 }, { label: 'Reasoning', score: 63.5 },
  ]);
});
test('missing scores remain unplotted and zero is a valid score', () => {
  assert.deepEqual(skillScoresFromSummary({ average_by_category: { technical: 0, problem_solving: null, communication: 101 } }).map(row => row.score), [0, null, null]);
});
