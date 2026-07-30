import HomePageClient from '@/components/aurelius/public/HomePageClient';
import { notFound } from 'next/navigation';
import { loadPublicHomeData } from '@/lib/public-home-data';

export const revalidate = 30;

const LOCALES = ['en', 'ko', 'zh', 'vi', 'th', 'ja', 'hi'] as const;
function isLocale(value: string): value is (typeof LOCALES)[number] {
  return LOCALES.includes(value as (typeof LOCALES)[number]);
}

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { venues, siteSettings } = await loadPublicHomeData();
  return (
    <HomePageClient
      initialLocale={locale}
      initialVenues={venues}
      initialSiteSettings={siteSettings}
    />
  );
}
