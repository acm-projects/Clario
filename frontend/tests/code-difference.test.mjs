import test from 'node:test';
import assert from 'node:assert/strict';
import { codeDifference } from '../src/utils/codeDifference.ts';
test('highlights replacements in both code views and keeps context unchanged', () => {
 const diff=codeDifference('def solve():\n    return []','def solve():\n    return [0, 1]');
 assert.deepEqual([...diff.yours],[1]); assert.deepEqual([...diff.solution],[1]);
});
test('handles duplicate lines, insertions, deletions and indentation', () => {
 assert.deepEqual([...codeDifference('x\nx','x').yours],[1]);
 assert.deepEqual([...codeDifference('x','x\ny').solution],[1]);
 assert.deepEqual([...codeDifference('  x','x').yours],[0]);
 assert.equal(codeDifference('x\r\ny','x\ny').yours.size,0);
});
test('bounds large comparisons and preserves common context', () => {
 const a=Array(600).fill('same');const b=[...a];b[300]='changed';
 const diff=codeDifference(a.join('\n'),b.join('\n'));
 assert.deepEqual([...diff.yours],[300]);assert.deepEqual([...diff.solution],[300]);
});
