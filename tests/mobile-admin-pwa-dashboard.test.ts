import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

test('all admin routes use a unified mobile app chrome while desktop remains available', () => {
  const shell = read('components/admin/layout/AdminShell.tsx');
  const dashboard = read('components/admin/pages/DashboardPage.tsx');
  const chrome = read('components/admin/mobile/MobileAdminChrome.tsx');

  assert.match(shell, /const isDashboardPage = pathname === '\/admin'/);
  assert.match(shell, /<div className="hidden md:block">[\s\S]*<Sidebar/);
  assert.match(shell, /!isDashboardPage \? <MobileAdminChrome \/>/);
  assert.match(shell, /duyt-admin-mobile-content/);
  assert.match(dashboard, /<MobileDashboardPage \/>/);
  assert.match(dashboard, /hidden pb-10 md:block/);

  assert.match(chrome, /\/duyt-avatar\.jpg/);
  assert.match(chrome, /href: '\/admin\/bookings'/);
  assert.match(chrome, /href: '\/admin\/bookings\/calendar'/);
  assert.match(chrome, /href: '\/admin\/requests'/);
  assert.match(chrome, /Quản lý hệ thống/);
  assert.match(chrome, /safe-area-inset-bottom/);
});

test('mobile dashboard uses the real admin provider and routes instead of mock records', () => {
  const mobile = read('components/admin/mobile/MobileDashboardPage.tsx');

  assert.match(mobile, /useAdminData\(\)/);
  assert.match(mobile, /reservations/);
  assert.match(mobile, /notifications/);
  assert.match(mobile, /reservationMinimumSpend/);
  assert.match(mobile, /BookingFormModal/);
  assert.match(mobile, /href="\/admin\/bookings"/);
  assert.match(mobile, /href="\/admin\/requests"/);
  assert.doesNotMatch(mobile, /INITIAL_RESERVATIONS|mockData|Lorem ipsum/i);
});

test('PWA manifest, iPhone metadata and private-data-safe service worker are present', () => {
  const manifest = read('app/manifest.ts');
  const layout = read('app/layout.tsx');
  const worker = read('public/sw.js');

  assert.match(manifest, /display: 'standalone'/);
  assert.match(manifest, /start_url: '\/admin'/);
  assert.match(manifest, /pwa-maskable-512\.png/);
  assert.match(layout, /viewportFit: 'cover'/);
  assert.match(layout, /appleWebApp/);
  assert.match(layout, /ServiceWorkerRegistration/);
  assert.match(worker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(worker, /url\.pathname\.startsWith\('\/admin'\)/);
  assert.doesNotMatch(worker, /cache\.put\(request[\s\S]*\/admin/);
});
