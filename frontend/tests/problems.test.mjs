import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProblems, loadProblems } from '../src/lib/problems.ts';

const valid = { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topics: ['Array', 'Hash Table'] };

test('an incomplete cached problem does not break valid library entries', () => {
  const problems = parseProblems([valid, { slug: 'wildcard-matching', title: 'Wildcard Matching', difficulty: '' }, null]);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].slug, 'two-sum');
  assert.equal(problems[0].difficulty, 'Easy');
});

test('normalizes difficulty whitespace without inventing missing values', () => {
  assert.equal(parseProblems({ problems: [{ ...valid, difficulty: ' medium ' }] })[0].difficulty, 'Medium');
  assert.throws(() => parseProblems([{ ...valid, difficulty: '' }]), /no valid problems/);
  assert.throws(() => parseProblems({ error: 'unavailable' }), /invalid list/);
  assert.deepEqual(parseProblems([]), []);
});

test('library loader keeps valid records from a mixed API response', async () => {
  const problems = await loadProblems(undefined, async () => new Response(JSON.stringify([valid, { ...valid, title: '' }]), { status: 200 }));
  assert.deepEqual(problems.map(problem => problem.slug), ['two-sum']);
  await assert.rejects(loadProblems(undefined, async () => new Response('', { status: 503 })), /503/);
});
