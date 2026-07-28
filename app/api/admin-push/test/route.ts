import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { sendAdminPush } from '@/lib/admin-push-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json() as { endpoint?: unknown };
    const endpoint = String(body.endpoint || '').trim();
    if (!endpoint) return NextResponse.json({ ok: false, error: 'Thiết bị chưa có push endpoint.' }, { status: 400 });

    const result = await sendAdminPush({
      title: 'DuyT Booking · Thông báo thử',
      body: 'Web Push đã kết nối thành công với thiết bị này.',
      url: '/admin/notifications',
      tag: `test:${Date.now()}`,
      kind: 'test',
    }, { endpoint });

    if (!result.configured) {
      return NextResponse.json({ ok: false, error: result.reason || 'Web Push chưa được cấu hình.' }, { status: 503 });
    }
    if (!result.delivered) {
      return NextResponse.json({ ok: false, error: 'Không gửi được thông báo thử đến thiết bị này.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, delivered: result.delivered });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Không gửi được thông báo thử.',
    }, { status: 500 });
  }
}
