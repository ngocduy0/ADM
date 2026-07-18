import { NextResponse } from 'next/server';
import { INITIAL_VENUES } from '@/components/aurelius/data';
import type { Venue } from '@/components/aurelius/types';
import { validateVenue } from '@/lib/booking-rules';
import { requireAdminApi } from '@/lib/admin-api';
import { readAllData, replaceAllData, upsertVenueFast, venueExistsFast, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

function readVenuesPayload(body: unknown): Venue[] | null {
  if (Array.isArray(body)) return body as Venue[];
  if (body && typeof body === 'object' && Array.isArray((body as { venues?: unknown }).venues)) return (body as { venues: Venue[] }).venues;
  return null;
}

export async function GET() {
  try {
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: data.venues });
  } catch (error) {
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: error instanceof Error ? error.message : 'Không thể tải địa điểm.', data: INITIAL_VENUES });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const venue = await request.json() as Venue;
  const validation = validateVenue(venue);
  if (!validation.valid) return NextResponse.json({ ok: false, error: validation.issues[0]?.message, issues: validation.issues }, { status: 422 });
  try {
    if (await venueExistsFast(venue.id)) return NextResponse.json({ ok: false, error: 'Mã địa điểm đã tồn tại.' }, { status: 409 });
    const saved = await upsertVenueFast(venue);
    void writeSecurityLog('VENUE_POST', request, { venueId: venue.id });
    return NextResponse.json({ ok: true, source: 'supabase', data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể tạo địa điểm.' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const venues = readVenuesPayload(await request.json());
  if (!venues) return NextResponse.json({ ok: false, error: 'Payload địa điểm không hợp lệ.' }, { status: 400 });
  for (const venue of venues) {
    const validation = validateVenue(venue);
    if (!validation.valid) return NextResponse.json({ ok: false, error: validation.issues[0]?.message, issues: validation.issues }, { status: 422 });
  }
  try {
    const current = await readAllData();
    await replaceAllData({ ...current, venues });
    void writeSecurityLog('VENUES_PUT', request, { venues: venues.length });
    return NextResponse.json({ ok: true, source: 'supabase', data: venues });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể đồng bộ địa điểm.' }, { status: 503 });
  }
}
