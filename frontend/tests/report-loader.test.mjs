import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSessionReport } from '../src/lib/reportLoader.ts';
import { parseFeedbackHistory } from '../src/lib/feedback.ts';

function options(read, extra = {}) {
  return { read, generate: async () => { throw new Error('Unexpected generation'); },
    signal: new AbortController().signal, retry:false, onPhase:()=>{}, pause:async()=>{}, ...extra };
}
test('webhook processing is polled without a second Gemini request', async () => {
  const rows=[{processing:{status:'processing'}},{processing:{status:'completed'},feedback:{id:'saved'}}];
  const result=await loadSessionReport(options(async()=>rows.shift()));
  assert.equal(result.feedback.id,'saved');
});
test('provider failure becomes a visible error instead of endless loading', async () => {
  await assert.rejects(loadSessionReport(options(async()=>({processing:{status:'failed',error:'Gemini is experiencing high demand'}}))), /high demand/);
});
test('manual retry queues once and then polls the same job', async () => {
  let calls=0;
  const rows=[{processing:{status:'failed'}},{processing:{status:'processing'}},{processing:{status:'completed'},feedback:{id:'saved'}}];
  const result=await loadSessionReport(options(async()=>rows.shift(),{retry:true,generate:async()=>{calls++;return {status:'processing'};}}));
  assert.equal(calls,1);assert.equal(result.feedback.id,'saved');
});
test('waiting for transcript asks the backend, which decides whether to wait or fall back', async () => {
  let calls=0;
  const rows=[{processing:{status:'waiting_for_transcript'}},{processing:{status:'completed'},feedback:{id:'saved'}}];
  const result=await loadSessionReport(options(async()=>rows.shift(),{generate:async()=>{calls++;return {status:'waiting_for_transcript'};}}));
  assert.equal(result.feedback.id,'saved');assert.equal(calls,1);
});
test('missing webhook falls back to the live-transcript report returned by the backend', async () => {
  const result=await loadSessionReport(options(async()=>({processing:{status:'waiting_for_transcript'}}),{generate:async()=>({id:'live-fallback'})}));
  assert.equal(result.feedback.id,'live-fallback');
});
test('a fallback report is shown even though the webhook job never appeared', async () => {
  const result=await loadSessionReport(options(async()=>({processing:{status:'waiting_for_transcript'},feedback:{id:'saved'}})));
  assert.equal(result.feedback.id,'saved');
});
test('stalled jobs are re-requested so the backend can reclaim them', async () => {
  let calls=0;
  const rows=[{processing:{status:'stalled'}},{processing:{status:'processing'}},{processing:{status:'completed'},feedback:{id:'saved'}}];
  const result=await loadSessionReport(options(async()=>rows.shift(),{generate:async()=>{calls++;return {status:'processing'};}}));
  assert.equal(calls,1);assert.equal(result.feedback.id,'saved');
});
test('unfinished jobs are re-requested at a throttled interval, never while processing', async () => {
  let now=0,calls=0,reads=0;
  const result=await loadSessionReport(options(async()=>(++reads<20?{processing:{status:reads<10?'pending':'processing'}}:{processing:{status:'completed'},feedback:{id:'saved'}}),{
    now:()=>now,pause:async()=>{now+=2_000;},generate:async()=>{calls++;return {status:'processing'};},
  }));
  assert.equal(result.feedback.id,'saved');
  assert.equal(calls,2); // t=0s and t=16s while pending; none once processing
});
test('a worker replacing a saved report is awaited', async () => {
  const rows=[{processing:{status:'processing'},feedback:{id:'old'}},{processing:{status:'completed'},feedback:{id:'new'}}];
  assert.equal((await loadSessionReport(options(async()=>rows.shift()))).feedback.id,'new');
});
test('backend generation errors surface instead of loading forever', async () => {
  await assert.rejects(loadSessionReport(options(async()=>({processing:{status:'waiting_for_transcript'}}),{generate:async()=>{throw new Error('Gemini returned an incomplete report');}})), /incomplete report/);
});
test('standalone interviews still support synchronous report generation', async () => {
  const row=await loadSessionReport(options(async()=>({feedback:null}),{generate:async()=>({id:'standalone'})}));
  assert.equal(row.feedback.id,'standalone');
});
test('polling has a bounded deadline', async () => {
  let now=0;
  await assert.rejects(loadSessionReport(options(async()=>({processing:{status:'processing'}}),{
    now:()=>now,pause:async()=>{now+=60_000;},
  })), /taking longer/);
});
test('final metrics preserve zero counts and null timing in the report adapter', () => {
  const [report]=parseFeedbackHistory([{session:{id:'session',status:'completed',ended_at:'2026-11-02T12:00:00Z'},feedback:{id:'report',report:{communication_metrics:{filler_word_count:0,questions_asked:0,average_response_time_seconds:null,words_per_minute:null}}}}]);
  assert.equal(report.communicationMetrics.kind,'final');
  assert.equal(report.communicationMetrics.filler_word_count,0);
  assert.equal(report.communicationMetrics.questions_asked,0);
  assert.equal(report.communicationMetrics.words_per_minute,null);
});
