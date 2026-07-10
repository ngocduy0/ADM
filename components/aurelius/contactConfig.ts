export const CONTACT_INFO = {
  whatsappPhone: '0865251125',
  zaloPhone: '0865251125',
  telegramUsername: '@duytadm',
  instagramUsername: 'duytadm',
  facebookName: 'Duy Thái',
  email: 'duythai519@gmail.com',
};

export const CONTACT_CHANNELS = [
  { name: 'WhatsApp', label: '0865251125', href: 'https://wa.me/84865251125', icon: '/brand-icons/whatsapp.svg' },
  { name: 'Zalo', label: '0865251125', href: 'https://zalo.me/0865251125', icon: '/brand-icons/zalo.svg' },
  { name: 'Telegram', label: '@duytadm', href: 'https://t.me/duytadm', icon: '/brand-icons/telegram.svg' },
  { name: 'Instagram', label: 'duytadm', href: 'https://instagram.com/duytadm', icon: '/brand-icons/instagram.svg' },
  { name: 'Facebook', label: 'Duy Thái', href: 'https://www.facebook.com/duy.thai.977475', icon: '/brand-icons/facebook.svg' },
  { name: 'Email', label: 'duythai519@gmail.com', href: 'mailto:duythai519@gmail.com', icon: '/brand-icons/email.svg' },
];

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
    'Xin chào DuyT Danang-Concierge, tôi muốn xác nhận yêu cầu đặt chỗ:',
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

export function buildContactUrl(channelName: string, message: string) {
  const encoded = encodeURIComponent(message);

  // Channels with official/supportable prefill behavior.
  if (channelName === 'WhatsApp') return `https://wa.me/84865251125?text=${encoded}`;
  if (channelName === 'Email') return `mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent('DuyT Danang-Concierge Reservation Request')}&body=${encoded}`;

  // Telegram supports share text reliably. Direct DM prefill is restricted by the platform.
  if (channelName === 'Telegram') return `https://t.me/share/url?url=&text=${encoded}`;

  // Zalo / Instagram / Facebook personal DMs usually block web prefilled text.
  // The UI copies the prepared message before opening these channels so guests only need to paste/send.
  if (channelName === 'Zalo') return 'https://zalo.me/0865251125';
  if (channelName === 'Instagram') return 'https://instagram.com/duytadm';
  if (channelName === 'Facebook') return 'https://www.facebook.com/messages/t/duy.thai.977475';
  return '#';
}
