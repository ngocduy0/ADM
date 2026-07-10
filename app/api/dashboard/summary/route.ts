import { NextResponse } from 'next/server';
import { BookingStatus } from '@/components/aurelius/types';
import { readAllData } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await readAllData();
    const confirmed = data.reservations.filter((booking) => booking.status === BookingStatus.CONFIRMED).length;
    const pending = data.reservations.filter((booking) => booking.status === BookingStatus.NEW || booking.status === BookingStatus.CONTACTED).length;
    const cancelled = data.reservations.filter((booking) => booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.NO_SHOW).length;
    const completed = data.reservations.filter((booking) => booking.status === BookingStatus.COMPLETED).length;

    return NextResponse.json({
      ok: true,
      source: 'supabase',
      data: {
        venues: data.venues.length,
        customers: data.customers.length,
        reservations: data.reservations.length,
        confirmed,
        pending,
        cancelled,
        completed,
        latestReservations: data.reservations.slice(0, 10),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({ ok: false, source: 'local-fallback', warning: message, error: 'Unable to load dashboard summary' }, { status: 500 });
  }
}
