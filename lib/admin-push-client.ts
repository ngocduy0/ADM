import type { AdminPushStatusResponse, AdminPushSubscriptionInput } from '@/lib/admin-push-types';

export type BrowserPushState = {
  supported: boolean;
  secure: boolean;
  standalone: boolean;
  isIOS: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  endpoint: string;
  configured: boolean;
  enabledCount: number;
  serverError: string;
};

function getPublicVapidKey() {
  return String(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

function isStandaloneMode() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function browserSupportsPush() {
  return typeof window !== 'undefined'
    && window.isSecureContext
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

async function getRegistration(create = false) {
  let registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration && create) {
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }
  return registration || null;
}

function subscriptionInput(subscription: PushSubscription): AdminPushSubscriptionInput {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Trình duyệt không trả về đầy đủ khóa đăng ký Web Push.');
  }

  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    deviceName: getDeviceName(),
  };
}

function getDeviceName() {
  const userAgent = navigator.userAgent;
  if (/iPhone/i.test(userAgent)) return isStandaloneMode() ? 'iPhone PWA' : 'iPhone Safari';
  if (/iPad/i.test(userAgent)) return isStandaloneMode() ? 'iPad PWA' : 'iPad Safari';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Macintosh/i.test(userAgent)) return 'Mac';
  if (/Windows/i.test(userAgent)) return 'Windows';
  return 'Trình duyệt quản trị';
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) throw new Error(json?.error || 'Yêu cầu Web Push thất bại.');
  return json as T;
}

export async function readBrowserPushState(syncExisting = false): Promise<BrowserPushState> {
  const supported = browserSupportsPush();
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  let configured = Boolean(getPublicVapidKey());
  let enabledCount = 0;
  let serverError = '';

  try {
    const response = await fetch('/api/admin-push/status', { cache: 'no-store', credentials: 'same-origin' });
    const json = await response.json() as AdminPushStatusResponse;
    if (typeof json.configured === 'boolean') configured = json.configured;
    if (typeof json.enabledCount === 'number') enabledCount = json.enabledCount;
    if (!response.ok || !json.ok) serverError = json.error || 'Không đọc được trạng thái Web Push từ server.';
  } catch {
    serverError = 'Không kết nối được API trạng thái Web Push.';
  }

  if (!supported) {
    return {
      supported: false,
      secure: window.isSecureContext,
      standalone: isStandaloneMode(),
      isIOS,
      permission: 'unsupported',
      subscribed: false,
      endpoint: '',
      configured,
      enabledCount,
      serverError,
    };
  }

  const registration = await getRegistration(false);
  const subscription = await registration?.pushManager.getSubscription() || null;

  if (syncExisting && subscription && Notification.permission === 'granted') {
    await postJson('/api/admin-push/subscribe', subscriptionInput(subscription)).catch(() => undefined);
  }

  return {
    supported: true,
    secure: window.isSecureContext,
    standalone: isStandaloneMode(),
    isIOS,
    permission: Notification.permission,
    subscribed: Boolean(subscription),
    endpoint: subscription?.endpoint || '',
    configured,
    enabledCount,
    serverError,
  };
}

export async function enableAdminPush() {
  if (!browserSupportsPush()) {
    throw new Error('Thiết bị hoặc trình duyệt này chưa hỗ trợ Web Push an toàn.');
  }
  const publicKey = getPublicVapidKey();
  if (!publicKey) throw new Error('Thiếu NEXT_PUBLIC_VAPID_PUBLIC_KEY trong deployment.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied'
      ? 'Bạn đã từ chối thông báo. Hãy bật lại trong Cài đặt iPhone.'
      : 'Bạn chưa cấp quyền thông báo.');
  }

  const registration = await getRegistration(true);
  if (!registration) throw new Error('Không thể đăng ký service worker.');
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await postJson('/api/admin-push/subscribe', subscriptionInput(subscription));
  return subscription;
}

export async function disableAdminPush() {
  const registration = await getRegistration(false);
  const subscription = await registration?.pushManager.getSubscription() || null;
  if (!subscription) return;

  await postJson('/api/admin-push/unsubscribe', { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}

export async function sendAdminPushTest() {
  const registration = await getRegistration(false);
  const subscription = await registration?.pushManager.getSubscription() || null;
  if (!subscription) throw new Error('Thiết bị này chưa bật thông báo.');
  return postJson<{ ok: true; delivered: number }>('/api/admin-push/test', {
    endpoint: subscription.endpoint,
  });
}
