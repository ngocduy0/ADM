import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

test('web push service worker handles push and deep links without caching admin data', () => {
  const source = read('public/sw.js');
  assert.match(source, /addEventListener\('push'/);
  assert.match(source, /showNotification/);
  assert.match(source, /raw\.notification/);
  assert.match(source, /notification\.navigate/);
  assert.match(source, /silent:\s*false/);
  assert.match(source, /addEventListener\('notificationclick'/);
  assert.match(source, /openWindow/);
  assert.match(source, /pathname\.startsWith\('\/api\/'\)/);
  assert.match(source, /pathname\.startsWith\('\/admin'\)/);
});

test('admin push APIs require admin authorization and use subscription table', () => {
  const subscribe = read('app/api/admin-push/subscribe/route.ts');
  const unsubscribe = read('app/api/admin-push/unsubscribe/route.ts');
  const testRoute = read('app/api/admin-push/test/route.ts');
  const server = read('lib/admin-push-server.ts');

  assert.match(subscribe, /requireAdminApi\(request\)/);
  assert.match(unsubscribe, /requireAdminApi\(request\)/);
  assert.match(testRoute, /requireAdminApi\(request\)/);
  assert.match(server, /AdminPushSubscription/);
  assert.match(server, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(server, /webpush\.sendNotification/);
  assert.match(server, /web_push:\s*8030/);
  assert.match(server, /app_badge:\s*'1'/);
});

test('booking and contact creation send server-side push notifications', () => {
  const reservations = read('app/api/reservations/route.ts');
  const contacts = read('app/api/contact-requests/route.ts');
  assert.match(reservations, /sendAdminPush\(buildBookingPushPayload\(saved\)\)/);
  assert.match(contacts, /sendAdminPush\(buildContactPushPayload/);
});

test('settings exposes enable, test and disable notification controls', () => {
  const settings = read('components/admin/push/PushNotificationSettings.tsx');
  const shell = read('components/admin/layout/AdminShell.tsx');
  assert.match(settings, /Bật thông báo/);
  assert.match(settings, /Gửi thông báo thử/);
  assert.match(settings, /Tắt trên thiết bị này/);
  assert.match(shell, /PushNotificationPrompt/);
});
