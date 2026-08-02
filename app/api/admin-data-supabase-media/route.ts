import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { clearLegacySupabaseMediaFast, writeSecurityLog } from '@/lib/concierge-repository';

// Compatibility endpoint for older admin bundles/service-worker caches.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await clearLegacySupabaseMediaFast();
    void writeSecurityLog('MIGRATE_LEGACY_SUPABASE_MEDIA', request, {
      ...result,
      compatibilityEndpoint: true,
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Không thể chuyển media Supabase cũ sang Cloudinary.';
    console.error('[admin-data-supabase-media]', error);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: 'Kiểm tra terminal npm run dev để xem lỗi đầy đủ. Xác nhận CLOUDINARY_* và SUPABASE_SERVICE_ROLE_KEY trong .env.local.',
      },
      { status: 503 },
    );
  }
}
