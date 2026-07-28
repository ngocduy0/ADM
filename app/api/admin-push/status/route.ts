import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { getAdminPushEnabledCount, isAdminPushConfigured } from '@/lib/admin-push-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  const configured = isAdminPushConfigured();
  if (!configured) return NextResponse.json({ ok: true, configured: false, enabledCount: 0 });

  try {
    const enabledCount = await getAdminPushEnabledCount();
    return NextResponse.json({ ok: true, configured: true, enabledCount });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      configured: true,
      enabledCount: 0,
      error: error instanceof Error ? error.message : 'Không đọc được trạng thái Web Push.',
    }, { status: 500 });
  }
}
