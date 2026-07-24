import { DEFAULT_CONTACT_CHANNELS, type ContactChannel, type SiteSettings } from './siteSettings';
import type { Locale } from './i18n';

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
  return [...items]
    .filter((item) => item.isActive !== false)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

const phoneNames: Record<Locale, string> = {
  vi: 'Gọi điện',
  en: 'Call',
  ko: '전화',
  zh: '电话',
  th: 'โทร',
  ja: '電話',
  hi: 'कॉल',
};

export function getLocalizedContactChannels(
  settings: Pick<SiteSettings, 'contactChannels'> | null | undefined,
  locale: Locale | string,
): ContactChannel[] {
  const safeLocale = (locale in phoneNames ? locale : 'en') as Locale;
  return getContactChannels(settings).map((channel) => {
    const id = channel.id.toLowerCase();
    const isPhone = id === 'phone' || channel.href.startsWith('tel:');
    return isPhone ? { ...channel, name: phoneNames[safeLocale] } : channel;
  });
}

type ReservationMessageCopy = {
  intro: string;
  reference: string;
  guest: string;
  phone: string;
  venue: string;
  dateTime: string;
  guests: string;
  table: string;
  notes: string;
  outro: string;
  emailSubject: string;
};

const reservationMessageCopy: Record<Locale, ReservationMessageCopy> = {
  vi: {
    intro: 'Xin chào DuyT Booking, tôi muốn xác nhận yêu cầu đặt chỗ:',
    reference: 'Mã tham chiếu', guest: 'Tên khách', phone: 'Số điện thoại', venue: 'Địa điểm',
    dateTime: 'Ngày/Giờ', guests: 'Số khách', table: 'Vị trí mong muốn', notes: 'Ghi chú',
    outro: 'Vui lòng kiểm tra chỗ trống và phản hồi giúp tôi. Xin cảm ơn.',
    emailSubject: 'DuyT Booking - Yêu cầu đặt chỗ',
  },
  en: {
    intro: 'Hello DuyT Booking, I would like to confirm this reservation request:',
    reference: 'Reference', guest: 'Guest', phone: 'Phone', venue: 'Venue',
    dateTime: 'Date/Time', guests: 'Guests', table: 'Preferred table/room', notes: 'Notes',
    outro: 'Please check availability and reply when convenient. Thank you.',
    emailSubject: 'DuyT Booking - Reservation request',
  },
  ko: {
    intro: '안녕하세요 DuyT Booking, 다음 예약 요청을 확인하고 싶습니다:',
    reference: '참조 번호', guest: '고객명', phone: '전화번호', venue: '장소',
    dateTime: '날짜/시간', guests: '인원', table: '희망 테이블/룸', notes: '메모',
    outro: '가능 여부를 확인한 뒤 회신해 주세요. 감사합니다.',
    emailSubject: 'DuyT Booking - 예약 요청',
  },
  zh: {
    intro: '您好 DuyT Booking，我想确认以下预订请求：',
    reference: '参考编号', guest: '客人姓名', phone: '电话号码', venue: '场地',
    dateTime: '日期/时间', guests: '人数', table: '希望桌位/包厢', notes: '备注',
    outro: '请核实空位并回复我，谢谢。',
    emailSubject: 'DuyT Booking - 预订请求',
  },
  th: {
    intro: 'สวัสดี DuyT Booking ฉันต้องการยืนยันคำขอจองดังนี้:',
    reference: 'รหัสอ้างอิง', guest: 'ชื่อผู้จอง', phone: 'เบอร์โทรศัพท์', venue: 'สถานที่',
    dateTime: 'วันที่/เวลา', guests: 'จำนวนแขก', table: 'โต๊ะ/ห้องที่ต้องการ', notes: 'หมายเหตุ',
    outro: 'กรุณาตรวจสอบที่ว่างและตอบกลับ ขอบคุณ',
    emailSubject: 'DuyT Booking - คำขอจอง',
  },
  ja: {
    intro: 'DuyT Booking様、以下の予約リクエストを確認したくご連絡しました：',
    reference: '参照番号', guest: 'お客様名', phone: '電話番号', venue: '会場',
    dateTime: '日付/時間', guests: '人数', table: '希望テーブル/ルーム', notes: '備考',
    outro: '空き状況をご確認のうえ、ご返信ください。よろしくお願いいたします。',
    emailSubject: 'DuyT Booking - 予約リクエスト',
  },
  hi: {
    intro: 'नमस्ते DuyT Booking, मैं इस बुकिंग अनुरोध की पुष्टि करना चाहता/चाहती हूँ:',
    reference: 'संदर्भ', guest: 'अतिथि', phone: 'फ़ोन', venue: 'स्थान',
    dateTime: 'तारीख/समय', guests: 'मेहमान', table: 'पसंदीदा टेबल/कमरा', notes: 'नोट्स',
    outro: 'कृपया उपलब्धता जाँचकर उत्तर दें। धन्यवाद।',
    emailSubject: 'DuyT Booking - बुकिंग अनुरोध',
  },
};

function normalizedLocale(locale: string): Locale {
  return (locale in reservationMessageCopy ? locale : 'en') as Locale;
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
}, locale: string = 'vi') {
  const copy = reservationMessageCopy[normalizedLocale(locale)];
  return [
    copy.intro,
    payload.referenceCode ? `${copy.reference}: ${payload.referenceCode}` : '',
    `${copy.guest}: ${payload.fullName}`,
    payload.phoneNumber ? `${copy.phone}: ${payload.phoneNumber}` : '',
    `${copy.venue}: ${payload.venueName}`,
    `${copy.dateTime}: ${payload.date} · ${payload.arrivalTime}`,
    `${copy.guests}: ${payload.guestCount}`,
    `${copy.table}: ${payload.preferredTableName}`,
    payload.notes ? `${copy.notes}: ${payload.notes}` : '',
    copy.outro,
  ].filter(Boolean).join('\n');
}

export function buildContactUrl(
  channelName: string,
  message: string,
  channels: ContactChannel[] = DEFAULT_CONTACT_CHANNELS,
  locale: string = 'vi',
) {
  const encoded = encodeURIComponent(message);
  const channel = channels.find((item) => item.name.toLowerCase() === channelName.toLowerCase());
  const configuredHref = channel?.href || '';
  const channelId = channel?.id.toLowerCase() || channelName.toLowerCase();

  if (channelId === 'whatsapp' || channelName === 'WhatsApp') {
    if (configuredHref.includes('wa.me')) return `${configuredHref.split('?')[0]}?text=${encoded}`;
    return configuredHref || `https://wa.me/84865251125?text=${encoded}`;
  }
  if (channelId === 'email' || channelName === 'Email') {
    const email = configuredHref.startsWith('mailto:') ? configuredHref.slice(7).split('?')[0] : CONTACT_INFO.email;
    const subject = reservationMessageCopy[normalizedLocale(locale)].emailSubject;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encoded}`;
  }
  if ((channelId === 'telegram' || channelName === 'Telegram') && configuredHref.includes('/share/')) {
    return `${configuredHref}${configuredHref.includes('?') ? '&' : '?'}text=${encoded}`;
  }
  return configuredHref || '#';
}
