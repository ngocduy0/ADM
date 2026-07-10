import { NextResponse } from 'next/server';
import { INITIAL_CUSTOMERS, INITIAL_RESERVATIONS, INITIAL_VENUES } from '@/components/aurelius/data';
import { Venue } from '@/components/aurelius/types';
import { readAllData, replaceAllData, writeSecurityLog } from '@/lib/concierge-repository';

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
    if (!venue) return NextResponse.json({ ok: false, error: 'Venue not found' }, { status: 404 });
    return NextResponse.json({ ok: true, source: 'supabase', data: venue });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    const venue = findVenue(INITIAL_VENUES, id);
    if (!venue) return NextResponse.json({ ok: false, source: 'local-fallback', warning: message, error: 'Venue not found' }, { status: 404 });
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: venue });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const patch = await request.json() as Partial<Venue>;

  try {
    const current = await readAllData();
    let updatedVenue: Venue | null = null;
    const venues = current.venues.map((venue) => {
      if (venue.id !== id) return venue;
      updatedVenue = { ...venue, ...patch, id: venue.id };
      return updatedVenue;
    });

    if (!updatedVenue) {
      return NextResponse.json({ ok: false, error: 'Venue not found' }, { status: 404 });
    }

    await writeSecurityLog('VENUE_PATCH', request, { venueId: id });
    await replaceAllData({ ...current, venues });
    return NextResponse.json({ ok: true, source: 'supabase', data: updatedVenue });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[venue-api:patch:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: { ...patch, id } });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const current = await readAllData();
    const venues = current.venues.filter((venue) => venue.id !== id);
    if (venues.length === current.venues.length) {
      return NextResponse.json({ ok: false, error: 'Venue not found' }, { status: 404 });
    }

    await writeSecurityLog('VENUE_DELETE', request, { venueId: id });
    await replaceAllData({
      venues,
      customers: current.customers,
      reservations: current.reservations.filter((reservation) => reservation.venueId !== id),
    });
    return NextResponse.json({ ok: true, source: 'supabase', data: { id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[venue-api:delete:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: { id, venues: INITIAL_VENUES, customers: INITIAL_CUSTOMERS, reservations: INITIAL_RESERVATIONS } });
  }
}
