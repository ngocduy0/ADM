import type { MetadataRoute } from 'next';
import { loadPublicHomeData } from '@/lib/public-home-data';
import { venuePublicSlug } from '@/components/aurelius/public/routes';
import { SITE_URL } from '@/lib/seo';

const LOCALES = ['vi', 'en', 'ko', 'zh', 'th', 'ja', 'hi'] as const;
type Locale = (typeof LOCALES)[number];
type SitemapEntry = MetadataRoute.Sitemap[number];
type Alternates = NonNullable<SitemapEntry['alternates']>;

export const revalidate = 3600;

function absolute(path: string) {
  return `${SITE_URL}${path}`;
}

function aboutPath(locale: Locale) {
  return locale === 'vi' ? `/${locale}/gioi-thieu` : `/${locale}/about`;
}

function contactPath(locale: Locale) {
  return locale === 'vi' ? `/${locale}/lien-he` : `/${locale}/contact`;
}

function languageAlternates(pathForLocale: (locale: Locale) => string): Alternates {
  return {
    languages: {
      ...Object.fromEntries(
        LOCALES.map((locale) => [locale, absolute(pathForLocale(locale))]),
      ),
      'x-default': absolute(pathForLocale('vi')),
    },
  };
}

function localizedEntries(
  pathForLocale: (locale: Locale) => string,
  options: Pick<SitemapEntry, 'changeFrequency' | 'priority'>,
): MetadataRoute.Sitemap {
  const alternates = languageAlternates(pathForLocale);

  // Google recommends that every language variant lists itself and every
  // alternate variant, so each localized URL gets its own sitemap entry.
  return LOCALES.map<SitemapEntry>((locale) => ({
    url: absolute(pathForLocale(locale)),
    ...options,
    alternates,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { venues } = await loadPublicHomeData();

  const staticEntries: MetadataRoute.Sitemap = [
    ...localizedEntries((locale) => `/${locale}`, {
      changeFrequency: 'daily',
      priority: 1,
    }),
    ...localizedEntries((locale) => `/${locale}/dia-diem`, {
      changeFrequency: 'daily',
      priority: 0.9,
    }),
    ...localizedEntries(aboutPath, {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
    ...localizedEntries(contactPath, {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  ];

  const uniqueVenueSlugs = [
    ...new Set(venues.map((venue) => venuePublicSlug(venue)).filter(Boolean)),
  ];
  const venueEntries = uniqueVenueSlugs.flatMap((venueSlug) => {
    const safeVenueSlug = encodeURIComponent(venueSlug);
    return localizedEntries(
      (locale) => `/${locale}/dia-diem/${safeVenueSlug}`,
      {
        changeFrequency: 'daily',
        priority: 0.8,
      },
    );
  });

  return [...staticEntries, ...venueEntries];
}
