import test from "node:test";
import assert from "node:assert/strict";
import { getProfileUpdate, saveAssessment, saveDisplayName, validateDisplayName } from "../src/lib/profile.ts";
import { initialAnswers, getQuestionPath } from "../src/lib/practiceProfile.ts";
import { createRetakeAccess, getProfileRedirect } from "../src/lib/profileRouting.ts";

const answers = { ...initialAnswers, hasLeetCodeExperience: true, languagesUsed: "both", selectedLanguage: "Java", languageComfort: 5, weeklyInterviewGoal: 5 };

function mockClient({ user = { id: "user-1" }, authError = null, updateError = null, row = { id: "user-1" } } = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from(table) {
      calls.push(["table", table]);
      return { update(payload) {
        calls.push(["update", payload]);
        return { eq(column, id) {
          calls.push(["eq", column, id]);
          return { select(columns) {
            calls.push(["select", columns]);
            return { single: async () => ({ data: row, error: updateError }) };
          } };
        } };
      } };
    },
  };
  return { client, calls };
}

test("maps the assessment profile columns, with title-case difficulty and 5+ as 5", () => {
  const update = getProfileUpdate(answers);
  assert.deepEqual(Object.keys(update).sort(), ["has_leetcode_experience", "has_coding_experience", "preferred_language", "language_comfort", "starting_difficulty", "interview_confidence", "weekly_interview_goal", "assessment_completed", "updated_at", "language_to_learn", "struggling_topics", "target_company", "target_date"].sort());
  assert.equal(update.starting_difficulty, "Medium");
  assert.equal(update.weekly_interview_goal, 5);
  assert.equal(update.assessment_completed, true);
  assert.equal(update.interview_confidence, null);
  assert.equal(update.has_coding_experience, null);
});

test("difficulty boundaries match Easy / Medium / Hard", () => {
  for (const [score, difficulty] of [[0,"Easy"],[4,"Easy"],[5,"Medium"],[7,"Medium"],[8,"Hard"],[10,"Hard"]]) {
    assert.equal(getProfileUpdate({ ...answers, languageComfort: score }).starting_difficulty, difficulty);
  }
});

test("Other asks for practice language and uses its comfort rating", () => {
  const other = { ...answers, languagesUsed: "other", languageComfort: 10, interviewConfidence: 10 };
  assert.deepEqual(getQuestionPath(other), ["leetcode", "used", "language", "languageComfort", "strugglingTopics", "weekly", "targetCompany", "interviewDate"]);
  const update = getProfileUpdate(other);
  assert.equal(update.has_coding_experience, null);
  assert.equal(update.language_comfort, 10);
  assert.equal(update.interview_confidence, null);
  assert.equal(update.starting_difficulty, "Hard");
});

test("Neither and no coding experience keep their distinct paths and accurate data", () => {
  for (const hasCodingExperience of [true, false]) {
    const beginner = { ...answers, hasLeetCodeExperience: false, hasCodingExperience, languagesUsed: "neither", interviewConfidence: 10 };
    const update = getProfileUpdate(beginner);
    assert.equal(update.has_coding_experience, hasCodingExperience);
    assert.equal(update.language_comfort, hasCodingExperience ? 5 : null);
    assert.equal(update.starting_difficulty, hasCodingExperience ? "Medium" : "Easy");
    assert.equal(update.interview_confidence, hasCodingExperience ? null : 10);
  }
});

test("Python/Java infer the practice language; Both asks for a choice", () => {
  for (const language of ["Python", "Java"]) {
    const a = { ...answers, languagesUsed: language, selectedLanguage: null };
    assert.equal(getProfileUpdate(a).preferred_language, language);
    assert.ok(!getQuestionPath(a).includes("language"));
  }
  assert.ok(getQuestionPath(answers).includes("language"));
});

test("normal completion gates and direct URL retake attempts", () => {
  for (const completion of [false, null]) {
    assert.equal(getProfileRedirect("/assessment", completion, false), null);
    assert.equal(getProfileRedirect("/dashboard", completion, false), "/assessment");
    assert.equal(getProfileRedirect("/settings", completion, false), "/assessment");
  }
  assert.equal(getProfileRedirect("/Assessment", true, false), "/dashboard");
  assert.equal(getProfileRedirect("/assessment", true, true), null);
  const access = createRetakeAccess();
  assert.equal(access.allows("user-1", { retake: true }), false);
  const state = access.start("user-1");
  assert.equal(access.allows("user-1", state), true);
  assert.equal(access.allows("user-2", state), false);
  assert.equal(access.allows("user-1", { retakeToken: "guessed" }), false);
  access.clear();
  assert.equal(access.allows("user-1", state), false);
  assert.equal(createRetakeAccess().allows("user-1", state), false);
});

test("final save updates only the authenticated user's existing profile", async () => {
  const { client, calls } = mockClient();
  await saveAssessment(client, answers, "user-1");
  assert.deepEqual(calls[0], ["table", "profiles"]);
  assert.deepEqual(calls[2], ["eq", "id", "user-1"]);
  assert.deepEqual(calls[3], ["select", "id"]);
  assert.equal(calls[1][1].assessment_completed, true);
});

test("missing session and account changes cause no database writes", async () => {
  for (const user of [null, { id: "user-2" }]) {
    const { client, calls } = mockClient({ user });
    await assert.rejects(saveAssessment(client, answers, "user-1"));
    assert.equal(calls.length, 0);
  }
});

test("failed and zero-row updates reject; the same answers can be retried", async () => {
  const snapshot = structuredClone(answers);
  for (const options of [{ updateError: new Error("RLS denied") }, { row: null }, { row: { id: "other-user" } }]) {
    const { client } = mockClient(options);
    await assert.rejects(saveAssessment(client, answers, "user-1"));
    assert.deepEqual(answers, snapshot);
  }
  await saveAssessment(mockClient().client, answers, "user-1");
  assert.deepEqual(answers, snapshot);
});

test("display names are trimmed and validated before any account writes", async () => {
  assert.equal(validateDisplayName("  Ada  "), "Ada");
  for (const name of ["", "   ", "a".repeat(61)]) {
    const { client, calls } = mockClient();
    await assert.rejects(saveDisplayName(client, name, "user-1"));
    assert.equal(calls.length, 0);
  }
});

test("display name saves affect only the authenticated profile and preserve assessment preferences", async () => {
  const { client, calls } = mockClient();
  assert.equal(await saveDisplayName(client, " Ada ", "user-1"), "Ada");
  assert.deepEqual(calls[0], ["table", "profiles"]);
  assert.deepEqual(Object.keys(calls[1][1]).sort(), ["display_name", "updated_at"]);
  assert.equal(calls[1][1].display_name, "Ada");
  assert.deepEqual(calls[2], ["eq", "id", "user-1"]);
});

test("display name writes reject missing sessions, account changes, and denied or zero-row updates", async () => {
  for (const user of [null, { id: "user-2" }]) {
    const { client, calls } = mockClient({ user });
    await assert.rejects(saveDisplayName(client, "Ada", "user-1"));
    assert.equal(calls.length, 0);
  }
  for (const options of [{ updateError: new Error("RLS denied") }, { row: null }, { row: { id: "other-user" } }]) {
    await assert.rejects(saveDisplayName(mockClient(options).client, "Ada", "user-1"));
  }
});
test("saves optional prep answers and clears topics when the path changes", () => {
  const prep = { ...answers, strugglingTopics: ["Array", "Array", "Tree"], targetCompany: "  Google, Microsoft  ", interviewDate: "2027-01-15" };
  const update = getProfileUpdate(prep);
  assert.deepEqual(update.struggling_topics, ["Array", "Tree"]);
  assert.equal(update.target_company, "Google, Microsoft");
  assert.equal(update.target_date, "2027-01-15");
  assert.deepEqual(getProfileUpdate({ ...prep, hasLeetCodeExperience: false, hasCodingExperience: true }).struggling_topics, []);
  assert.equal(getProfileUpdate(answers).target_date, null);
  assert.throws(() => getProfileUpdate({ ...prep, interviewDate: "2027-02-30" }), /valid interview date/);
});
