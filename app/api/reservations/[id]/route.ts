import { NextResponse } from 'next/server';
import { ReservationRequest } from '@/components/aurelius/types';
import { readAllData, replaceAllData, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const data = await readAllData();
    const reservation = data.reservations.find((item) => item.id === id);
    if (!reservation) return NextResponse.json({ ok: false, error: 'Reservation not found' }, { status: 404 });
    return NextResponse.json({ ok: true, source: 'supabase', data: reservation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({ ok: false, source: 'local-fallback', warning: message, error: 'Reservation not found' }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const patch = await request.json() as Partial<ReservationRequest>;

  try {
    const current = await readAllData();
    let updatedReservation: ReservationRequest | null = null;
    const reservations = current.reservations.map((reservation) => {
      if (reservation.id !== id) return reservation;
      updatedReservation = { ...reservation, ...patch, id: reservation.id };
      return updatedReservation;
    });

    if (!updatedReservation) {
      return NextResponse.json({ ok: false, error: 'Reservation not found' }, { status: 404 });
    }

    await writeSecurityLog('RESERVATION_PATCH', request, { reservationId: id, status: patch.status || null });
    await replaceAllData({ ...current, reservations });
    return NextResponse.json({ ok: true, source: 'supabase', data: updatedReservation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[reservation-api:patch:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: { ...patch, id } });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const current = await readAllData();
    const reservations = current.reservations.filter((reservation) => reservation.id !== id);
    if (reservations.length === current.reservations.length) {
      return NextResponse.json({ ok: false, error: 'Reservation not found' }, { status: 404 });
    }

    await writeSecurityLog('RESERVATION_DELETE', request, { reservationId: id });
    await replaceAllData({ ...current, reservations });
    return NextResponse.json({ ok: true, source: 'supabase', data: { id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[reservation-api:delete:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: { id } });
  }
}
