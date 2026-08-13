import type { Metadata } from 'next';
import StaticPageClient from '@/components/aurelius/public/StaticPageClient';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildPublicMetadata, isSeoLocale } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isSeoLocale(locale)) return {};
  return buildPublicMetadata(locale, 'ABOUT');
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  if (locale !== 'vi') permanentRedirect(`/${locale}/about`);

  return <StaticPageClient initialLocale={locale} view="ABOUT" />;
}
