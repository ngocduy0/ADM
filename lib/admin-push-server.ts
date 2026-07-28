import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import type { ReservationRequest } from '@/components/aurelius/types';
import type {
  AdminPushDeliveryResult,
  AdminPushPayload,
  AdminPushSubscriptionInput,
} from '@/lib/admin-push-types';

const PUSH_TABLE = 'AdminPushSubscription';
const MAX_SUBSCRIPTIONS_PER_SEND = 100;
const DEFAULT_ICON = '/icons/pwa-192.png';
const DEFAULT_BADGE = '/icons/pwa-192.png';

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  isEnabled: boolean;
};

let vapidInitialized = false;

function clean(value: string | undefined) {
  return String(value || '').trim();
}

function getPushConfiguration() {
  const publicKey = clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  const privateKey = clean(process.env.VAPID_PRIVATE_KEY);
  const subject = clean(process.env.VAPID_SUBJECT);
  const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    publicKey,
    privateKey,
    subject,
    supabaseUrl,
    serviceRoleKey,
    configured: Boolean(
      publicKey
      && privateKey
      && /^(mailto:|https:\/\/)/i.test(subject)
      && supabaseUrl
      && serviceRoleKey,
    ),
  };
}

export function isAdminPushConfigured() {
  return getPushConfiguration().configured;
}

function getPushSupabaseClient() {
  const config = getPushConfiguration();
  if (!config.supabaseUrl || !config.serviceRoleKey) {
    throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY cho Web Push.');
  }

  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function ensureVapidConfigured() {
  const config = getPushConfiguration();
  if (!config.configured) {
    throw new Error('Web Push chưa được cấu hình đầy đủ VAPID và Supabase service role.');
  }

  if (!vapidInitialized) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    vapidInitialized = true;
  }
}

function validateSubscription(input: AdminPushSubscriptionInput) {
  if (!input || typeof input !== 'object') throw new Error('Push subscription không hợp lệ.');
  const endpoint = clean(input.endpoint);
  const p256dh = clean(input.keys?.p256dh);
  const auth = clean(input.keys?.auth);

  if (!/^https:\/\//i.test(endpoint) || endpoint.length > 4096) {
    throw new Error('Push endpoint không hợp lệ.');
  }
  if (!p256dh || p256dh.length > 512 || !auth || auth.length > 512) {
    throw new Error('Khóa mã hóa của push subscription không hợp lệ.');
  }

  return {
    endpoint,
    p256dh,
    auth,
    expirationTime: Number.isFinite(input.expirationTime) ? Number(input.expirationTime) : null,
    deviceName: clean(input.deviceName).slice(0, 100) || null,
  };
}

async function resolveAdminId() {
  const adminEmail = clean(process.env.ADMIN_EMAIL).toLowerCase();
  if (!adminEmail) return null;

  try {
    const supabase = getPushSupabaseClient();
    const { data, error } = await supabase
      .from('AdminUser')
      .select('id')
      .ilike('email', adminEmail)
      .maybeSingle();
    if (error) return null;
    return data?.id ? String(data.id) : null;
  } catch {
    return null;
  }
}

export async function saveAdminPushSubscription(
  input: AdminPushSubscriptionInput,
  userAgent: string,
) {
  ensureVapidConfigured();
  const subscription = validateSubscription(input);
  const supabase = getPushSupabaseClient();
  const now = new Date().toISOString();
  const adminId = await resolveAdminId();

  const row: Record<string, unknown> = {
    endpoint: subscription.endpoint,
    p256dh: subscription.p256dh,
    auth: subscription.auth,
    expirationTime: subscription.expirationTime,
    deviceName: subscription.deviceName,
    userAgent: clean(userAgent).slice(0, 600) || null,
    isEnabled: true,
    updatedAt: now,
    lastSeenAt: now,
  };
  if (adminId) row.adminId = adminId;

  const { error } = await supabase
    .from(PUSH_TABLE)
    .upsert(row, { onConflict: 'endpoint' });

  if (error) throw new Error(`Không lưu được thiết bị nhận thông báo: ${error.message}`);
  return { endpoint: subscription.endpoint };
}

export async function removeAdminPushSubscription(endpointRaw: string) {
  const endpoint = clean(endpointRaw);
  if (!endpoint) return;
  const supabase = getPushSupabaseClient();
  const { error } = await supabase.from(PUSH_TABLE).delete().eq('endpoint', endpoint);
  if (error) throw new Error(`Không thể hủy đăng ký thông báo: ${error.message}`);
}

export async function getAdminPushEnabledCount() {
  const config = getPushConfiguration();
  if (!config.configured) return 0;
  const supabase = getPushSupabaseClient();
  const { count, error } = await supabase
    .from(PUSH_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('isEnabled', true);
  if (error) throw new Error(`Không thể đọc trạng thái Web Push: ${error.message}`);
  return count || 0;
}

function statusCodeFromError(error: unknown) {
  if (!error || typeof error !== 'object') return 0;
  const raw = (error as { statusCode?: unknown }).statusCode;
  return typeof raw === 'number' ? raw : Number(raw) || 0;
}

function sanitizePayload(payload: AdminPushPayload): AdminPushPayload {
  return {
    title: clean(payload.title).slice(0, 120) || 'DuyT Booking',
    body: clean(payload.body).slice(0, 300) || 'Bạn có thông báo mới.',
    url: payload.url.startsWith('/admin') ? payload.url : '/admin/notifications',
    tag: clean(payload.tag).replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 64) || `duyt-${Date.now()}`,
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    tableColor: clean(payload.tableColor).slice(0, 32) || undefined,
    kind: payload.kind || 'system',
  };
}

export async function sendAdminPush(
  rawPayload: AdminPushPayload,
  options: { endpoint?: string } = {},
): Promise<AdminPushDeliveryResult> {
  const config = getPushConfiguration();
  if (!config.configured) {
    return {
      configured: false,
      attempted: 0,
      delivered: 0,
      failed: 0,
      removed: 0,
      reason: 'Thiếu cấu hình VAPID hoặc SUPABASE_SERVICE_ROLE_KEY.',
    };
  }

  ensureVapidConfigured();
  const supabase = getPushSupabaseClient();
  let query = supabase
    .from(PUSH_TABLE)
    .select('id,endpoint,p256dh,auth,isEnabled')
    .eq('isEnabled', true)
    .limit(MAX_SUBSCRIPTIONS_PER_SEND);
  if (options.endpoint) query = query.eq('endpoint', options.endpoint);

  const { data, error } = await query;
  if (error) throw new Error(`Không đọc được thiết bị nhận Web Push: ${error.message}`);

  const subscriptions = (data || []) as PushSubscriptionRow[];
  if (!subscriptions.length) {
    return { configured: true, attempted: 0, delivered: 0, failed: 0, removed: 0 };
  }

  const payload = sanitizePayload(rawPayload);
  const serialized = JSON.stringify(payload);
  let delivered = 0;
  let failed = 0;
  let removed = 0;

  await Promise.all(subscriptions.map(async (row) => {
    try {
      await webpush.sendNotification({
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }, serialized, {
        TTL: 60 * 60,
        urgency: 'high',
      });
      delivered += 1;
      await supabase
        .from(PUSH_TABLE)
        .update({ lastSeenAt: new Date().toISOString() })
        .eq('id', row.id);
    } catch (sendError) {
      const statusCode = statusCodeFromError(sendError);
      if (statusCode === 404 || statusCode === 410) {
        removed += 1;
        await supabase.from(PUSH_TABLE).delete().eq('id', row.id);
      } else {
        failed += 1;
      }
    }
  }));

  return {
    configured: true,
    attempted: subscriptions.length,
    delivered,
    failed,
    removed,
  };
}

export function buildBookingPushPayload(reservation: ReservationRequest): AdminPushPayload {
  const venue = reservation.venueName || 'Chưa rõ địa điểm';
  const table = reservation.preferredTableName || 'Chưa chọn bàn';
  return {
    title: `Booking mới · ${reservation.fullName || 'Khách mới'}`,
    body: `${venue} · ${table} · ${reservation.guestCount} khách · ${reservation.arrivalTime}`,
    url: `/admin/bookings?bookingId=${encodeURIComponent(reservation.id)}`,
    tag: `booking:${reservation.id}`,
    tableColor: reservation.preferredTableColor,
    kind: 'booking',
  };
}

export function buildContactPushPayload(input: {
  id: string;
  name: string;
  phone: string;
  message: string;
}): AdminPushPayload {
  const summary = input.message.replace(/\s+/g, ' ').trim().slice(0, 120);
  return {
    title: `Liên hệ mới · ${input.name}`,
    body: `${input.phone}${summary ? ` · ${summary}` : ''}`,
    url: `/admin/requests?contactId=${encodeURIComponent(input.id)}`,
    tag: `contact:${input.id}`,
    tableColor: '#7C3AED',
    kind: 'contact',
  };
}
