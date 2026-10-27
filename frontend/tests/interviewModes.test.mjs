
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sessionRequestFor,
  interviewRoomUrl,
  parseInterviewMode,
} from '../src/lib/interviewModes.ts';

for (const [mode, stored] of [
  ['recommended', 'recommended'],
  ['custom', 'custom'],
  ['surprise_me', 'surprise'],
]) {
  test(mode + ' creates a request accepted by the coding-session API', () => {
    assert.deepEqual(
      sessionRequestFor({
        mode,
        problemSlug: 'two-sum',
        language: 'python3',
      }),
      {
        problem_slug: 'two-sum',
        mode: stored,
        language: 'python3',
      }
    );
  });
}

test('Java language is retained', () => {
  assert.equal(
    sessionRequestFor({
      mode: 'custom',
      problemSlug: 'two-sum',
      language: 'java',
    }).language,
    'java'
  );
});

test('company scenarios create a company session request', () => {
  assert.deepEqual(
    sessionRequestFor({
      mode: 'company',
      scenarioSlug: 'company-task',
      language: 'python3',
    }),
    {
      problem_slug: 'company-task',
      mode: 'company',
      language: 'python3',
    }
  );
});

test('company scenarios require a scenario slug', () => {
  assert.throws(
    () => sessionRequestFor({
      mode: 'company',
      scenarioSlug: ' ',
      language: 'python3',
    }),
    /company scenario/
  );
});

test('missing problem or unsupported language fails before a request', () => {
  assert.throws(
    () => sessionRequestFor({
      mode: 'custom',
      problemSlug: ' ',
      language: 'python3',
    }),
    /question/
  );

  assert.throws(
    () => sessionRequestFor({
      mode: 'custom',
      problemSlug: 'two-sum',
      language: 'ruby',
    }),
    /Python or Java/
  );
});

test('room URLs preserve selection mode separately from storage mode', () => {
  const url = new URL(
    interviewRoomUrl('two-sum', 'session-1', 'surprise_me'),
    'https://example.test'
  );

  assert.equal(url.searchParams.get('session'), 'session-1');
  assert.equal(
    parseInterviewMode(url.searchParams.get('mode')),
    'surprise_me'
  );
});