import test from "node:test";
import assert from "node:assert/strict";
import { selectMockProblem } from "../src/lib/interviewSelection.ts";

const problems = [
  { slug: "easy-1", difficulty: "Easy" },
  { slug: "medium-1", difficulty: "Medium" },
  { slug: "easy-2", difficulty: "Easy" },
  { slug: "hard-1", difficulty: "Hard" },
];

test("mock assignment samples the full saved-level pool without crossing difficulty", () => {
  assert.equal(selectMockProblem(problems, "easy", () => 0).slug, "easy-1");
  assert.equal(selectMockProblem(problems, "EASY", () => .999).slug, "easy-2");
  assert.equal(selectMockProblem(problems, "Medium", () => .9).slug, "medium-1");
  assert.equal(selectMockProblem(problems, "Hard", () => 0).slug, "hard-1");
});

test("mock assignment reads the current level on every launch and leaves the library intact", () => {
  const snapshot = structuredClone(problems);
  assert.equal(selectMockProblem(problems, "Easy", () => .8).difficulty, "Easy");
  assert.equal(selectMockProblem(problems, "Hard", () => .8).difficulty, "Hard");
  assert.deepEqual(problems, snapshot);
});

test("missing levels and empty pools never fall back to an unrelated problem", () => {
  for (const level of [null, "", "unknown"]) assert.equal(selectMockProblem(problems, level), null);
  assert.equal(selectMockProblem([], "Easy"), null);
  assert.equal(selectMockProblem(problems.filter(p => p.difficulty !== "Hard"), "Hard"), null);
});