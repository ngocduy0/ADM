import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

test('public banner and reel videos remain mountable and playable on mobile', () => {
  const homepage = read('components/aurelius/components/HomepageView.tsx');
  const venueDetail = read('components/aurelius/components/VenueDetailView.tsx');
  const worker = read('public/sw.js');

  assert.match(homepage, /const richMediaAllowed = useRichMediaAllowed\(\)/);
  assert.doesNotMatch(homepage, /disableOnMobile:\s*true/);
  assert.match(homepage, /setAllowed\(typeof document !== "undefined"/);
  assert.match(homepage, /playsInline/);
  assert.match(homepage, /Chạm để phát video/);
  assert.match(homepage, /IntersectionObserver/);
  assert.match(homepage, /controls=\{playbackBlocked\}/);
  assert.match(venueDetail, /autoPlay/);
  assert.match(venueDetail, /controls/);
  assert.match(venueDetail, /playsInline/);
  assert.match(worker, /duyt-admin-static-v5/);
  assert.doesNotMatch(worker, /\.clone\(\)/);
  assert.doesNotMatch(worker, /cache\.put\(/);
});

test('admin top title resolves the current route instead of matching the dashboard parent', () => {
  const navigation = read('components/admin/layout/navigation.ts');
  assert.match(navigation, /if \(pathname === '\/admin'\) return 'Tổng quan'/);
  assert.match(navigation, /item\.href !== '\/admin'/);
  assert.match(navigation, /pathname\.startsWith\(`\$\{item\.href\}\/`\)/);
});

test('operational reset deletes requests, bookings and customers but preserves venue configuration', () => {
  const route = read('app/api/admin-data/reset-operational/route.ts');
  const provider = read('components/admin/AdminDataProvider.tsx');
  const dataFiles = read('components/admin/pages/DataFilesPage.tsx');

  assert.match(route, /deleteAllRows\('AdminNotification'\)/);
  assert.match(route, /deleteAllRows\('BookingContact'\)/);
  assert.match(route, /deleteAllRows\('Booking'\)/);
  assert.match(route, /deleteAllRows\('Customer'\)/);
  assert.doesNotMatch(route, /deleteAllRows\('Venue/);
  assert.match(route, /preserved:[\s\S]*'Venue'[\s\S]*'VenueImage'[\s\S]*'VenueTableZone'/);
  assert.match(provider, /fetch\('\/api\/admin-data\/reset-operational'/);
  assert.match(provider, /setReservations\(\[\]\)/);
  assert.match(provider, /setCustomers\(\[\]\)/);
  assert.doesNotMatch(provider, /setVenues\(\[\]\)/);
  assert.match(dataFiles, /Địa điểm, hình ảnh, video, bàn, khu và sơ đồ được giữ nguyên/);
});

test('large admin collections use filtering and pagination', () => {
  const customers = read('components/admin/pages/CustomersPage.tsx');
  const pages = [
    'components/admin/pages/CustomersPage.tsx',
    'components/admin/pages/RequestsPage.tsx',
    'components/admin/pages/NotificationsPage.tsx',
    'components/admin/pages/ReelsPage.tsx',
    'components/admin/pages/VenuesPage.tsx',
    'components/admin/pages/TablesPage.tsx',
  ];

  assert.match(customers, /Tất cả địa điểm/);
  assert.match(customers, /type="date"/);
  assert.match(customers, /bookingByPhone/);
  for (const page of pages) {
    assert.match(read(page), /<Pagination /, `${page} must render Pagination`);
  }
});

test('mobile floor-plan editor separates catalog, map and inspector and paginates large table catalogs', () => {
  const editor = read('components/aurelius/components/TableMapManagerModal.tsx');
  assert.match(editor, /mobilePanel/);
  assert.match(editor, />Danh sách<\/button>/);
  assert.match(editor, />Sơ đồ<\/button>/);
  assert.match(editor, />Chi tiết<\/button>/);
  assert.match(editor, /catalogPageSize = 20/);
  assert.match(editor, /catalogTables = visibleTables\.slice/);
  assert.match(editor, /\{currentCatalogPage\}\/\{catalogTotalPages\}/);
  assert.match(editor, /setMobilePanel\("inspector"\)/);
});

test('favicon and install icons use the black DuyT artwork with cache-busting URLs', () => {
  const layout = read('app/layout.tsx');
  const manifest = read('app/manifest.ts');
  assert.match(layout, /\/icon\.png\?v=black-2/);
  assert.match(layout, /\/favicon\.ico\?v=black-2/);
  assert.match(layout, /\/apple-icon\.png\?v=black-2/);
  assert.match(manifest, /pwa-192\.png\?v=black-2/);
  assert.ok(fs.statSync(path.join(projectRoot, 'app/icon.png')).size > 1000);
  assert.ok(fs.statSync(path.join(projectRoot, 'app/favicon.ico')).size > 1000);
});
