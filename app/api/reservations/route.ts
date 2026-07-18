import { NextResponse } from 'next/server';
import { INITIAL_RESERVATIONS } from '@/components/aurelius/data';
import { BookingStatus, type ReservationRequest } from '@/components/aurelius/types';
import { validateReservation } from '@/lib/booking-rules';
import { requireAdminApi } from '@/lib/admin-api';
import { isAuthorizedAdminRequest } from '@/lib/admin-auth';
import { consumeRateLimit, getClientIp } from '@/lib/request-rate-limit';
import { readAllData, replaceAllData, upsertBookingNotificationFast, upsertReservationFast, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

function readReservationsPayload(body: unknown): ReservationRequest[] | null {
  if (Array.isArray(body)) return body as ReservationRequest[];
  if (body && typeof body === 'object' && Array.isArray((body as { reservations?: unknown }).reservations)) {
    return (body as { reservations: ReservationRequest[] }).reservations;
  }
  return null;
}

function validationResponse(issues: Array<{ field: string; message: string }>) {
  return NextResponse.json({ ok: false, error: issues[0]?.message || 'Dữ liệu booking không hợp lệ.', issues }, { status: 422 });
}

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: data.reservations });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      source: 'local-fallback',
      warning: error instanceof Error ? error.message : 'Không thể kết nối cơ sở dữ liệu.',
      data: INITIAL_RESERVATIONS,
    });
  }
}

export async function POST(request: Request) {
  const body = await request.json() as Partial<ReservationRequest>;
  const isAdmin = isAuthorizedAdminRequest(request);
  if (!isAdmin) {
    const rate = consumeRateLimit(`booking:${getClientIp(request)}`, 8, 10 * 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: 'Bạn đã gửi quá nhiều yêu cầu đặt chỗ. Vui lòng thử lại sau.' }, { status: 429 });
    }
  }
  try {
    const current = await readAllData();
    const venue = current.venues.find((item) => item.id === body.venueId);
    const table = venue?.preferredTables.find((item) => item.id === body.preferredTableId || item.name === body.preferredTableName);
    const reservation: ReservationRequest = {
      id: isAdmin && body.id ? body.id : `res-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      venueId: body.venueId || '',
      venueName: venue?.name || '',
      fullName: body.fullName || '',
      phoneNumber: body.phoneNumber || '',
      guestCount: Number(body.guestCount) || 1,
      date: body.date || '',
      arrivalTime: body.arrivalTime || '',
      preferredTableId: table?.id || '',
      preferredTableName: table?.name || 'Chưa chọn bàn',
      preferredTableArea: table?.area,
      preferredTableMinimumSpend: table?.minimumSpend,
      preferredTableColor: table?.color,
      preferredTableCapacity: table?.capacity,
      referenceCode: body.referenceCode || `DUYT-${Date.now().toString().slice(-6)}`,
      notes: String(body.notes || '').slice(0, 500),
      status: isAdmin && body.status ? body.status : BookingStatus.NEW,
      createdAt: isAdmin && body.createdAt ? body.createdAt : new Date().toISOString(),
      source: isAdmin && body.source ? body.source : 'Web Form',
    };

    const validation = validateReservation(reservation, current.venues, current.reservations);
    if (!validation.valid) return validationResponse(validation.issues);

    const saved = await upsertReservationFast(reservation, current);
    await upsertBookingNotificationFast(saved).catch(() => undefined);
    void writeSecurityLog('RESERVATION_POST', request, {
      reservationId: saved.id,
      venueId: saved.venueId,
      guestCount: saved.guestCount,
    });
    return NextResponse.json({ ok: true, source: 'supabase', data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể tạo booking.' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const reservations = readReservationsPayload(await request.json());
  if (!reservations) return NextResponse.json({ ok: false, error: 'Payload bookings không hợp lệ.' }, { status: 400 });

  try {
    const current = await readAllData();
    for (const reservation of reservations) {
      const existing = current.reservations.find((item) => item.id === reservation.id) || null;
      const validation = validateReservation(reservation, current.venues, reservations, { existing });
      if (!validation.valid) return validationResponse(validation.issues);
    }
    await replaceAllData({ ...current, reservations });
    void writeSecurityLog('RESERVATIONS_PUT', request, { reservations: reservations.length });
    return NextResponse.json({ ok: true, source: 'supabase', data: reservations });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể đồng bộ bookings.' }, { status: 503 });
  }
}
