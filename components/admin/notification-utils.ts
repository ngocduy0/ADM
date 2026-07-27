import type { AdminNotification } from './types';

export const CONTACT_NOTIFICATION_PREFIX = 'contact-';

export function isContactNotification(notice: AdminNotification) {
  return notice.reservationId.startsWith(CONTACT_NOTIFICATION_PREFIX)
    || notice.id.startsWith(CONTACT_NOTIFICATION_PREFIX)
    || notice.title.startsWith('Liên hệ mới ·');
}

export function getNotificationHref(notice: AdminNotification) {
  return isContactNotification(notice)
    ? `/admin/requests?contactId=${encodeURIComponent(notice.reservationId || notice.id)}`
    : `/admin/bookings?bookingId=${encodeURIComponent(notice.reservationId)}`;
}

export type ParsedContactNotification = {
  id: string;
  requestId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  referenceCode: string;
  createdAt: string;
  read: boolean;
};

function valueAfterLabel(line: string, pattern: RegExp) {
  return line.replace(pattern, '').trim();
}

export function parseContactNotification(notice: AdminNotification): ParsedContactNotification {
  const lines = notice.message
    .split(/\r?\n/)
    .map((line) => line.trim());
  const nonEmptyLines = lines.filter(Boolean);

  const emailLineIndex = lines.findIndex((line) => /^Email:\s*/i.test(line));
  const phoneLineIndex = lines.findIndex((line) => /^(Số điện thoại|Phone):\s*/i.test(line));
  const contentLineIndex = lines.findIndex((line) => /^(Nội dung|Message):\s*$/i.test(line));
  const referenceLineIndex = lines.findIndex((line) => /^Mã yêu cầu:\s*/i.test(line));

  const legacyEmail = emailLineIndex < 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nonEmptyLines[0] || '')
    ? nonEmptyLines[0]
    : '';
  const email = emailLineIndex >= 0
    ? valueAfterLabel(lines[emailLineIndex], /^Email:\s*/i)
    : legacyEmail;
  const phone = phoneLineIndex >= 0
    ? valueAfterLabel(lines[phoneLineIndex], /^(Số điện thoại|Phone):\s*/i)
    : '';
  const referenceCode = referenceLineIndex >= 0
    ? valueAfterLabel(lines[referenceLineIndex], /^Mã yêu cầu:\s*/i)
    : notice.id.replace(CONTACT_NOTIFICATION_PREFIX, '').slice(-10).toUpperCase();

  let message = '';
  if (contentLineIndex >= 0) {
    const endIndex = referenceLineIndex > contentLineIndex ? referenceLineIndex : lines.length;
    message = lines.slice(contentLineIndex + 1, endIndex).filter(Boolean).join('\n');
  } else {
    message = nonEmptyLines
      .filter((line, index) => {
        if (legacyEmail && index === 0) return false;
        if (/^Email:\s*/i.test(line)) return false;
        if (/^(Số điện thoại|Phone):\s*/i.test(line)) return false;
        if (/^Mã yêu cầu:\s*/i.test(line)) return false;
        return true;
      })
      .join('\n');
  }

  return {
    id: notice.id,
    requestId: notice.reservationId || notice.id,
    name: notice.title.replace(/^Liên hệ mới\s*·\s*/i, '').trim() || 'Khách liên hệ',
    email,
    phone,
    message: message || 'Khách chưa để lại nội dung chi tiết.',
    referenceCode,
    createdAt: notice.createdAt,
    read: notice.read,
  };
}
