import { NextResponse } from 'next/server';
import { INITIAL_CUSTOMERS, INITIAL_RESERVATIONS, INITIAL_VENUES } from '@/components/aurelius/data';
import { ConciergePayload, readAllData, replaceAllData, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[concierge-api:get:fallback]', message);
    return NextResponse.json({
      ok: true,
      source: 'local-fallback',
      warning: message,
      data: { venues: INITIAL_VENUES, customers: INITIAL_CUSTOMERS, reservations: INITIAL_RESERVATIONS },
    });
  }
}

export async function PUT(request: Request) {
  const payload = await request.json() as ConciergePayload;
  if (!payload?.venues || !payload?.customers || !payload?.reservations) {
    return NextResponse.json({ ok: false, error: 'Invalid concierge payload' }, { status: 400 });
  }

  try {
    await writeSecurityLog('CONCIERGE_DATA_PUT', request, {
      venues: payload.venues.length,
      reservations: payload.reservations.length,
      customers: payload.customers.length,
      latestReservationId: payload.reservations[0]?.id || null,
    });
    await replaceAllData(payload);
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[concierge-api:put:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: payload });
  }
}
