import { NextResponse } from 'next/server';
import { BookingStatus, type ReservationRequest } from '@/components/aurelius/types';
import { getStatusTransitionDecision, validateReservation } from '@/lib/booking-rules';
import { requireAdminApi } from '@/lib/admin-api';
import {
  deleteReservationFast,
  readAllData,
  readReservationStatusFast,
  updateReservationStatusFast,
  upsertReservationFast,
  writeSecurityLog,
} from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

function validationResponse(issues: Array<{ field: string; message: string }>) {
  return NextResponse.json({ ok: false, error: issues[0]?.message || 'Dữ liệu booking không hợp lệ.', issues }, { status: 422 });
}

export async function GET(request: Request, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    const data = await readAllData();
    const reservation = data.reservations.find((item) => item.id === id);
    if (!reservation) return NextResponse.json({ ok: false, error: 'Không tìm thấy booking.' }, { status: 404 });
    return NextResponse.json({ ok: true, source: 'supabase', data: reservation });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không tải được booking.' }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const patch = await request.json() as Partial<ReservationRequest>;

  try {
    const isStatusOnly = Object.keys(patch).length === 1 && Boolean(patch.status);
    if (isStatusOnly) {
      const existing = await readReservationStatusFast(id);
      if (!existing) return NextResponse.json({ ok: false, error: 'Không tìm thấy booking.' }, { status: 404 });
      const nextStatus = patch.status as BookingStatus;
      if (!Object.values(BookingStatus).includes(nextStatus)) {
        return validationResponse([{ field: 'status', message: 'Trạng thái booking không hợp lệ.' }]);
      }
      const decision = getStatusTransitionDecision(existing, nextStatus);
      if (!decision.allowed) return validationResponse([{ field: 'status', message: decision.reason || 'Không thể đổi trạng thái.' }]);
      await updateReservationStatusFast(id, nextStatus);
      const saved = { ...existing, status: nextStatus };
      void writeSecurityLog('RESERVATION_STATUS_PATCH', request, { reservationId: id, status: nextStatus });
      return NextResponse.json({ ok: true, source: 'supabase', data: saved });
    }

    const current = await readAllData();
    const existing = current.reservations.find((item) => item.id === id);
    if (!existing) return NextResponse.json({ ok: false, error: 'Không tìm thấy booking.' }, { status: 404 });

    const candidate: ReservationRequest = { ...existing, ...patch, id: existing.id };
    if (patch.status && patch.status !== existing.status) {
      const decision = getStatusTransitionDecision(existing, patch.status as BookingStatus);
      if (!decision.allowed) return validationResponse([{ field: 'status', message: decision.reason || 'Không thể đổi trạng thái.' }]);
    }

    const validation = validateReservation(candidate, current.venues, current.reservations, { existing });
    if (!validation.valid) return validationResponse(validation.issues);
    await upsertReservationFast(candidate, current);

    void writeSecurityLog('RESERVATION_PATCH', request, { reservationId: id, status: patch.status || null });
    return NextResponse.json({ ok: true, source: 'supabase', data: candidate });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể cập nhật booking.' }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    const current = await readAllData();
    if (!current.reservations.some((item) => item.id === id)) {
      return NextResponse.json({ ok: false, error: 'Không tìm thấy booking.' }, { status: 404 });
    }
    await deleteReservationFast(id);
    void writeSecurityLog('RESERVATION_DELETE', request, { reservationId: id });
    return NextResponse.json({ ok: true, source: 'supabase', data: { id } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể xóa booking.' }, { status: 503 });
  }
}
