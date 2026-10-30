import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAnswers } from '../src/lib/practiceProfile.ts';
import { buildAssessmentPayload, getAssessmentPath, getAssessmentQuestion, validateAssessmentQuestion } from '../src/lib/assessmentQuestions.ts';
import { isMissingAssessment, parseRecommendations, parseSavedAssessment } from '../src/lib/assessmentContract.ts';
import { interviewRoomUrl, sessionRequestFor } from '../src/lib/interviewModes.ts';

const answers = { ...initialAnswers, hasLeetCodeExperience: true, languagesUsed: 'Java', languageComfort: 5, weeklyInterviewGoal: 3, strugglingTopics: ['Hash Table'], targetCompany: 'Google, Microsoft, Google' };
const extra = { experience: 'intermediate', timeline: 'this_month', confidentTopics: ['Array'] };

test('every assessment path has question definitions and includes explicit required experience and timeline', () => {
  for (const pathAnswers of [answers, { ...initialAnswers, hasLeetCodeExperience: false, hasCodingExperience: false }, { ...initialAnswers, hasLeetCodeExperience: false, hasCodingExperience: true, languagesUsed: 'both' }]) {
    const path = getAssessmentPath(pathAnswers);
    assert.equal(new Set(path).size, path.length);
    for (const id of path) assert.ok(getAssessmentQuestion(id, pathAnswers).title);
    assert.ok(path.includes('experience'));
    assert.ok(path.includes('timeline'));
  }
});

test('payload matches backend values and preserves explicitly chosen Java and topics', () => {
  assert.deepEqual(buildAssessmentPayload(answers, extra), {
    experience: 'intermediate', language: 'java', timeline: 'this_month', confident_topics: ['Array'], struggle_topics: ['Hash Table'], companies: ['Google', 'Microsoft'],
  });
});

test('missing required answers fail without inventing experience, timeline, or language', () => {
  assert.throws(() => buildAssessmentPayload(initialAnswers, extra), /Choose/);
  assert.throws(() => buildAssessmentPayload(answers, { ...extra, experience: null }), /experience/);
  assert.throws(() => buildAssessmentPayload(answers, { ...extra, timeline: null }), /timeline/);
  assert.equal(validateAssessmentQuestion('targetCompany', answers, extra), null);
  assert.equal(validateAssessmentQuestion('confidentTopics', answers, extra), null);
});

test('only 404 indicates a missing assessment; network and authorization failures remain errors', () => {
  assert.equal(isMissingAssessment(Object.assign(new Error('missing'), { status: 404 })), true);
  for (const error of [new Error('offline'), Object.assign(new Error('denied'), { status: 401 }), Object.assign(new Error('unavailable'), { status: 503 })]) assert.equal(isMissingAssessment(error), false);
});

test('recommendations retain server titles, badges, topics, reasons, and all empty states', () => {
  const problem = { slug: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topics: ['Array'], reason: 'Practice Array.' };
  assert.deepEqual(parseRecommendations({ has_assessment: true, problems: [problem] }).problems, [problem]);
  assert.deepEqual(parseRecommendations({ has_assessment: false, problems: [] }), { has_assessment: false, problems: [] });
  assert.deepEqual(parseRecommendations({ has_assessment: true, problems: [] }).problems, []);
  assert.throws(() => parseRecommendations({ has_assessment: true, problems: [{ ...problem, slug: '' }] }));
  assert.throws(() => parseRecommendations({ problems: [] }));
});

test('saved language and recommended mode survive session creation and navigation', () => {
  const saved = parseSavedAssessment({ user_id: 'test-user', updated_at: '2026-10-30', answers: buildAssessmentPayload(answers, extra) });
  assert.deepEqual(sessionRequestFor({ mode: 'recommended', problemSlug: 'two-sum', language: saved.answers.language }), { problem_slug: 'two-sum', mode: 'practice', language: 'java' });
  assert.equal(interviewRoomUrl('two-sum', 'test-session', 'recommended'), '/interview/two-sum?session=test-session&mode=recommended');
});
