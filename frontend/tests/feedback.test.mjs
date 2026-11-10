import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeedbackHistory } from '../src/lib/feedback.ts';
const session = { id:'session-1', status:'completed', ended_at:'2026-10-19T12:00:00Z', problem_slug:'two-sum' };
test('pending sessions do not invent scores or coach feedback', () => {
  const [item] = parseFeedbackHistory([{ session, problem:{title:'Two Sum',difficulty:'Easy'}, feedback:null }]);
  assert.equal(item.status,'Pending');
  assert.equal(item.topic,'Two Sum');
  assert.equal(item.coachQuote,null);
  assert.deepEqual(Object.values(item.scores),[null,null,null,null]);
});
test('saved feedback preserves unscored speech categories and evidence limits', () => {
  const [item] = parseFeedbackHistory([{session,feedback:{id:'report-1',technical_score:80,reasoning_score:null,communication_score:null,overall_score:80,strengths:['Clear names'],recommendations:['Check empty input'],report:{summary:'Review edge cases.',coach_quote:'Plan first.',coach_note:'State the invariant.',evidence_limitations:['No transcript recorded.']}}}]);
  assert.equal(item.status,'Available');
  assert.equal(item.scores.technical_score,80);
  assert.equal(item.scores.communication_score,null);
  assert.equal(item.coachQuote,'Plan first.');
  assert.deepEqual(item.limitations,['No transcript recorded.']);
});
test('out-of-range scores are excluded from chart data', () => {
  const [item] = parseFeedbackHistory([{session,feedback:{id:'report-1',technical_score:101,communication_score:-1,reasoning_score:'90',overall_score:NaN}}]);
  assert.deepEqual(Object.values(item.scores),[null,null,null,null]);
});
test('unfinished sessions and invalid dates are rejected', () => {
  for (const invalid of [{...session,status:'in_progress'},{...session,ended_at:'invalid'},{...session,id:null}]) assert.throws(()=>parseFeedbackHistory([{session:invalid}]),/Invalid completed interview/);
  assert.throws(()=>parseFeedbackHistory({}),/Invalid feedback history/);
});


test('speech observations preserve unavailable fields and old reports remain compatible', () => {
  const metrics = {monitored_seconds:60,silent_seconds:15,silence_percent:25,longest_pause_seconds:8,filler_count:null,words_per_speaking_minute:null,limitations:['Volume is approximate.']};
  const [item] = parseFeedbackHistory([{session,feedback:{id:'report-1',report:{communication_metrics:metrics}}}]);
  assert.deepEqual(item.communicationMetrics,{...metrics,silence_intervals:[]});
  const [old] = parseFeedbackHistory([{session,feedback:{id:'old',report:{}}}]);
  assert.equal(old.communicationMetrics,null);
});

test('UMPIRE uses saved ratings and rates missing recorded demonstrations zero without deriving stars from category scores', () => {
  const [old] = parseFeedbackHistory([{session,feedback:{id:'old',technical_score:100,report:{}}}]);
  assert.equal(old.umpire.plan.stars,0);
  assert.equal(old.detailed,false);
  assert.equal(old.fillerWords.available,false);
  const [item] = parseFeedbackHistory([{session,feedback:{id:'new',report:{umpire:{plan:{stars:4,summary:'Clear plan.',details:'Explained a map.',evidence_quotes:['use a map']},match:{stars:6}},actions:{fix:['Only recorded action'],keep:[]},filler_words:{available:true,items:[{word:'um',count:2},{word:'bad',count:-1}]}}}}]);
  assert.equal(item.umpire.plan.stars,4);
  assert.equal(item.umpire.match.stars,0);
  assert.deepEqual(item.actions.fix,['Only recorded action']);
  assert.deepEqual(item.fillerWords.items,[{word:'um',count:2}]);
});


test('report preserves exact submitted source and full summary without inventing legacy fields', () => {
  const code = 'def solve():\n    return 1\n';
  const summary = 'Observed strength.\n\nObserved weakness and next step.';
  const [item] = parseFeedbackHistory([{ session, feedback: { id: 'new', report: { submitted_code: code, full_summary: summary, corrected_solution: 'def solve():\n    return 2' } } }]);
  assert.equal(item.submittedCode, code);
  assert.equal(item.fullSummary, summary);
  assert.equal(item.correctedSolution, 'def solve():\n    return 2');
  const [old] = parseFeedbackHistory([{ session, feedback: { id: 'old', report: {} } }]);
  assert.equal(old.submittedCode, null);
  assert.equal(old.fullSummary, null);
  assert.equal(old.correctedSolution, null);
});

test('structured fixes preserve coaching steps and exact solution excerpts with legacy fallback', () => {
  const detail = {title:'Handle duplicates',explanation:'Keep the earlier index before updating the map.',steps:['Look up the complement before inserting.'],verification:'Trace [3, 3] with target 6.',code_excerpt:'return [seen[complement], i]'};
  const [item] = parseFeedbackHistory([{session,feedback:{id:'new',report:{actions:{fix:['Check duplicates.'],fix_details:[detail]}}}}]);
  assert.equal(item.fixDetails[0].title,detail.title);
  assert.deepEqual(item.fixDetails[0].steps,detail.steps);
  assert.equal(item.fixDetails[0].codeExcerpt,detail.code_excerpt);
  const [old] = parseFeedbackHistory([{session,feedback:{id:'old',report:{}}}]);
  assert.deepEqual(old.fixDetails,[]);
});
