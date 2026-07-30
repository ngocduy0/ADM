import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { clearLegacySupabaseMediaFast, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await clearLegacySupabaseMediaFast();
    void writeSecurityLog('CLEAR_LEGACY_SUPABASE_MEDIA', request, result);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Không thể dọn media Supabase cũ.' },
      { status: 503 },
    );
  }
}
