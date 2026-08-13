import type { Metadata } from 'next';
import HomePageClient from '@/components/aurelius/public/HomePageClient';
import { notFound } from 'next/navigation';
import { loadPublicHomeData } from '@/lib/public-home-data';
import { buildPublicMetadata, isSeoLocale } from '@/lib/seo';

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return {};
  return buildPublicMetadata(locale, 'HOME');
}

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();

  const { venues, siteSettings } = await loadPublicHomeData();
  return (
    <HomePageClient
      initialLocale={locale}
      initialVenues={venues}
      initialSiteSettings={siteSettings}
    />
  );
}
