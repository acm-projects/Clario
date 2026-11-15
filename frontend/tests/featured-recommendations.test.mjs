import test from 'node:test';
import assert from 'node:assert/strict';
import { curateRecommendations, FEATURED_FIRST, RECOMMENDED_LIMIT } from '../src/lib/featuredRecommendations.ts';

const problem = (slug) => ({ slug, title: slug, difficulty: 'Easy', topics: [], reason: 'r' });

test('Contains Duplicate is pinned first and the list is capped at three', () => {
  const result = curateRecommendations({ has_assessment: true, problems: ['two-sum', 'valid-anagram', 'group-anagrams', 'contains-duplicate'].map(problem) });
  assert.equal(RECOMMENDED_LIMIT, 3);
  assert.deepEqual(result.problems.map(item => item.slug), ['contains-duplicate', 'two-sum', 'valid-anagram']);
  assert.equal(result.problems[0], FEATURED_FIRST);
});

test('the featured problem is added even when the ranking omits it', () => {
  const result = curateRecommendations({ has_assessment: true, problems: [problem('two-sum')] });
  assert.deepEqual(result.problems.map(item => item.slug), ['contains-duplicate', 'two-sum']);
});

test('users without an assessment keep the take-the-assessment state', () => {
  assert.deepEqual(curateRecommendations({ has_assessment: false, problems: [] }).problems, []);
});
