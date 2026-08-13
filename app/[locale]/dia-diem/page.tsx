import type { Metadata } from 'next';
import VenuesPageClient from '@/components/aurelius/public/VenuesPageClient';
import { notFound } from 'next/navigation';
import { buildPublicMetadata, isSeoLocale } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return {};
  return buildPublicMetadata(locale, 'VENUES');
}

export default async function VenuesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();

  return <VenuesPageClient initialLocale={locale} />;
}
