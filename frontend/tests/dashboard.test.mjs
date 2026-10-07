import test from "node:test";
import assert from "node:assert/strict";
import { getWeekBounds, summarizeSessions, getWeeklyGoal, getGreetingCopy, loadRecommendedProblem, loadSessionSummary } from "../src/lib/dashboard.ts";

const profile = { preferred_language: "Python", starting_difficulty: "Medium", weekly_interview_goal: 3, has_coding_experience: true, has_leetcode_experience: false, language_comfort: null, interview_confidence: null };

test("week boundaries use Monday in Chicago, including DST", () => {
  const regular = getWeekBounds(new Date("2026-10-07T15:00:00Z"));
  assert.equal(regular.start.toISOString(),"2026-10-05T05:00:00.000Z");
  assert.equal(regular.end.toISOString(),"2026-10-12T05:00:00.000Z");
  const dst = getWeekBounds(new Date("2026-11-01T18:00:00Z"));
  assert.equal(dst.start.toISOString(),"2026-10-26T05:00:00.000Z");
  assert.equal(dst.end.toISOString(),"2026-11-02T06:00:00.000Z");
  assert.equal((dst.end-dst.start)/3600000,169);
});

test("counts completion times inside this week and excludes canceled/failed sessions", () => {
  const rows = [
    {id:1,status:"completed",ended_at:"2026-10-05T05:00:00Z"},
    {id:2,status:"completed",ended_at:"2026-10-12T04:59:59Z"},
    {id:3,status:"completed",ended_at:"2026-10-12T05:00:00Z"},
    {id:4,status:"completed",ended_at:"2026-10-05T04:59:59Z"},
    {id:5,status:"in_progress",ended_at:null},
    {id:6,status:"failed",ended_at:"2026-10-07T16:00:00Z"},
    {id:7,status:"cancelled",ended_at:"2026-10-07T16:00:00Z"},
  ];
  assert.equal(summarizeSessions(rows,new Date("2026-10-07T15:00:00Z")).completedThisWeek,2);
  assert.equal(summarizeSessions([],new Date()).completedThisWeek,0);
  assert.throws(()=>summarizeSessions([{id:1}]),/completion timestamp/);
});

test("recent practice sorts actual session dates and has no fake history", () => {
  const result = summarizeSessions([{id:1,problem_id:"p1",ended_at:"2026-10-05T12:00:00Z",started_at:"2026-10-05T11:00:00Z"},{id:2,problem_id:"p2",ended_at:null,started_at:"2026-10-07T11:00:00Z",status:"in_progress"}]);
  assert.equal(result.recent[0].id,"2");
  assert.equal(result.recent[0].status,"in progress");
  assert.deepEqual(summarizeSessions([]).recent,[]);
});

test("missing or invalid weekly goals stay unset", () => {
  assert.equal(getWeeklyGoal(profile),3);
  for(const value of [null,0,-1,1.5]) assert.equal(getWeeklyGoal({...profile,weekly_interview_goal:value}),null);
  assert.ok(getGreetingCopy({...profile,has_coding_experience:false}).includes("fundamentals"));
  assert.ok(!getGreetingCopy(profile).includes("undefined"));
});

test("recommendation matches difficulty case-insensitively and handles empty results/errors", async () => {
  const calls=[];
  function client(data,error=null) { return {from(table){calls.push(table);return {select(columns){calls.push(columns);return {ilike(column,value){calls.push([column,value]);return {order(){return {limit(){return {maybeSingle:async()=>({data,error})};}};}};}};}};}}; }
  assert.equal(await loadRecommendedProblem(client(null),"Medium"),null);
  const row={id:"p1",title:"Real problem",difficulty:"medium",topic:"Arrays"};
  assert.deepEqual(await loadRecommendedProblem(client(row),"Medium"),row);
  assert.ok(calls.some(call=>Array.isArray(call)&&call[0]==="difficulty"&&call[1]==="Medium"));
  await assert.rejects(loadRecommendedProblem(client(null,new Error("database error")),"Medium"));
  assert.equal(await loadRecommendedProblem(client(null),null),null);
});

test("history query filters current user and hydrates problem titles", async () => {
  const calls=[];
  const client={from(table){calls.push(table);if(table==="interview_sessions")return {select(){return {eq(column,id){calls.push([column,id]);return {order(){return {range:async()=>({data:[{id:"s1",problem_id:"p1",status:"completed",ended_at:new Date().toISOString(),started_at:new Date().toISOString()}],error:null})};}};}};}};return {select(){return {in:async()=>({data:[{id:"p1",title:"Actual database title",difficulty:"Medium"}],error:null})};}};}};
  const result=await loadSessionSummary(client,"user-1");
  assert.ok(calls.some(call=>Array.isArray(call)&&call[0]==="user_id"&&call[1]==="user-1"));
  assert.equal(result.recent[0].problemTitle,"Actual database title");
  assert.equal(result.recent[0].difficulty,"Medium");
});
