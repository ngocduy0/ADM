import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { removeAdminPushSubscription } from '@/lib/admin-push-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json() as { endpoint?: unknown };
    const endpoint = String(body.endpoint || '').trim();
    if (!endpoint) return NextResponse.json({ ok: false, error: 'Thiếu push endpoint.' }, { status: 400 });
    await removeAdminPushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Không hủy được thông báo trên thiết bị.',
    }, { status: 500 });
  }
}
