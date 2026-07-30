import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { reorderVenueReelsFast, writeSecurityLog, type ReelOrderInput } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

const MAX_REELS = 10;

function normalizeOrdered(value: unknown): ReelOrderInput[] {
  if (!Array.isArray(value)) throw new Error('Danh sách sắp xếp Reel không hợp lệ.');
  if (value.length > MAX_REELS) throw new Error(`Hệ thống chỉ cho phép tối đa ${MAX_REELS} reels.`);
  return value.map((raw, index) => {
    const item = (raw || {}) as Partial<ReelOrderInput>;
    const venueId = String(item.venueId || '').trim().slice(0, 160);
    const reelId = String(item.reelId || '').trim().slice(0, 160);
    if (!venueId || !reelId) throw new Error(`Reel thứ ${index + 1} thiếu mã địa điểm hoặc mã Reel.`);
    return { venueId, reelId };
  });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const ordered = normalizeOrdered(body?.ordered);
    const saved = await reorderVenueReelsFast(ordered, MAX_REELS);
    void writeSecurityLog('REELS_GLOBAL_REORDER', request, { reelCount: saved.length });
    return NextResponse.json({ ok: true, source: 'supabase-metadata', data: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể sắp xếp Reel.';
    const status = /không hợp lệ|thiếu|trùng|tối đa|không khớp|không còn tồn tại/i.test(message) ? 422 : 503;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
