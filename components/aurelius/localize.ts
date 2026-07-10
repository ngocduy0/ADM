import { Locale } from './i18n';
import { Venue } from './types';

const categoryLabels: Record<Locale, Record<string, string>> = {
  en: { Nightclub: 'Nightclub', Karaoke: 'Karaoke' },
  vi: { Nightclub: 'Club đêm', Karaoke: 'Karaoke' },
  ko: { Nightclub: '나이트클럽', Karaoke: '노래방' },
  zh: { Nightclub: '夜店', Karaoke: '卡拉OK' },
  th: { Nightclub: 'ไนต์คลับ', Karaoke: 'คาราโอเกะ' },
  ja: { Nightclub: 'ナイトクラブ', Karaoke: 'カラオケ' },
  hi: { Nightclub: 'नाइटक्लब', Karaoke: 'कराओके' },
};

export function localizeCategory(category: string, locale: Locale) {
  return categoryLabels[locale]?.[category] || categoryLabels.en[category] || category;
}

export function localizeVenue(venue: Venue, locale: Locale): Venue {
  // Venue name, location and descriptions must always come from admin/database.
  // Do not translate by fixed ids or fixed names here, because admins can rename
  // seed venues and can add unlimited new venues later.
  return {
    ...venue,
    category: localizeCategory(venue.category, locale) as Venue['category'],
  };
}

export function localizeVenueList(venues: Venue[], locale: Locale) {
  return venues.map((venue) => localizeVenue(venue, locale));
}

export function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
}
