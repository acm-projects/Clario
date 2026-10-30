import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Load the Vite module without requiring import.meta.env in Node.
const source = (await readFile(new URL('../src/lib/problems.ts', import.meta.url), 'utf8'))
  .replace('import { API_BASE_URL } from "./apiConfig";', 'const API_BASE_URL = "";');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { parseProblems, loadProblems } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const valid = { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topics: ['Array'] };

test('a malformed API entry does not prevent valid library problems from loading', async () => {
  const rows = [valid, { slug: 'wildcard-matching', title: 'Wildcard Matching', difficulty: '' }, null];
  const problems = await loadProblems(undefined, async () => new Response(JSON.stringify(rows)));
  assert.deepEqual(problems.map(problem => problem.slug), ['two-sum']);
});

test('empty libraries are supported but invalid payloads still fail', () => {
  assert.deepEqual(parseProblems([]), []);
  assert.throws(() => parseProblems({ error: 'unavailable' }), /invalid list/);
  assert.throws(() => parseProblems([{ ...valid, difficulty: '' }]), /no valid problems/);
});
