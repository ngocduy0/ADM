import { NextResponse } from 'next/server';
import { INITIAL_VENUES } from '@/components/aurelius/data';
import type { Venue } from '@/components/aurelius/types';
import { validateVenue } from '@/lib/booking-rules';
import { requireAdminApi } from '@/lib/admin-api';
import { deleteVenueFast, readAllData, upsertVenueFast, venueExistsFast, venueHasBookingsFast, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

function findVenue(venues: Venue[], id: string) {
  const safeId = decodeURIComponent(id);
  return venues.find((venue) => venue.id === safeId || venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === safeId);
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const data = await readAllData();
    const venue = findVenue(data.venues, id);
    if (!venue) return NextResponse.json({ ok: false, error: 'Không tìm thấy địa điểm.' }, { status: 404 });
    return NextResponse.json({ ok: true, source: 'supabase', data: venue });
  } catch (error) {
    const venue = findVenue(INITIAL_VENUES, id);
    if (!venue) return NextResponse.json({ ok: false, error: 'Không tìm thấy địa điểm.' }, { status: 404 });
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: error instanceof Error ? error.message : 'Không thể tải địa điểm.', data: venue });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const candidate = await request.json() as Venue;
  try {
    if (!candidate || candidate.id !== id || !candidate.name || !candidate.location || !Array.isArray(candidate.preferredTables)) {
      return NextResponse.json({ ok: false, error: 'Payload địa điểm phải chứa đầy đủ dữ liệu và đúng mã địa điểm.' }, { status: 400 });
    }
    if (!(await venueExistsFast(id))) return NextResponse.json({ ok: false, error: 'Không tìm thấy địa điểm.' }, { status: 404 });
    const validation = validateVenue(candidate);
    if (!validation.valid) return NextResponse.json({ ok: false, error: validation.issues[0]?.message, issues: validation.issues }, { status: 422 });
    const saved = await upsertVenueFast(candidate);
    void writeSecurityLog('VENUE_PATCH', request, { venueId: id });
    return NextResponse.json({ ok: true, source: 'supabase', data: saved });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể cập nhật địa điểm.' }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    if (!(await venueExistsFast(id))) return NextResponse.json({ ok: false, error: 'Không tìm thấy địa điểm.' }, { status: 404 });
    if (await venueHasBookingsFast(id)) {
      return NextResponse.json({ ok: false, error: 'Không thể xóa địa điểm đang có booking.' }, { status: 409 });
    }
    await deleteVenueFast(id);
    void writeSecurityLog('VENUE_DELETE', request, { venueId: id });
    return NextResponse.json({ ok: true, source: 'supabase', data: { id } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể xóa địa điểm.' }, { status: 503 });
  }
}
