import { NextResponse } from 'next/server';
import { INITIAL_CUSTOMERS } from '@/components/aurelius/data';
import type { Customer } from '@/components/aurelius/types';
import { validateCustomer } from '@/lib/booking-rules';
import { requireAdminApi } from '@/lib/admin-api';
import {
  customerExistsFast,
  readAllData,
  replaceAllData,
  upsertCustomerFast,
  writeSecurityLog,
} from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

function readCustomersPayload(body: unknown): Customer[] | null {
  if (Array.isArray(body)) return body as Customer[];
  if (body && typeof body === 'object' && Array.isArray((body as { customers?: unknown }).customers)) {
    return (body as { customers: Customer[] }).customers;
  }
  return null;
}

export async function GET(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  try {
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: data.customers });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      source: 'local-fallback',
      warning: error instanceof Error ? error.message : 'Không thể tải khách hàng.',
      data: INITIAL_CUSTOMERS,
    });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const customer = await request.json() as Customer;
  const validation = validateCustomer(customer);
  if (!validation.valid) {
    return NextResponse.json({ ok: false, error: validation.issues[0]?.message, issues: validation.issues }, { status: 422 });
  }
  try {
    if (await customerExistsFast(customer.id)) {
      return NextResponse.json({ ok: false, error: 'Mã khách hàng đã tồn tại.' }, { status: 409 });
    }
    const saved = await upsertCustomerFast(customer);
    void writeSecurityLog('CUSTOMER_POST', request, { customerId: customer.id });
    return NextResponse.json({ ok: true, source: 'supabase', data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể tạo khách hàng.' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const customers = readCustomersPayload(await request.json());
  if (!customers) return NextResponse.json({ ok: false, error: 'Payload khách hàng không hợp lệ.' }, { status: 400 });
  for (const customer of customers) {
    const validation = validateCustomer(customer, customers);
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.issues[0]?.message, issues: validation.issues }, { status: 422 });
    }
  }
  try {
    const current = await readAllData();
    await replaceAllData({ ...current, customers });
    void writeSecurityLog('CUSTOMERS_PUT', request, { customers: customers.length });
    return NextResponse.json({ ok: true, source: 'supabase', data: customers });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Không thể đồng bộ khách hàng.' }, { status: 503 });
  }
}
