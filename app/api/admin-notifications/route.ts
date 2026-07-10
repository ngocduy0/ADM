import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type AdminNotificationPayload = {
  id: string;
  reservationId: string;
  title: string;
  message: string;
  createdAt?: string;
  read?: boolean;
  tableColor?: string;
};

type AdminNotificationRow = {
  id: string;
  reservationId: string;
  title: string;
  message: string;
  tableColor: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

function getSupabaseAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const url = rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

  if (!url || !serviceRoleKey) {
    throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(url, serviceRoleKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function rowToNotification(row: Record<string, any>): AdminNotificationPayload {
  return {
    id: String(row.id || ''),
    reservationId: String(row.reservationId || row.reservation_id || ''),
    title: String(row.title || ''),
    message: String(row.message || ''),
    createdAt: String(row.createdAt || row.created_at || new Date().toISOString()),
    read: Boolean(row.isRead ?? row.is_read),
    tableColor: row.tableColor || row.table_color || undefined,
  };
}

function notificationToRow(notification: AdminNotificationPayload): AdminNotificationRow {
  return {
    id: notification.id,
    reservationId: notification.reservationId,
    title: notification.title,
    message: notification.message,
    tableColor: notification.tableColor || null,
    isRead: Boolean(notification.read),
    createdAt: notification.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const limitParam = Number(request.nextUrl.searchParams.get('limit') || 100);
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1), 200);

    const { data, error } = await supabase
      .from('AdminNotification')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      notifications: (data || []).map(rowToNotification),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Không tải được lịch sử thông báo.',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const body = await request.json().catch(() => ({}));
    const rawNotifications = Array.isArray(body.notifications)
      ? body.notifications
      : body.notification
        ? [body.notification]
        : [];

    const rows: AdminNotificationRow[] = rawNotifications
      .map((item: Partial<AdminNotificationPayload>) => ({
        id: String(item.id || ''),
        reservationId: String(item.reservationId || ''),
        title: String(item.title || ''),
        message: String(item.message || ''),
        createdAt: String(item.createdAt || new Date().toISOString()),
        read: Boolean(item.read),
        tableColor: item.tableColor || undefined,
      }))
      .filter((item: AdminNotificationPayload) => item.id && item.reservationId && item.title)
      .map(notificationToRow);

    if (!rows.length) return NextResponse.json({ ok: true, notifications: [] });

    const { error } = await supabase
      .from('AdminNotification')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

    if (error) throw error;

    const ids = rows.map((row) => row.id);
    const { data, error: selectError } = await supabase
      .from('AdminNotification')
      .select('*')
      .in('id', ids)
      .order('createdAt', { ascending: false });

    if (selectError) throw selectError;

    return NextResponse.json({
      ok: true,
      notifications: (data || []).map(rowToNotification),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Không lưu được thông báo.',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
    const read = body.read !== false;

    const patch = {
      isRead: read,
      updatedAt: new Date().toISOString(),
    };

    const query = ids.length
      ? supabase.from('AdminNotification').update(patch).in('id', ids)
      : supabase.from('AdminNotification').update(patch).not('id', 'is', null);

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Không cập nhật được thông báo.',
      },
      { status: 500 },
    );
  }
}
