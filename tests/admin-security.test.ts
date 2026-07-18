import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COOKIE_NAME,
  createAdminSession,
  isAuthorizedAdminRequest,
  isValidAdminSession,
} from '../lib/admin-auth';
import { consumeRateLimit } from '../lib/request-rate-limit';

test('admin session accepts a fresh signed cookie', () => {
  process.env.ADMIN_SESSION_SECRET = 'qa-secret-at-least-32-characters-long';
  const session = createAdminSession();
  assert.equal(isValidAdminSession(session), true);
  const request = new Request('http://localhost/api/concierge', {
    headers: { cookie: `${COOKIE_NAME}=${encodeURIComponent(session)}` },
  });
  assert.equal(isAuthorizedAdminRequest(request), true);
});

test('admin session rejects tampering and missing cookies', () => {
  process.env.ADMIN_SESSION_SECRET = 'qa-secret-at-least-32-characters-long';
  const session = createAdminSession();
  const tampered = `${session.slice(0, -1)}${session.endsWith('0') ? '1' : '0'}`;
  assert.equal(isValidAdminSession(tampered), false);
  assert.equal(isAuthorizedAdminRequest(new Request('http://localhost/api/concierge')), false);
});

test('rate limiter blocks requests over the configured window', () => {
  const key = `qa-${Date.now()}-${Math.random()}`;
  assert.equal(consumeRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(consumeRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(consumeRateLimit(key, 2, 60_000).allowed, false);
});
