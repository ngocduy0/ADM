import { NextResponse } from 'next/server';
import { INITIAL_CUSTOMERS } from '@/components/aurelius/data';
import { Customer } from '@/components/aurelius/types';
import { readAllData, replaceAllData, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';

function readCustomersPayload(body: unknown): Customer[] | null {
  if (Array.isArray(body)) return body as Customer[];
  if (body && typeof body === 'object' && Array.isArray((body as { customers?: unknown }).customers)) {
    return (body as { customers: Customer[] }).customers;
  }
  return null;
}

export async function GET() {
  try {
    const data = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: data.customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[customers-api:get:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: INITIAL_CUSTOMERS });
  }
}

export async function PUT(request: Request) {
  const customers = readCustomersPayload(await request.json());
  if (!customers) {
    return NextResponse.json({ ok: false, error: 'Invalid customers payload' }, { status: 400 });
  }

  try {
    const current = await readAllData();
    await writeSecurityLog('CUSTOMERS_PUT', request, { customers: customers.length });
    await replaceAllData({ ...current, customers });
    const next = await readAllData();
    return NextResponse.json({ ok: true, source: 'supabase', data: next.customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('[customers-api:put:fallback]', message);
    return NextResponse.json({ ok: true, source: 'local-fallback', warning: message, data: customers });
  }
}
