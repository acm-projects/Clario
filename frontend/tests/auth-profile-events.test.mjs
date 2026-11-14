import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldReloadAuthProfile } from '../src/lib/authProfileEvents.ts';

test('browser refocus events from another Supabase identity never reload local development interviews', () => {
  for (const event of ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'INITIAL_SESSION']) {
    assert.equal(shouldReloadAuthProfile(true, event, 'local-user', 'browser-user'), false);
  }
});
test('same-account focus and token refresh retain mounted interview', () => {
  assert.equal(shouldReloadAuthProfile(false, 'SIGNED_IN', 'user', 'user'), false);
  assert.equal(shouldReloadAuthProfile(false, 'TOKEN_REFRESHED', 'user', 'user'), false);
});
test('real account changes and sign out still invalidate protected profile', () => {
  assert.equal(shouldReloadAuthProfile(false, 'SIGNED_IN', 'old', 'new'), true);
  assert.equal(shouldReloadAuthProfile(false, 'SIGNED_OUT', 'user', null), true);
});
