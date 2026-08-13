import type { Metadata } from 'next';
import type { Locale } from '@/components/aurelius/i18n';
import { localizeVenue } from '@/components/aurelius/localize';
import type { Venue } from '@/components/aurelius/types';
import { publicPath, venuePublicSlug } from '@/components/aurelius/public/routes';

export const SITE_URL = 'https://duyt.com.vn'
export const SITE_NAME = 'DuyT Booking';
export const DEFAULT_OG_IMAGE =
  `${SITE_URL}/og/duyt-booking.png`;

export const SEO_LOCALES = ['vi', 'en', 'ko', 'zh', 'th', 'ja', 'hi'] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];
export type PublicSeoView = 'HOME' | 'VENUES' | 'ABOUT' | 'CONTACT';

const OG_LOCALE: Record<SeoLocale, string> = {
  vi: 'vi_VN',
  en: 'en_US',
  ko: 'ko_KR',
  zh: 'zh_CN',
  th: 'th_TH',
  ja: 'ja_JP',
  hi: 'hi_IN',
};

const SEO_COPY: Record<SeoLocale, Record<PublicSeoView, { title: string; description: string }>> = {
  vi: {
    HOME: {
      title: 'Đặt bàn & địa điểm nightlife tại Đà Nẵng',
      description: 'Khám phá club, karaoke và địa điểm nightlife tại Đà Nẵng. Chọn khu vực, bàn hoặc phòng và để DuyT Concierge hỗ trợ xác nhận đặt chỗ.',
    },
    VENUES: {
      title: 'Địa điểm club & karaoke tại Đà Nẵng',
      description: 'Xem danh sách địa điểm được DuyT Booking chọn lọc tại Đà Nẵng, thông tin bàn, phòng, mức chi tiêu tối thiểu và yêu cầu đặt chỗ.',
    },
    ABOUT: {
      title: 'Giới thiệu DuyT Booking',
      description: 'Tìm hiểu DuyT Booking và dịch vụ concierge hỗ trợ lựa chọn địa điểm, kiểm tra khả năng phục vụ và xác nhận đặt chỗ tại Đà Nẵng.',
    },
    CONTACT: {
      title: 'Liên hệ DuyT Booking',
      description: 'Liên hệ DuyT Booking để được hỗ trợ chọn địa điểm, kiểm tra bàn hoặc phòng còn trống và gửi yêu cầu đặt chỗ tại Đà Nẵng.',
    },
  },
  en: {
    HOME: {
      title: 'Nightlife venue & table booking in Da Nang',
      description: 'Discover clubs, karaoke venues and nightlife in Da Nang. Choose a table, area or room and let DuyT Concierge help confirm your reservation.',
    },
    VENUES: {
      title: 'Clubs & karaoke venues in Da Nang',
      description: 'Browse curated Da Nang nightlife venues with table, room and minimum-spend information, then send a reservation request through DuyT Booking.',
    },
    ABOUT: {
      title: 'About DuyT Booking',
      description: 'Learn how DuyT Booking concierge helps guests choose venues, check availability and coordinate reservations for nightlife experiences in Da Nang.',
    },
    CONTACT: {
      title: 'Contact DuyT Booking',
      description: 'Contact DuyT Booking for help choosing a venue, checking table or room availability and arranging a reservation in Da Nang.',
    },
  },
  ko: {
    HOME: {
      title: '다낭 나이트라이프 장소 및 테이블 예약',
      description: '다낭의 클럽, 노래방과 나이트라이프 장소를 확인하고 원하는 테이블·구역·룸을 선택하세요. DuyT Concierge가 예약 확인을 도와드립니다.',
    },
    VENUES: {
      title: '다낭 클럽 & 노래방 장소',
      description: 'DuyT Booking이 엄선한 다낭 장소의 테이블, 룸, 최소 이용 금액 정보를 확인하고 예약 요청을 보내세요.',
    },
    ABOUT: {
      title: 'DuyT Booking 소개',
      description: 'DuyT Booking Concierge가 다낭에서 장소 선택, 이용 가능 여부 확인 및 예약 조율을 어떻게 지원하는지 알아보세요.',
    },
    CONTACT: {
      title: 'DuyT Booking 문의',
      description: '다낭의 장소 선택, 테이블 또는 룸 가능 여부 확인과 예약 지원이 필요하면 DuyT Booking에 문의하세요.',
    },
  },
  zh: {
    HOME: {
      title: '岘港夜生活场地与订桌服务',
      description: '探索岘港的夜店、卡拉OK和夜生活场地，选择桌位、区域或包厢，由 DuyT Concierge 协助确认预订。',
    },
    VENUES: {
      title: '岘港夜店与卡拉OK场地',
      description: '浏览 DuyT Booking 精选的岘港场地，查看桌位、包厢和最低消费信息，并在线提交预订请求。',
    },
    ABOUT: {
      title: '关于 DuyT Booking',
      description: '了解 DuyT Booking 礼宾服务如何帮助客人在岘港选择场地、确认可用情况并协调预订。',
    },
    CONTACT: {
      title: '联系 DuyT Booking',
      description: '如需岘港场地推荐、桌位或包厢可用情况确认以及预订协助，请联系 DuyT Booking。',
    },
  },
  th: {
    HOME: {
      title: 'จองโต๊ะและสถานบันเทิงในดานัง',
      description: 'ค้นพบคลับ คาราโอเกะ และสถานบันเทิงในดานัง เลือกโต๊ะ โซน หรือห้อง แล้วให้ DuyT Concierge ช่วยยืนยันการจอง',
    },
    VENUES: {
      title: 'คลับและคาราโอเกะในดานัง',
      description: 'ดูสถานที่คัดสรรโดย DuyT Booking พร้อมข้อมูลโต๊ะ ห้อง และขั้นต่ำ ก่อนส่งคำขอจองสำหรับค่ำคืนในดานัง',
    },
    ABOUT: {
      title: 'เกี่ยวกับ DuyT Booking',
      description: 'ทำความรู้จัก DuyT Booking Concierge ที่ช่วยเลือกสถานที่ ตรวจสอบความพร้อม และประสานการจองในดานัง',
    },
    CONTACT: {
      title: 'ติดต่อ DuyT Booking',
      description: 'ติดต่อ DuyT Booking เพื่อขอคำแนะนำสถานที่ ตรวจสอบโต๊ะหรือห้องว่าง และรับความช่วยเหลือด้านการจองในดานัง',
    },
  },
  ja: {
    HOME: {
      title: 'ダナンのナイトライフ会場・テーブル予約',
      description: 'ダナンのクラブ、カラオケ、ナイトライフ会場を探し、テーブル・エリア・個室を選択。DuyT Conciergeが予約確認をサポートします。',
    },
    VENUES: {
      title: 'ダナンのクラブ・カラオケ会場',
      description: 'DuyT Bookingが厳選したダナンの会場を、テーブル・個室・最低利用金額の情報とともに確認し、予約リクエストを送れます。',
    },
    ABOUT: {
      title: 'DuyT Bookingについて',
      description: 'DuyT Booking Conciergeがダナンで会場選び、空き状況確認、予約調整をどのようにサポートするかをご紹介します。',
    },
    CONTACT: {
      title: 'DuyT Bookingへお問い合わせ',
      description: 'ダナンでの会場選び、テーブルや個室の空き確認、予約サポートについてDuyT Bookingへお問い合わせください。',
    },
  },
  hi: {
    HOME: {
      title: 'दा नांग नाइटलाइफ़ वेन्यू और टेबल बुकिंग',
      description: 'दा नांग में क्लब, कराओके और नाइटलाइफ़ वेन्यू खोजें। टेबल, क्षेत्र या कमरा चुनें और DuyT Concierge से बुकिंग की पुष्टि में सहायता लें।',
    },
    VENUES: {
      title: 'दा नांग में क्लब और कराओके वेन्यू',
      description: 'DuyT Booking द्वारा चुने गए दा नांग वेन्यू देखें, टेबल, कमरे और न्यूनतम खर्च की जानकारी पाएं और बुकिंग अनुरोध भेजें।',
    },
    ABOUT: {
      title: 'DuyT Booking के बारे में',
      description: 'जानें कि DuyT Booking Concierge दा नांग में वेन्यू चुनने, उपलब्धता जांचने और बुकिंग समन्वय में कैसे मदद करता है।',
    },
    CONTACT: {
      title: 'DuyT Booking से संपर्क करें',
      description: 'दा नांग में वेन्यू चुनने, टेबल या कमरे की उपलब्धता जांचने और बुकिंग सहायता के लिए DuyT Booking से संपर्क करें।',
    },
  },
};

const BREADCRUMB_COPY: Record<SeoLocale, { home: string; venues: string }> = {
  vi: { home: 'Trang chủ', venues: 'Địa điểm' },
  en: { home: 'Home', venues: 'Venues' },
  ko: { home: '홈', venues: '장소' },
  zh: { home: '首页', venues: '地点' },
  th: { home: 'หน้าแรก', venues: 'สถานที่' },
  ja: { home: 'ホーム', venues: '場所' },
  hi: { home: 'होम', venues: 'स्थान' },
};

export function isSeoLocale(value: string): value is SeoLocale {
  return SEO_LOCALES.includes(value as SeoLocale);
}

function absolute(path: string) {
  return `${SITE_URL}${path}`;
}

function routePath(locale: SeoLocale, view: PublicSeoView, venueSlug?: string) {
  return publicPath(locale, view === 'HOME' ? 'HOME' : view, venueSlug);
}

function alternateLanguages(view: PublicSeoView) {
  return {
    ...Object.fromEntries(
      SEO_LOCALES.map((locale) => [locale, absolute(routePath(locale, view))]),
    ),
    'x-default': absolute(routePath('vi', view)),
  };
}

function venueAlternateLanguages(venueSlug: string) {
  return {
    ...Object.fromEntries(
      SEO_LOCALES.map((locale) => [locale, absolute(publicPath(locale, 'VENUE_DETAIL', venueSlug))]),
    ),
    'x-default': absolute(publicPath('vi', 'VENUE_DETAIL', venueSlug)),
  };
}

function pageTitle(title: string) {
  return `${title} | ${SITE_NAME}`;
}

function imageUrl(value?: string) {
  if (!value) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(value)) return value;
  return absolute(value.startsWith('/') ? value : `/${value}`);
}

function safeDescription(value: string, fallback: string) {
  const normalized = String(value || fallback).replace(/\s+/g, ' ').trim();
  if (normalized.length <= 180) return normalized;
  return `${normalized.slice(0, 177).trimEnd()}…`;
}

export function buildPublicMetadata(locale: SeoLocale, view: PublicSeoView): Metadata {
  const copy = SEO_COPY[locale][view];
  const canonical = absolute(routePath(locale, view));
  const languages = alternateLanguages(view);
  const alternateLocale = SEO_LOCALES.filter((item) => item !== locale).map((item) => OG_LOCALE[item]);

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title: pageTitle(copy.title),
      description: copy.description,
      locale: OG_LOCALE[locale],
      alternateLocale,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle(copy.title),
      description: copy.description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildVenueMetadata(locale: SeoLocale, venue: Venue): Metadata {
  const localized = localizeVenue(venue, locale as Locale);
  const slug = venuePublicSlug(venue);
  const canonical = absolute(publicPath(locale, 'VENUE_DETAIL', slug));
  const description = safeDescription(
    localized.shortDescription,
    `${localized.name} tại ${localized.location || 'Đà Nẵng'} — thông tin địa điểm và hỗ trợ đặt chỗ qua DuyT Booking.`,
  );
  const image = imageUrl(venue.image);
  const alternateLocale = SEO_LOCALES.filter((item) => item !== locale).map((item) => OG_LOCALE[item]);

  return {
    title: localized.name,
    description,
    alternates: {
      canonical,
      languages: venueAlternateLanguages(slug),
    },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title: pageTitle(localized.name),
      description,
      locale: OG_LOCALE[locale],
      alternateLocale,
      images: [
        {
          url: image,
          alt: localized.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle(localized.name),
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/duyt-logo.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: [...SEO_LOCALES],
      },
    ],
  };
}

export function venueJsonLd(locale: SeoLocale, venue: Venue) {
  const localized = localizeVenue(venue, locale as Locale);
  const slug = venuePublicSlug(venue);
  const canonical = absolute(publicPath(locale, 'VENUE_DETAIL', slug));
  const venueType = venue.category === 'Nightclub' ? 'NightClub' : 'EntertainmentBusiness';
  const description = safeDescription(localized.shortDescription, localized.longDescription || localized.name);
  const images = [venue.image, ...(venue.images || [])].filter(Boolean).map(imageUrl).slice(0, 8);

  return [
    {
      '@context': 'https://schema.org',
      '@type': venueType,
      '@id': `${canonical}#venue`,
      name: localized.name,
      description,
      url: canonical,
      image: images,
      address: localized.location || undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: BREADCRUMB_COPY[locale].home,
          item: absolute(publicPath(locale, 'HOME')),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: BREADCRUMB_COPY[locale].venues,
          item: absolute(publicPath(locale, 'VENUES')),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: localized.name,
          item: canonical,
        },
      ],
    },
  ];
}
