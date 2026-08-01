import { NextResponse } from 'next/server';
import { isAuthorizedAdminRequest } from '@/lib/admin-auth';

function isUnsafeMethod(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export function isTrustedSameOriginRequest(request: Request) {
  if (!isUnsafeMethod(request.method)) return true;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;

  const origin = request.headers.get('origin');
  if (!origin) return true; // Cho phép server-to-server/cURL sau khi đã xác thực cookie.

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function requireAdminApi(request: Request) {
  if (!isAuthorizedAdminRequest(request)) {
    return NextResponse.json(
      { ok: false, error: 'Phiên quản trị không hợp lệ hoặc đã hết hạn.' },
      { status: 401 },
    );
  }

  if (!isTrustedSameOriginRequest(request)) {
    return NextResponse.json(
      { ok: false, error: 'Yêu cầu quản trị khác nguồn đã bị chặn.' },
      { status: 403 },
    );
  }

  return null;
}
