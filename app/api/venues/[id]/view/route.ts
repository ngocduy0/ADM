import { NextResponse } from 'next/server';
import { incrementVenueViewCountFast } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };
const recentViews = new Map<string, number>();
const VIEW_WINDOW_MS = 60_000;

function clientKey(request: Request, venueId: string) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'local';
  return `${ip}:${venueId}`;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const key = clientKey(request, id);
  const now = Date.now();
  const previous = recentViews.get(key) || 0;
  if (now - previous < VIEW_WINDOW_MS) {
    return NextResponse.json({ ok: true, source: 'rate-limited', data: { id } });
  }
  recentViews.set(key, now);
  if (recentViews.size > 5_000) {
    for (const [entry, timestamp] of recentViews) {
      if (now - timestamp > VIEW_WINDOW_MS) recentViews.delete(entry);
    }
  }

  try {
    const viewCount = await incrementVenueViewCountFast(id);
    return NextResponse.json({ ok: true, source: 'supabase', data: { id, viewCount } });
  } catch (error) {
    recentViews.delete(key);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể cập nhật lượt xem.' }, { status: 503 });
  }
}
