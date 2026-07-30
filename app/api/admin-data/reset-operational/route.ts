import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { getSupabaseAdminClient, writeSecurityLog } from '@/lib/concierge-repository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function deleteAllRows(table: string, idColumn = 'id') {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from(table).delete().not(idColumn, 'is', null);
  if (error) throw new Error(`${table}: ${error.message}`);
}

/**
 * Clears operational/customer activity while intentionally preserving venues,
 * images, reels, table zones, floor-plan elements, site settings and push
 * subscriptions. Deletion order follows the booking foreign-key graph.
 */
export async function POST(request: Request) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    await deleteAllRows('AdminNotification');
    await deleteAllRows('BookingContact');
    await deleteAllRows('Booking');
    await deleteAllRows('Customer');

    void writeSecurityLog('ADMIN_OPERATIONAL_DATA_RESET', request, {
      cleared: ['AdminNotification', 'BookingContact', 'Booking', 'Customer'],
      preserved: ['Venue', 'VenueImage', 'VenueSpot', 'VenueTableZone', 'VenueMapElement', 'VenueMapConfig', 'VenueReel', 'SiteSetting', 'AdminPushSubscription'],
    });

    return NextResponse.json({
      ok: true,
      cleared: {
        reservations: true,
        customers: true,
        requests: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Không thể xóa dữ liệu vận hành.',
      },
      { status: 500 },
    );
  }
}
