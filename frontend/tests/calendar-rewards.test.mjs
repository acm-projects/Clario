import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarRewards, streakProgress, earnedMilestone, interviewsOnDay } from '../src/lib/calendarRewards.ts';
import { summarizeSessions } from '../src/lib/dashboard.ts';

const now = new Date('2026-11-03T18:00:00Z');
const timestamps = dates => dates.map(day => `${day}T18:00:00Z`);

test('milestone progress advances at 3, 7, 14 and caps at 30 without inventing awards', () => {
  for (const [current,next,remaining] of [[0,3,3],[2,3,1],[3,7,4],[6,7,1],[7,14,7],[13,14,1],[14,30,16],[29,30,1]]) {
    assert.equal(streakProgress(current).next,next);
    assert.equal(streakProgress(current).remaining,remaining);
  }
  assert.deepEqual(streakProgress(30),{next:null,value:30,max:30,remaining:0,earned:30});
  assert.deepEqual(streakProgress(45),{next:null,value:30,max:30,remaining:0,earned:30});
  assert.equal(earnedMilestone(2),0);assert.equal(earnedMilestone(6),3);
});

test('streak active today differs from a streak that needs continuation today', () => {
  const today = calendarRewards(timestamps(['2026-11-01','2026-11-02','2026-11-03']),now);
  assert.equal(today.current,3);assert.equal(today.status,'active-today');
  assert.match(today.message,/showed up today/);
  const yesterday = calendarRewards(timestamps(['2026-10-31','2026-11-01','2026-11-02']),now);
  assert.equal(yesterday.current,3);assert.equal(yesterday.status,'continue-today');
  assert.match(yesterday.message,/still going.*today/);
  const broken = calendarRewards(timestamps(['2026-10-30','2026-10-31','2026-11-01']),now);
  assert.equal(broken.current,0);assert.equal(broken.longest,3);assert.equal(broken.status,'inactive');
  assert.match(broken.message,/fresh streak/);
});

test('multiple completions on the same day never create multiple streak days', () => {
  const reward = calendarRewards(['2026-11-03T12:00:00Z','2026-11-03T15:00:00Z','2026-11-03T16:00:00Z'],now);
  assert.equal(reward.current,1);assert.equal(reward.activeDays,1);assert.equal(reward.progress.earned,0);
});

test('motivation reflects empty, broken and 30-day histories instead of placeholder achievements', () => {
  assert.match(calendarRewards([],now).message,/first completed interview/);
  const dates = Array.from({length:30},(_,i)=>new Date(now.getTime()-i*86400000).toISOString());
  assert.equal(calendarRewards(dates,now).current,30);
  assert.match(calendarRewards(dates,now).message,/30 days/);
});

test('Chicago midnight and both occurrences of the DST fall-back hour group correctly', () => {
  const interviews = [
    {id:'a',title:'Before midnight',endedAt:'2026-11-01T04:30:00Z'},
    {id:'b',title:'First 1:30',endedAt:'2026-11-01T06:30:00Z'},
    {id:'c',title:'Second 1:30',endedAt:'2026-11-01T07:30:00Z'},
  ];
  assert.deepEqual(interviewsOnDay(interviews,'2026-10-31',now).map(item=>item.id),['a']);
  assert.deepEqual(interviewsOnDay(interviews,'2026-11-01',now).map(item=>item.id),['c','b']);
});

test('day details exclude future/invalid entries, deduplicate IDs and leave source data intact', () => {
  const data = [
    {id:'a',title:'First',endedAt:'2026-11-03T12:00:00Z'},
    {id:'b',title:'Second',endedAt:'2026-11-03T14:00:00Z'},
    {id:'a',title:'Duplicate',endedAt:'2026-11-03T12:00:00Z'},
    {id:'bad',title:'Invalid',endedAt:'invalid'},
    {id:'future',title:'Future',endedAt:'2026-11-03T19:00:00Z'},
  ];
  const before=structuredClone(data);
  assert.deepEqual(interviewsOnDay(data,'2026-11-03',now).map(item=>item.id),['b','a']);
  assert.deepEqual(data,before);
});

test('calendar receives all completed interviews, not just the five recent rows', () => {
  const rows = Array.from({length:8},(_,i)=>({id:`session-${i}`,problem_slug:`problem-${i}`,status:'completed',ended_at:`2026-11-03T${String(8+i).padStart(2,'0')}:00:00Z`,started_at:'2026-11-03T07:00:00Z'}));
  rows.push({id:'failed',status:'failed',ended_at:'2026-11-03T12:00:00Z'});
  rows.push({id:'in-progress',status:'in_progress',ended_at:null});
  const summary=summarizeSessions(rows,now);
  assert.equal(summary.recent.length,5);
  assert.equal(summary.completedInterviews.length,8);
  assert.equal(summary.completionDates.length,8);
  assert.equal(interviewsOnDay(summary.completedInterviews,'2026-11-03',now).length,8);
  assert.equal(calendarRewards(summary.completionDates,now).current,1);
});
