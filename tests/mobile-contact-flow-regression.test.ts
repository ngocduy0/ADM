import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

function source(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('mobile reservation modal uses a full viewport two-step layout', () => {
  const modal = source('components/aurelius/components/VenueDetailView.tsx');
  const form = source('components/aurelius/components/ReservationForm.tsx');

  assert.match(modal, /h-\[100dvh\]/);
  assert.match(form, /useState<1 \| 2>\(1\)/);
  assert.match(form, /Bàn & thời gian/);
  assert.match(form, /Thông tin của bạn/);
  assert.match(form, /grid grid-cols-2 gap-3/);
  assert.match(form, /pb-\[max\(\.8rem,env\(safe-area-inset-bottom\)\)\]/);
});

test('contact request sends and stores an international phone number', () => {
  const contactView = source('components/aurelius/components/AboutContactViews.tsx');
  const route = source('app/api/contact-requests/route.ts');
  const requestsPage = source('components/admin/pages/RequestsPage.tsx');

  assert.match(contactView, /CountryPhoneField/);
  assert.match(contactView, /JSON\.stringify\(\{ name, email, phone, message/);
  assert.match(route, /PHONE_PATTERN/);
  assert.match(route, /Số điện thoại: \$\{phone\}/);
  assert.match(requestsPage, /request\.phone/);
  assert.match(requestsPage, /Gọi khách/);
});
