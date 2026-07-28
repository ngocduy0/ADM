import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { isAdminPushConfigured, saveAdminPushSubscription } from '@/lib/admin-push-server';
import type { AdminPushSubscriptionInput } from '@/lib/admin-push-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  if (!isAdminPushConfigured()) {
    return NextResponse.json({ ok: false, error: 'Server chưa cấu hình đầy đủ Web Push.' }, { status: 503 });
  }

  try {
    const body = await request.json() as AdminPushSubscriptionInput;
    await saveAdminPushSubscription(body, request.headers.get('user-agent') || '');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Không đăng ký được thiết bị nhận thông báo.',
    }, { status: 422 });
  }
}
