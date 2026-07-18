import { NextResponse } from 'next/server';
import { INITIAL_CUSTOMERS, INITIAL_RESERVATIONS, INITIAL_VENUES } from '@/components/aurelius/data';
import { type ConciergePayload, readAllData, replaceAllData, writeSecurityLog } from '@/lib/concierge-repository';
import { validateReservation, validateVenue } from '@/lib/booking-rules';
import { requireAdminApi } from '@/lib/admin-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể kết nối cơ sở dữ liệu.';
    return NextResponse.json({
      ok: true,
      source: 'local-fallback',
      warning: message,
      data: { venues: INITIAL_VENUES, customers: INITIAL_CUSTOMERS, reservations: INITIAL_RESERVATIONS },
    });
  }
}

export async function PUT(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const payload = await request.json() as ConciergePayload;
  if (!payload?.venues || !payload?.customers || !payload?.reservations) {
    return NextResponse.json({ ok: false, error: 'Payload hệ thống không hợp lệ.' }, { status: 400 });
  }

  for (const venue of payload.venues) {
    const validation = validateVenue(venue);
    if (!validation.valid) return NextResponse.json({ ok: false, error: validation.issues[0]?.message, issues: validation.issues }, { status: 422 });
  }
  for (const reservation of payload.reservations) {
    const validation = validateReservation(reservation, payload.venues, payload.reservations, { existing: reservation });
    if (!validation.valid) return NextResponse.json({ ok: false, error: validation.issues[0]?.message, issues: validation.issues }, { status: 422 });
  }

  try {
    void writeSecurityLog('CONCIERGE_DATA_PUT', request, {
      venues: payload.venues.length,
      reservations: payload.reservations.length,
      customers: payload.customers.length,
      latestReservationId: payload.reservations[0]?.id || null,
    });
    await replaceAllData(payload);
    return NextResponse.json({ ok: true, source: 'supabase', data: payload });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể đồng bộ dữ liệu.' }, { status: 503 });
  }
}
