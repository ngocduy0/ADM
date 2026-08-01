import test from 'node:test';
import { readFileSync } from 'node:fs';
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


test('production rejects the known development session secret fallback', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  const previousPassword = process.env.ADMIN_PASSWORD;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.ADMIN_PASSWORD;
    assert.throws(() => createAdminSession(), /chưa được cấu hình an toàn/);
    assert.equal(isValidAdminSession('v2.1.9999999999999.invalid'), false);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousSecret;
    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousPassword;
  }
});

test('login route has brute-force protection and no-store responses', () => {
  const source = readFileSync('app/api/admin-login/route.ts', 'utf8');
  assert.match(source, /consumeRateLimit/);
  assert.match(source, /status:\s*429/);
  assert.match(source, /Retry-After/);
  assert.match(source, /Cache-Control', 'no-store/);
});
