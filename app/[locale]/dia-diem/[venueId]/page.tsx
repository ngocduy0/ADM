import VenueDetailPageClient from '@/components/aurelius/public/VenueDetailPageClient';
import { notFound } from 'next/navigation';

const LOCALES = ['en', 'ko', 'zh', 'vi', 'th', 'ja', 'hi'] as const;
function isLocale(value: string): value is (typeof LOCALES)[number] {
  return LOCALES.includes(value as (typeof LOCALES)[number]);
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ locale: string; venueId: string }>;
}) {
  const { locale, venueId } = await params;
  if (!isLocale(locale)) notFound();

  return <VenueDetailPageClient initialLocale={locale} venueId={venueId} />;
}
