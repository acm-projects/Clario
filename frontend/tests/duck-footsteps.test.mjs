import test from 'node:test';
import assert from 'node:assert/strict';
import {duckFootstepTrail} from '../src/lib/duckFootsteps.ts';
import {interviewDays, interviewStreaks} from '../src/lib/interviewCalendar.ts';

const day=(date,count=1)=>({date,count});
test('feet are attached only to completed dates in the visible month',()=>{
 const trail=duckFootstepTrail([day('2026-10-31'),day('2026-11-01'),day('2026-11-02',0),day('2026-11-03'),day('2026-11-03'),day('2026-12-01')],'2026-11');
 assert.deepEqual([...trail.keys()],['2026-11-01','2026-11-03']);
});
test('consecutive days step in chronological order with alternating pair tilt',()=>{
 const trail=duckFootstepTrail([day('2026-11-03'),day('2026-11-01'),day('2026-11-02')],'2026-11');
 assert.deepEqual([...trail.values()],[{delay:0,tilt:-4},{delay:75,tilt:4},{delay:150,tilt:-4}]);
});
test('a gap starts a new short trail instead of implying an unbroken streak',()=>{
 const trail=duckFootstepTrail([day('2026-11-01'),day('2026-11-02'),day('2026-11-05')],'2026-11');
 assert.deepEqual(trail.get('2026-11-05'),{delay:0,tilt:-4});
});
test('long runs finish their stagger in under one second',()=>{
 const dates=Array.from({length:30},(_,i)=>day(`2026-11-${String(i+1).padStart(2,'0')}`));
 const trail=duckFootstepTrail(dates,'2026-11');
 assert.ok(Math.max(...[...trail.values()].map(step=>step.delay))+110+320<1000);
});
test('Chicago DST grouping yields one foot pair per day and leaves streak calculations untouched',()=>{
 const now=new Date('2026-11-03T18:00:00Z');
 const activity=interviewDays(['2026-11-01T05:30:00Z','2026-11-02T05:30:00Z','2026-11-02T18:00:00Z','2026-11-03T18:00:00Z','2026-11-03T20:00:00Z','invalid'],now);
 const before=interviewStreaks(activity,now);
 const trail=duckFootstepTrail(activity,'2026-11');
 assert.equal(activity[0].count,2);assert.equal(trail.size,3);
 assert.deepEqual(interviewStreaks(activity,now),before);
 assert.equal(before.current,3);
});
