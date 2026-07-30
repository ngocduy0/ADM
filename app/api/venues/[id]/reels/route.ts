import { NextRequest, NextResponse } from 'next/server';
import type { HomepageReel } from '@/components/aurelius/types';
import { requireAdminApi } from '@/lib/admin-api';
import { updateVenueReelsFast, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

const MAX_REELS = 10;
const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/duytadm/';

type Params = { params: Promise<{ id: string }> };

function cleanText(value: unknown, maxLength: number) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeReels(venueId: string, value: unknown): HomepageReel[] {
  if (!Array.isArray(value)) throw new Error('Danh sách reels không hợp lệ.');
  if (value.length > MAX_REELS) throw new Error(`Mỗi địa điểm chỉ được lưu tối đa ${MAX_REELS} reels.`);

  const ids = new Set<string>();
  return value.map((raw, index) => {
    const item = (raw || {}) as Partial<HomepageReel>;
    const id = cleanText(item.id, 120);
    const title = cleanText(item.title, 180);
    const videoUrl = cleanText(item.videoUrl, 2_000);
    const instagramUrl = cleanText(item.instagramUrl, 2_000);

    if (!id) throw new Error(`Reel thứ ${index + 1} thiếu mã nội dung.`);
    if (ids.has(id)) throw new Error('Mã Reel không được trùng nhau.');
    if (!title) throw new Error(`Reel thứ ${index + 1} chưa có tiêu đề.`);
    // Dữ liệu cũ có thể chỉ chứa permalink Instagram. Editor mới vẫn bắt buộc
    // video, nhưng API cho phép giữ bản ghi legacy để bật/tắt hoặc sắp xếp không lỗi.
    if (!videoUrl && !instagramUrl) throw new Error(`Reel “${title}” chưa có video.`);
    ids.add(id);

    return {
      id,
      venueId,
      title,
      tag: cleanText(item.tag, 80) || 'Featured',
      caption: cleanText(item.caption, 1_000),
      // URL Instagram có thể để trống. Public UI sẽ tự mở @duytadm.
      instagramUrl,
      videoUrl,
      videoPath: cleanText(item.videoPath, 2_000),
      posterUrl: cleanText(item.posterUrl, 2_000),
      posterPath: cleanText(item.posterPath, 2_000),
      isActive: item.isActive !== false,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
      placement: item.placement === 'HOME_HOST' ? 'HOME_HOST' : 'HOME_FEED',
    };
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const venueId = decodeURIComponent(id);

  let reels: HomepageReel[];
  try {
    const body = await request.json().catch(() => null);
    reels = normalizeReels(venueId, body?.reels);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Danh sách Reels không hợp lệ.' },
      { status: 422 },
    );
  }

  try {
    const saved = await updateVenueReelsFast(venueId, reels, MAX_REELS);

    void writeSecurityLog('VENUE_REELS_PATCH', request, {
      venueId,
      reelCount: saved.length,
      defaultInstagramUrl: DEFAULT_INSTAGRAM_URL,
    });

    return NextResponse.json({ ok: true, source: 'supabase', data: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lưu Reels.';
    const status = message === 'Venue not found'
      ? 404
      : message.includes('tối đa')
        ? 422
        : 503;
    return NextResponse.json(
      { ok: false, error: message === 'Venue not found' ? 'Không tìm thấy địa điểm.' : message },
      { status },
    );
  }
}
