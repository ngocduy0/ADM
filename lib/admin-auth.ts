import crypto from 'crypto';

const COOKIE_NAME = 'duyt_admin_session';

// Mặc định chỉ giữ phiên đăng nhập admin 30 phút.
// Có thể chỉnh trong .env.local: ADMIN_SESSION_MAX_AGE_SECONDS=1800
const SESSION_MAX_AGE_SECONDS = Number(process.env.ADMIN_SESSION_MAX_AGE_SECONDS || 60 * 30);
const SESSION_VERSION = 'v2';

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';

  // Production không nên dùng secret mặc định vì cookie cũ có thể còn hợp lệ ngoài ý muốn.
  return secret || 'duyt-local-dev-secret-change-me';
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function safeEqual(a: string, b: string) {
  try {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    if (aBuffer.length !== bBuffer.length) return false;
    return crypto.timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}

export function createAdminSession() {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${SESSION_VERSION}.${issuedAt}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidAdminSession(cookieValue?: string | null) {
  if (!cookieValue) return false;

  const parts = cookieValue.split('.');

  // Force logout cookie đời cũ dạng issuedAt.signature.
  // Sau khi thay file này, admin cũ phải đăng nhập lại.
  if (parts.length !== 4) return false;

  const [version, issuedAtRaw, expiresAtRaw, signature] = parts;
  if (version !== SESSION_VERSION || !issuedAtRaw || !expiresAtRaw || !signature) return false;

  const issuedAt = Number(issuedAtRaw);
  const expiresAt = Number(expiresAtRaw);
  const now = Date.now();

  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return false;
  if (issuedAt > now + 60_000) return false;
  if (expiresAt <= now) return false;
  if (expiresAt - issuedAt > SESSION_MAX_AGE_SECONDS * 1000 + 60_000) return false;

  const payload = `${version}.${issuedAtRaw}.${expiresAtRaw}`;
  return safeEqual(signature, sign(payload));
}

export { COOKIE_NAME, SESSION_MAX_AGE_SECONDS };

function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const entry of cookieHeader.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0) continue;
    const key = entry.slice(0, separator).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(entry.slice(separator + 1).trim());
    } catch {
      return entry.slice(separator + 1).trim();
    }
  }
  return null;
}

export function isAuthorizedAdminRequest(request: Request) {
  return isValidAdminSession(readCookieValue(request.headers.get('cookie'), COOKIE_NAME));
}
