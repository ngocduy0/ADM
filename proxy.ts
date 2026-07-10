import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'duyt_admin_session';

const securityHeaders: Record<string, string> = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.instagram.com https://*.cdninstagram.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https:",
    "frame-src 'self' https://www.instagram.com https://instagram.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self' mailto:",
  ].join('; '),
};

function looksExpiredAdminCookie(value?: string) {
  if (!value) return true;
  const [version, , expiresAtRaw] = value.split('.');
  if (version !== 'v2') return true;
  const expiresAt = Number(expiresAtRaw);
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

function withSecurityHeaders(response: NextResponse, request: NextRequest) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const country = request.headers.get('cf-ipcountry');
  const cfRay = request.headers.get('cf-ray');
  if (country) response.headers.set('X-DuyT-CF-Country', country);
  if (cfRay) response.headers.set('X-DuyT-CF-Ray', cfRay);

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    // Check nhanh ở proxy để cookie cũ/hết hạn không vào được shell admin.
    // Chữ ký HMAC vẫn được kiểm tra chắc chắn ở app/admin/page.tsx và API server.
    if (looksExpiredAdminCookie(cookieValue)) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set(ADMIN_COOKIE_NAME, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
      return withSecurityHeaders(response, request);
    }
  }

  return withSecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: [
    '/((?!api/upload-media|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
