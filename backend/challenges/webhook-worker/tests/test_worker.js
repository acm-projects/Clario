const assert = require('node:assert/strict');
const {withRetry, processBatch, RETRY_DEFAULTS} = require('./processor.js');
const jobs = Array.from({length:5}, (_, i) => ({id:i,payload:i}));
const queue = () => ({ack:async()=>{},deadLetter:async()=>{}});
exports.test_batch_waits = async () => {
  const result = await processBatch(jobs,queue(),async x => {await new Promise(r=>setTimeout(r,1));return x*2;});
  assert.equal(result.length,5); assert.deepEqual(result.map(r=>r.res),[0,2,4,6,8]);
};
exports.test_ack_after_delivery = async () => {
  const events=[];const q={ack:async id=>events.push('ack'),deadLetter:async()=>{}};
  await processBatch([jobs[0]],q,async()=>{events.push('deliver');return true;});assert.deepEqual(events,['deliver','ack']);
};
exports.test_retry_defaults_immutable = async () => {
  for(let i=0;i<2;i++){let count=0;await assert.rejects(()=>withRetry(async()=>{count++;throw Error('down');}));assert.equal(count,3);}
  assert.deepEqual(RETRY_DEFAULTS,{retries:3,delay:0});
};
exports.test_retry_policy = async () => {
  for (const status of [400,401,404,429,500]) {let count=0;await assert.rejects(()=>withRetry(async()=>{count++;throw Object.assign(Error('failure'),{status});},{retries:3,delay:0}));assert.equal(count,status===429||status>=500?3:1);}
};
exports.test_dead_letter_before_ack = async () => {
  const events=[];let attempts=0;const q={ack:async()=>events.push('ack'),deadLetter:async()=>events.push('dead')};
  const result=await processBatch([jobs[0]],q,async()=>{attempts++;throw Object.assign(Error('down'),{status:500});});
  assert.equal(attempts,3);assert.deepEqual(events,['dead','ack']);assert.equal(result[0].error,'down');
};
exports.test_concurrency_cap = async () => {
  let active=0,max=0;await processBatch(jobs,queue(),async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,2));active--;return true;},2);assert.equal(active,0);assert.ok(max<=2);
};
exports.test_dead_letter_failure_unacked = async () => {
  let acked=false;const q={ack:async()=>{acked=true;},deadLetter:async()=>{throw Error('storage down');}};
  await assert.rejects(()=>processBatch([jobs[0]],q,async()=>{throw Object.assign(Error('bad'),{status:400});}));assert.equal(acked,false);
};
exports.test_custom_options_unchanged = async () => {
  const opts={retries:2,delay:0};await assert.rejects(()=>withRetry(async()=>{throw Error('down');},opts));assert.deepEqual(opts,{retries:2,delay:0});
};
