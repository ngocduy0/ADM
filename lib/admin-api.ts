import { NextResponse } from 'next/server';
import { isAuthorizedAdminRequest } from '@/lib/admin-auth';

export function requireAdminApi(request: Request) {
  if (isAuthorizedAdminRequest(request)) return null;
  return NextResponse.json(
    { ok: false, error: 'Phiên quản trị không hợp lệ hoặc đã hết hạn.' },
    { status: 401 },
  );
}
