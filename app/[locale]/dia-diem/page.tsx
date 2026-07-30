import VenuesPageClient from '@/components/aurelius/public/VenuesPageClient';
import { notFound } from 'next/navigation';

const LOCALES = ['en', 'ko', 'zh', 'vi', 'th', 'ja', 'hi'] as const;
function isLocale(value: string): value is (typeof LOCALES)[number] {
  return LOCALES.includes(value as (typeof LOCALES)[number]);
}

export default async function VenuesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <VenuesPageClient initialLocale={locale} />;
}
