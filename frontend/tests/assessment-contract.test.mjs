import test from 'node:test';
import { chicagoDate } from '../src/lib/interviewCalendar.ts';
import assert from 'node:assert/strict';
import { initialAnswers, getChosenLanguage, getLanguageRatings, validateInterviewDate, updateAssessmentAnswers } from '../src/lib/practiceProfile.ts';
import { buildAssessmentPayload, getAssessmentPath, getAssessmentQuestion, restoreAssessmentAnswers, validateAssessmentQuestion } from '../src/lib/assessmentQuestions.ts';
import { isMissingAssessment, parseRecommendations, parseSavedAssessment } from '../src/lib/assessmentContract.ts';
import { interviewRoomUrl, sessionRequestFor } from '../src/lib/interviewModes.ts';

const answers = { ...initialAnswers, hasLeetCodeExperience: true, languagesUsed: 'Java', languageComfort: 5, languageRatings: {python: 8, java: 5}, interviewDate: chicagoDate(), weeklyInterviewGoal: 3, strugglingTopics: ['Hash Table'], targetCompany: 'Google, Microsoft, Google' };
const extra = { experience: 'intermediate', timeline: 'this_month', confidentTopics: ['Array'] };

test('every assessment path has question definitions and includes required experience and comfort without timeline', () => {
  for (const pathAnswers of [answers, { ...initialAnswers, hasLeetCodeExperience: false, hasCodingExperience: false }, { ...initialAnswers, hasLeetCodeExperience: false, hasCodingExperience: true, languagesUsed: 'both' }]) {
    const path = getAssessmentPath(pathAnswers);
    assert.equal(new Set(path).size, path.length);
    for (const id of path) assert.ok(getAssessmentQuestion(id, pathAnswers).title);
    assert.ok(path.includes('experience'));
    assert.ok(!path.includes('timeline'));
    assert.ok(path.includes('languageComfort'));
    if (path.includes('language')) assert.equal(path[path.indexOf('language') + 1], 'languageComfort');
  }
});

test('payload matches backend values and preserves explicitly chosen Java and topics', () => {
  assert.deepEqual(buildAssessmentPayload(answers, extra), {
    experience: 'intermediate', language: 'java', preferred_language: 'Java', other_language_used: null, language_comfort: {python: 8, java: 5}, interview_date: chicagoDate(), has_leetcode_experience: true, has_coding_experience: null, languages_used: 'Java', weekly_interview_goal: 3, interview_confidence: null, confident_topics: ['Array'], struggle_topics: ['Hash Table'], companies: ['Google', 'Microsoft'],
  });
});

test('missing required answers fail without inventing experience, timeline, or language', () => {
  assert.throws(() => buildAssessmentPayload(initialAnswers, extra), /Choose/);
  assert.throws(() => buildAssessmentPayload(answers, { ...extra, experience: null }), /experience/);
  assert.ok(buildAssessmentPayload(answers, { ...extra, timeline: null }));
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
  assert.deepEqual(sessionRequestFor({ mode: 'recommended', problemSlug: 'two-sum', language: saved.answers.language }), { problem_slug: 'two-sum', mode: 'recommended', language: 'java' });
  assert.equal(interviewRoomUrl('two-sum', 'test-session', 'recommended'), '/interview/two-sum?session=test-session&mode=recommended');
});

test('custom answers are required, trimmed, round-trip and never reach the runner', () => {
  let custom = { ...answers, languagesUsed: 'other', otherLanguageUsed: '  Go  ', selectedLanguage: 'other', customLanguage: ' C++ ', languageRatings: {python: 8, java: 5, go: 6, 'c++': 7} };
  const payload = buildAssessmentPayload(custom, extra);
  assert.equal(payload.preferred_language, 'C++');
  assert.equal(payload.other_language_used, 'Go');
  assert.equal(payload.language, 'python3');
  const saved = parseSavedAssessment({user_id: 'u', updated_at: 'today', answers: payload});
  assert.equal(saved.answers.preferred_language, 'C++');
  assert.deepEqual(saved.answers.language_comfort, {python: 8, java: 5, go: 6, 'c++': 7});
  assert.equal(getChosenLanguage(custom), 'C++');
  assert.match(getAssessmentQuestion('languageComfort', custom).title, /languages/);
  assert.ok(validateAssessmentQuestion('used', {...custom, otherLanguageUsed: ' '}, extra));
  assert.ok(validateAssessmentQuestion('language', {...custom, customLanguage: ' '}, extra));
  custom = updateAssessmentAnswers(custom, {selectedLanguage: 'Java', languagesUsed: 'both'});
  assert.equal(custom.customLanguage, '');
  assert.equal(custom.otherLanguageUsed, '');
  assert.equal(custom.languageComfort, 5);
  assert.deepEqual(custom.languageRatings, {python: 8, java: 5});
  assert.equal(validateAssessmentQuestion('languageComfort', custom, extra), null);
  for (const rating of [null, 0, 11, 1.5]) assert.ok(validateAssessmentQuestion('languageComfort', {...answers, languageRatings: {python: rating, java: 5}}, extra));
  for (const rating of [1, 10]) assert.equal(validateAssessmentQuestion('languageComfort', {...answers, languageRatings: {python: rating, java: 5}}, extra), null);
});

test('legacy saved answers remain readable', () => {
  const legacy = {experience: 'beginner', language: 'java', timeline: 'later', confident_topics: [], struggle_topics: [], companies: []};
  assert.equal(parseSavedAssessment({user_id: 'u', updated_at: 'today', answers: legacy}).answers.language, 'java');
});

test('independent ratings survive selection, custom rename resets only custom, and restoration retains date', () => {
  const original = {...answers, languagesUsed: 'both', selectedLanguage: 'other', customLanguage: 'Go', languageRatings: {python: 8, java: 5, go: 6}};
  const changed = updateAssessmentAnswers(original, {customLanguage: 'Rust'});
  assert.deepEqual(changed.languageRatings, {python: 8, java: 5});
  assert.match(validateAssessmentQuestion('languageComfort', changed, extra), /Rust/);
  const rated = updateAssessmentAnswers(changed, {languageRatings: {...changed.languageRatings, rust: 7}});
  assert.deepEqual(getLanguageRatings(rated), {python: 8, java: 5, rust: 7});
  const payload = buildAssessmentPayload(rated, extra);
  const restored = restoreAssessmentAnswers(parseSavedAssessment({user_id:'u', updated_at:'today', answers:payload}).answers);
  assert.deepEqual(getLanguageRatings(restored.answers), {python: 8, java: 5, rust: 7});
  assert.equal(restored.answers.interviewDate, chicagoDate());
  assert.deepEqual(buildAssessmentPayload(restored.answers, restored.extra), payload);
});

test('required interview date accepts today and rejects missing, malformed, invalid and past dates', () => {
  assert.match(validateInterviewDate('', '2026-11-02'), /Enter/);
  assert.match(validateInterviewDate('2026-11-01', '2026-11-02'), /future/);
  assert.equal(validateInterviewDate('2026-11-02', '2026-11-02'), null);
  assert.equal(validateInterviewDate('2026-11-23', '2026-11-02'), null);
  for (const date of ['2027-02-30', '11/02/2026', '2026-1-2']) assert.match(validateInterviewDate(date), /valid/);
  assert.throws(() => buildAssessmentPayload({...answers, interviewDate:''},extra), /interview date/);
});

test('custom ratings disappear when the conditional preference question is skipped', () => {
  const current = {...answers, languagesUsed:'both', selectedLanguage:'other', customLanguage:'Go', languageRatings:{python:8,java:5,go:6}};
  const next = updateAssessmentAnswers(current,{languagesUsed:'Python'});
  assert.equal(next.customLanguage,'');
  assert.deepEqual(getLanguageRatings(next),{python:8,java:5});
  assert.deepEqual(buildAssessmentPayload(next,extra).language_comfort,{python:8,java:5});
});

test('recommendation counts and shortfall explanations survive parsing', () => {
  const data = {has_assessment:true, problems:[], target_count:25, minimum_count:20, eligible_count:0, shortfall_message:'No suitable, uncompleted problems remain.'};
  assert.deepEqual(parseRecommendations(data),data);
  assert.throws(()=>parseRecommendations({...data,eligible_count:-1}),/counts/);
  assert.throws(()=>parseRecommendations({...data,shortfall_message:3}),/message/);
});
