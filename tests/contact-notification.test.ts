import assert from 'node:assert/strict';
import test from 'node:test';
import { getNotificationHref, isContactNotification, parseContactNotification } from '@/components/admin/notification-utils';

test('contact notification is routed to admin requests and keeps phone plus structured content', () => {
  const notice = {
    id: 'contact-123-abc',
    reservationId: 'contact-123-abc',
    title: 'Liên hệ mới · Duy',
    message: 'Email: duy@example.com\nSố điện thoại: +84901234567\nNội dung:\nCần đặt bàn ADM tối nay\nSetup sinh nhật\nMã yêu cầu: LH-ABC12345',
    createdAt: '2026-07-26T01:00:00.000Z',
    read: false,
    tableColor: '#7C3AED',
  };

  assert.equal(isContactNotification(notice), true);
  assert.equal(getNotificationHref(notice), '/admin/requests?contactId=contact-123-abc');
  assert.deepEqual(parseContactNotification(notice), {
    id: 'contact-123-abc',
    requestId: 'contact-123-abc',
    name: 'Duy',
    email: 'duy@example.com',
    phone: '+84901234567',
    message: 'Cần đặt bàn ADM tối nay\nSetup sinh nhật',
    referenceCode: 'LH-ABC12345',
    createdAt: '2026-07-26T01:00:00.000Z',
    read: false,
  });
});

test('legacy contact notifications without phone remain readable', () => {
  const notice = {
    id: 'contact-legacy-abc',
    reservationId: 'contact-legacy-abc',
    title: 'Liên hệ mới · Khách cũ',
    message: 'legacy@example.com\nCần tư vấn bàn VIP\nMã yêu cầu: LH-LEGACY01',
    createdAt: '2026-07-25T01:00:00.000Z',
    read: true,
    tableColor: '#7C3AED',
  };

  const parsed = parseContactNotification(notice);
  assert.equal(parsed.email, 'legacy@example.com');
  assert.equal(parsed.phone, '');
  assert.equal(parsed.message, 'Cần tư vấn bàn VIP');
  assert.equal(parsed.referenceCode, 'LH-LEGACY01');
});
