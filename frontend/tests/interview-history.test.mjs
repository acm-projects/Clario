import test from 'node:test';
import assert from 'node:assert/strict';
import { filterInterviews } from '../src/utils/interviewHistory.ts';

const rows = [
  {session_id:'first', date:'2026-11-01T12:00:00Z', problem_title:'Two Sum', problem_slug:'two-sum', difficulty:'Easy', topics:['Array','Hash Table'], mode:'custom', feedback_status:'reviewed', feedback_summary:'Explain the invariant.'},
  {session_id:'second', date:'2026-11-02T12:00:00Z', problem_title:'Shopping Cart', problem_slug:'repo-debugging:shopping-cart-01', difficulty:'Medium', topics:['Money'], mode:'repo_debugging', feedback_status:'pending', feedback_summary:null},
];
test('history searches real names, topics, feedback, IDs, and readable mode names', () => {
  for (const query of ['Two Sum','HASH TABLE','invariant','first']) assert.equal(filterInterviews(rows,query,'All','All','All')[0].session_id,'first');
  assert.equal(filterInterviews(rows,'Repository Debugging','All','All','All')[0].session_id,'second');
});
test('difficulty/topic/status filters combine without changing original history', () => {
  assert.equal(filterInterviews(rows,'','Medium','Money','pending').length,1);
  assert.equal(filterInterviews(rows,'','Easy','Money','reviewed').length,0);
  assert.deepEqual(filterInterviews(rows,'','All','All','All').map(row=>row.session_id),['second','first']);
  assert.equal(rows[0].session_id,'first');
});
test('missing metadata does not acquire invented topics or a reviewed status', () => {
  const missing = [{session_id:'missing',date:'2026-11-03T12:00:00Z',problem_title:null,problem_slug:null,difficulty:null,mode:'custom'}];
  assert.equal(filterInterviews(missing,'','All','Array','All').length,0);
  assert.equal(filterInterviews(missing,'','All','All','reviewed').length,0);
  assert.equal(filterInterviews(missing,'','All','All','All').length,1);
});
