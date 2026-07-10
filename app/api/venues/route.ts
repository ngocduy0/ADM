import { NextResponse } from 'next/server';
import { INITIAL_VENUES } from '@/components/aurelius/data';
import { Venue } from '@/components/aurelius/types';
import { readAllData, replaceAllData, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

function readVenuesPayload(body: unknown): Venue[] | null {
  if (Array.isArray(body)) return body as Venue[];
  if (body && typeof body === 'object' && Array.isArray((body as { venues?: unknown }).venues)) {
    return (body as { venues: Venue[] }).venues;
  }
  return null;
}

export async function GET() {
  try {
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: data.venues });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[venues-api:get:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: INITIAL_VENUES });
  }
}

export async function PUT(request: Request) {
  const venues = readVenuesPayload(await request.json());
  if (!venues) {
    return NextResponse.json({ ok: false, error: 'Invalid venues payload' }, { status: 400 });
  }

  try {
    const current = await readAllData();
    await writeSecurityLog('VENUES_PUT', request, { venues: venues.length });
    await replaceAllData({ ...current, venues });
    const next = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: next.venues });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[venues-api:put:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: venues });
  }
}
