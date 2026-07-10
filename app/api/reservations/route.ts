import { NextResponse } from 'next/server';
import { INITIAL_RESERVATIONS } from '@/components/aurelius/data';
import { BookingStatus, Customer, ReservationRequest, VipStatus } from '@/components/aurelius/types';
import { readAllData, replaceAllData, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

function readReservationsPayload(body: unknown): ReservationRequest[] | null {
  if (Array.isArray(body)) return body as ReservationRequest[];
  if (body && typeof body === 'object' && Array.isArray((body as { reservations?: unknown }).reservations)) {
    return (body as { reservations: ReservationRequest[] }).reservations;
  }
  return null;
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim();
}

function upsertCustomerFromReservation(customers: Customer[], reservation: ReservationRequest) {
  const phoneKey = normalizePhone(reservation.phoneNumber);
  const existing = customers.find((customer) => normalizePhone(customer.phoneNumber) === phoneKey);

  if (!existing) {
    const nextCustomer: Customer = {
      id: `cust-${Date.now()}`,
      fullName: reservation.fullName,
      phoneNumber: reservation.phoneNumber,
      notes: `Yêu cầu đặt chỗ từ website ngày ${reservation.date}. Bàn/phòng: ${reservation.preferredTableName || 'Concierge chọn'}.`,
      vipStatus: VipStatus.VIP,
      favoriteVenueIds: [reservation.venueId],
      createdAt: new Date().toISOString(),
    };
    return [nextCustomer, ...customers];
  }

  return customers.map((customer) => {
    if (customer.id !== existing.id) return customer;
    const favoriteVenueIds = customer.favoriteVenueIds.includes(reservation.venueId)
      ? customer.favoriteVenueIds
      : [...customer.favoriteVenueIds, reservation.venueId];
    return {
      ...customer,
      fullName: customer.fullName || reservation.fullName,
      phoneNumber: customer.phoneNumber || reservation.phoneNumber,
      favoriteVenueIds,
    };
  });
}

export async function GET() {
  try {
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: data.reservations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[reservations-api:get:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: INITIAL_RESERVATIONS });
  }
}

export async function POST(request: Request) {
  const body = await request.json() as Partial<ReservationRequest>;

  if (!body.venueId || !body.fullName || !body.phoneNumber || !body.date || !body.arrivalTime) {
    return NextResponse.json({ ok: false, error: 'Missing required reservation fields' }, { status: 400 });
  }

  try {
    const current = await readAllData();
    const venue = current.venues.find((item) => item.id === body.venueId);
    const spot = venue?.preferredTables.find((table) => table.id === body.preferredTableId || table.name === body.preferredTableName);

    const reservation: ReservationRequest = {
      id: body.id || `res-${Date.now()}`,
      venueId: body.venueId,
      venueName: body.venueName || venue?.name || 'Địa điểm chưa xác định',
      fullName: body.fullName,
      phoneNumber: body.phoneNumber,
      guestCount: Number(body.guestCount) || 1,
      date: body.date,
      arrivalTime: body.arrivalTime,
      preferredTableId: body.preferredTableId || spot?.id || '',
      preferredTableName: body.preferredTableName || spot?.name || 'Concierge chọn bàn',
      preferredTableArea: body.preferredTableArea || spot?.area,
      preferredTableMinimumSpend: body.preferredTableMinimumSpend || spot?.minimumSpend,
      preferredTableColor: body.preferredTableColor || spot?.color,
      preferredTableCapacity: body.preferredTableCapacity || spot?.capacity,
      referenceCode: body.referenceCode,
      notes: body.notes || '',
      status: body.status || BookingStatus.NEW,
      createdAt: body.createdAt || new Date().toISOString(),
      source: body.source || 'Web Form',
    };

    const reservations = [reservation, ...current.reservations.filter((item) => item.id !== reservation.id)];
    const customers = upsertCustomerFromReservation(current.customers, reservation);

    await writeSecurityLog('RESERVATION_POST', request, {
      reservationId: reservation.id,
      venueId: reservation.venueId,
      guestCount: reservation.guestCount,
    });
    await replaceAllData({ venues: current.venues, customers, reservations });
    const next = await readAllData();

    return NextResponse.json({ ok: true, source: 'supabase', data: { reservation, payload: next } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[reservations-api:post:fallback]', message);
    const fallbackReservation = {
      ...body,
      id: body.id || `res-${Date.now()}`,
      status: body.status || BookingStatus.NEW,
      createdAt: body.createdAt || new Date().toISOString(),
      source: body.source || 'Web Form',
    } as ReservationRequest;
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: { reservation: fallbackReservation } }, { status: 201 });
  }
}

export async function PUT(request: Request) {
  const reservations = readReservationsPayload(await request.json());
  if (!reservations) {
    return NextResponse.json({ ok: false, error: 'Invalid reservations payload' }, { status: 400 });
  }

  try {
    const current = await readAllData();
    await writeSecurityLog('RESERVATIONS_PUT', request, { reservations: reservations.length });
    await replaceAllData({ ...current, reservations });
    const next = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: next.reservations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[reservations-api:put:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: reservations });
  }
}
