import type { Metadata } from 'next';
import VenueDetailPageClient from '@/components/aurelius/public/VenueDetailPageClient';
import JsonLd from '@/components/seo/JsonLd';
import { publicPath, slugifyVenueName, venuePublicSlug } from '@/components/aurelius/public/routes';
import type { Venue } from '@/components/aurelius/types';
import { loadPublicHomeData } from '@/lib/public-home-data';
import { buildVenueMetadata, isSeoLocale, venueJsonLd } from '@/lib/seo';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 30;

function decodeVenueKey(value: string) {
  try {
    return decodeURIComponent(value).trim().toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

function findVenue(venues: Venue[], venueKey: string) {
  const key = decodeVenueKey(venueKey);
  return venues.find((venue) => {
    return (
      venue.id.toLowerCase() === key ||
      venuePublicSlug(venue).toLowerCase() === key ||
      slugifyVenueName(venue.name).toLowerCase() === key
    );
  }) || null;
}

async function resolveVenue(venueKey: string) {
  const { venues } = await loadPublicHomeData();
  return findVenue(venues, venueKey);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; venueId: string }>;
}): Promise<Metadata> {
  const { locale, venueId } = await params;
  if (!isSeoLocale(locale)) return {};

  const venue = await resolveVenue(venueId);
  if (!venue) {
    return {
      title: 'Không tìm thấy địa điểm',
      robots: { index: false, follow: false },
    };
  }

  return buildVenueMetadata(locale, venue);
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ locale: string; venueId: string }>;
}) {
  const { locale, venueId } = await params;
  if (!isSeoLocale(locale)) notFound();

  const venue = await resolveVenue(venueId);
  if (!venue) notFound();

  const canonicalSlug = venuePublicSlug(venue);
  if (decodeVenueKey(venueId) !== canonicalSlug.toLowerCase()) {
    permanentRedirect(publicPath(locale, 'VENUE_DETAIL', canonicalSlug));
  }

  return (
    <>
      <JsonLd data={venueJsonLd(locale, venue)} />
      <VenueDetailPageClient initialLocale={locale} venueId={canonicalSlug} />
    </>
  );
}
