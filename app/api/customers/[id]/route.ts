import { NextResponse } from 'next/server';
import { Customer } from '@/components/aurelius/types';
import { readAllData, replaceAllData, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const data = await readAllData();
    const customer = data.customers.find((item) => item.id === id);
    if (!customer) return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });

    const reservations = data.reservations.filter((booking) => {
      const samePhone = booking.phoneNumber.replace(/\s+/g, '') === customer.phoneNumber.replace(/\s+/g, '');
      return samePhone || booking.fullName.toLowerCase() === customer.fullName.toLowerCase();
    });

    return NextResponse.json({ ok: true, source: 'supabase', data: { customer, reservations } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({ ok: false, source: 'local-fallback', warning: message, error: 'Customer not found' }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const patch = await request.json() as Partial<Customer>;

  try {
    const current = await readAllData();
    let updatedCustomer: Customer | null = null;
    const customers = current.customers.map((customer) => {
      if (customer.id !== id) return customer;
      updatedCustomer = { ...customer, ...patch, id: customer.id };
      return updatedCustomer;
    });

    if (!updatedCustomer) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    await writeSecurityLog('CUSTOMER_PATCH', request, { customerId: id });
    await replaceAllData({ ...current, customers });
    return NextResponse.json({ ok: true, source: 'supabase', data: updatedCustomer });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[customer-api:patch:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: { ...patch, id } });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const current = await readAllData();
    const customers = current.customers.filter((customer) => customer.id !== id);
    if (customers.length === current.customers.length) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 });
    }

    await writeSecurityLog('CUSTOMER_DELETE', request, { customerId: id });
    await replaceAllData({ ...current, customers });
    return NextResponse.json({ ok: true, source: 'supabase', data: { id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[customer-api:delete:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: { id } });
  }
}
