import { NextResponse } from 'next/server';
import type { Customer } from '@/components/aurelius/types';
import { validateCustomer } from '@/lib/booking-rules';
import { requireAdminApi } from '@/lib/admin-api';
import {
  customerExistsFast,
  customerHasBookingsFast,
  deleteCustomerFast,
  readAllData,
  upsertCustomerFast,
  writeSecurityLog,
} from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    const data = await readAllData();
    const customer = data.customers.find((item) => item.id === id);
    if (!customer) return NextResponse.json({ ok: false, error: 'Không tìm thấy khách hàng.' }, { status: 404 });
    const normalizedPhone = customer.phoneNumber.replace(/[\s.()-]/g, '');
    const reservations = data.reservations.filter((booking) =>
      booking.phoneNumber.replace(/[\s.()-]/g, '') === normalizedPhone || booking.fullName.toLowerCase() === customer.fullName.toLowerCase(),
    );
    return NextResponse.json({ ok: true, source: 'supabase', data: { customer, reservations } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể tải khách hàng.' }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const customer = await request.json() as Customer;
  if (!customer || customer.id !== id) {
    return NextResponse.json({ ok: false, error: 'Payload khách hàng không hợp lệ hoặc sai mã.' }, { status: 400 });
  }
  const validation = validateCustomer(customer);
  if (!validation.valid) {
    return NextResponse.json({ ok: false, error: validation.issues[0]?.message, issues: validation.issues }, { status: 422 });
  }
  try {
    if (!(await customerExistsFast(id))) return NextResponse.json({ ok: false, error: 'Không tìm thấy khách hàng.' }, { status: 404 });
    const saved = await upsertCustomerFast(customer);
    void writeSecurityLog('CUSTOMER_PATCH', request, { customerId: id });
    return NextResponse.json({ ok: true, source: 'supabase', data: saved });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể cập nhật khách hàng.' }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    if (!(await customerExistsFast(id))) return NextResponse.json({ ok: false, error: 'Không tìm thấy khách hàng.' }, { status: 404 });
    if (await customerHasBookingsFast(id)) {
      return NextResponse.json({ ok: false, error: 'Không thể xóa khách hàng đang có lịch sử booking.' }, { status: 409 });
    }
    await deleteCustomerFast(id);
    void writeSecurityLog('CUSTOMER_DELETE', request, { customerId: id });
    return NextResponse.json({ ok: true, source: 'supabase', data: { id } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể xóa khách hàng.' }, { status: 503 });
  }
}
