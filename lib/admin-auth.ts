import crypto from 'crypto';

const COOKIE_NAME = 'duyt_admin_session';

// Mặc định giữ phiên đăng nhập admin 4 giờ để upload video và chỉnh nội dung không bị hết phiên giữa chừng.
// Có thể chỉnh trong .env.local: ADMIN_SESSION_MAX_AGE_SECONDS=14400
const SESSION_MAX_AGE_SECONDS = Number(process.env.ADMIN_SESSION_MAX_AGE_SECONDS || 60 * 60 * 4);
const SESSION_VERSION = 'v2';
const DEV_FALLBACK_SECRET = 'duyt-local-dev-secret-change-me';

function getSecret() {
  const configured = String(
    process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '',
  ).trim();
  if (configured) return configured;

  // Không bao giờ chấp nhận secret mặc định đã biết ở production. Nếu deployment
  // thiếu cả ADMIN_SESSION_SECRET và ADMIN_PASSWORD thì mọi cookie đều vô hiệu.
  return process.env.NODE_ENV === 'production' ? '' : DEV_FALLBACK_SECRET;
}

function signWithSecret(value: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
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

export function safeCredentialEqual(actual: unknown, expected: unknown) {
  const left = Buffer.from(String(actual ?? ''), 'utf8');
  const right = Buffer.from(String(expected ?? ''), 'utf8');
  if (left.length !== right.length) {
    // Vẫn thực hiện một phép so sánh cố định để giảm rò rỉ thời gian theo độ dài.
    crypto.timingSafeEqual(
      crypto.createHash('sha256').update(left).digest(),
      crypto.createHash('sha256').update(right).digest(),
    );
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

export function createAdminSession() {
  const secret = getSecret();
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET hoặc ADMIN_PASSWORD chưa được cấu hình an toàn.');
  }

  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${SESSION_VERSION}.${issuedAt}.${expiresAt}`;
  return `${payload}.${signWithSecret(payload, secret)}`;
}

export function isValidAdminSession(cookieValue?: string | null) {
  if (!cookieValue) return false;
  const secret = getSecret();
  if (!secret) return false;

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
  return safeEqual(signature, signWithSecret(payload, secret));
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
