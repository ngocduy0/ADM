import { DEFAULT_CONTACT_CHANNELS, type ContactChannel, type SiteSettings } from './siteSettings';

export const CONTACT_INFO = {
  whatsappPhone: '0865251125',
  zaloPhone: '0865251125',
  telegramUsername: '@duytadm',
  instagramUsername: 'duytadm',
  facebookName: 'Duy Thái',
  email: 'duythai519@gmail.com',
};

export const CONTACT_CHANNELS = DEFAULT_CONTACT_CHANNELS;

export function getContactChannels(settings?: Pick<SiteSettings, 'contactChannels'> | null): ContactChannel[] {
  const items = settings?.contactChannels?.length ? settings.contactChannels : DEFAULT_CONTACT_CHANNELS;
  return [...items].filter((item) => item.isActive !== false).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function buildReservationMessage(payload: {
  fullName: string;
  phoneNumber?: string;
  venueName: string;
  date: string;
  arrivalTime: string;
  guestCount: number;
  preferredTableName: string;
  notes?: string;
  referenceCode?: string;
}) {
  return [
    'Xin chào DuyT Booking, tôi muốn xác nhận yêu cầu đặt chỗ:',
    payload.referenceCode ? `Mã tham chiếu: ${payload.referenceCode}` : '',
    `Tên khách: ${payload.fullName}`,
    payload.phoneNumber ? `Số điện thoại: ${payload.phoneNumber}` : '',
    `Địa điểm: ${payload.venueName}`,
    `Ngày/Giờ: ${payload.date} lúc ${payload.arrivalTime}`,
    `Số khách: ${payload.guestCount}`,
    `Vị trí mong muốn: ${payload.preferredTableName}`,
    payload.notes ? `Ghi chú: ${payload.notes}` : '',
    'Vui lòng kiểm tra chỗ trống và phản hồi giúp tôi. Xin cảm ơn.',
  ].filter(Boolean).join('\n');
}

export function buildContactUrl(channelName: string, message: string, channels: ContactChannel[] = DEFAULT_CONTACT_CHANNELS) {
  const encoded = encodeURIComponent(message);
  const channel = channels.find((item) => item.name.toLowerCase() === channelName.toLowerCase());
  const configuredHref = channel?.href || '';

  if (channelName === 'WhatsApp') {
    if (configuredHref.includes('wa.me')) return `${configuredHref.split('?')[0]}?text=${encoded}`;
    return configuredHref || `https://wa.me/84865251125?text=${encoded}`;
  }
  if (channelName === 'Email') {
    const email = configuredHref.startsWith('mailto:') ? configuredHref.slice(7).split('?')[0] : CONTACT_INFO.email;
    return `mailto:${email}?subject=${encodeURIComponent('DuyT Booking - Yêu cầu đặt chỗ')}&body=${encoded}`;
  }
  if (channelName === 'Telegram' && configuredHref.includes('/share/')) return `${configuredHref}${configuredHref.includes('?') ? '&' : '?'}text=${encoded}`;
  return configuredHref || '#';
}
