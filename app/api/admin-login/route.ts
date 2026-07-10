import { NextResponse } from 'next/server';
import { COOKIE_NAME, SESSION_MAX_AGE_SECONDS, createAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({ email: '', password: '' }));
  const expectedEmail = process.env.ADMIN_EMAIL || 'admin@duytconcierge.com';
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD is not configured on the server.' }, { status: 500 });
  }

  if (String(email || '').trim().toLowerCase() !== expectedEmail.toLowerCase() || String(password || '') !== expectedPassword) {
    return NextResponse.json({ ok: false, error: 'Invalid admin email or password.' }, { status: 401 });
  }

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

  return response;
}
