import { NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  safeCredentialEqual,
} from '@/lib/admin-auth';
import { consumeRateLimit, getClientIp } from '@/lib/request-rate-limit';

export const dynamic = 'force-dynamic';

const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60_000;

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ email: '', password: '' }));
  const email = String(body?.email || '').trim().toLowerCase().slice(0, 254);
  const password = String(body?.password || '').slice(0, 512);
  const expectedEmail = String(process.env.ADMIN_EMAIL || 'admin@duyt.vn').trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const rateKey = `admin-login:${getClientIp(request)}:${email || 'unknown'}`;
  const rate = consumeRateLimit(rateKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);

  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    const response = NextResponse.json(
      { ok: false, error: 'Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau.' },
      { status: 429 },
    );
    response.headers.set('Retry-After', String(retryAfter));
    return noStore(response);
  }

  if (!expectedPassword) {
    return noStore(NextResponse.json(
      { ok: false, error: 'ADMIN_PASSWORD chưa được cấu hình trên server.' },
      { status: 500 },
    ));
  }

  const credentialsValid = safeCredentialEqual(email, expectedEmail)
    && safeCredentialEqual(password, expectedPassword);
  if (!credentialsValid) {
    return noStore(NextResponse.json(
      { ok: false, error: 'Email hoặc mật khẩu quản trị không đúng.' },
      { status: 401 },
    ));
  }

  try {
    const response = NextResponse.json({ ok: true });
    const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    response.cookies.set(COOKIE_NAME, createAdminSession(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires,
    });

    return noStore(response);
  } catch (error) {
    return noStore(NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Không thể tạo phiên quản trị.',
      },
      { status: 500 },
    ));
  }
}
