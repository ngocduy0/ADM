import type { Locale } from '../i18n';
import type { Venue } from '../types';

export type PublicView = 'HOME' | 'VENUES' | 'VENUE_DETAIL' | 'ABOUT' | 'CONTACT';

function routeSegment(locale: Locale | string, view: PublicView | string) {
  const isVi = locale === 'vi';
  if (view === 'ABOUT') return isVi ? 'gioi-thieu' : 'about';
  if (view === 'CONTACT') return isVi ? 'lien-he' : 'contact';
  return '';
}

/**
 * Creates a readable, stable and collision-safe URL segment for a venue.
 * Vietnamese Đ/đ is normalized explicitly because Unicode NFD does not split it.
 */
export function slugifyVenueName(value: string) {
  return (value || '')
    .replace(/[Đđ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function venuePublicSlug(venue: Pick<Venue, 'id' | 'name'>) {
  const nameSlug = slugifyVenueName(venue.name);
  const idSlug = slugifyVenueName(venue.id).replace(/^venue-/, '');

  if (!nameSlug) return idSlug || venue.id;
  if (!idSlug || idSlug === nameSlug || idSlug.includes(nameSlug)) return nameSlug;

  // Venue names are not guaranteed to be unique. Appending the stable id
  // segment prevents two venues with the same display name from sharing one URL.
  return `${nameSlug}-${idSlug}`;
}

export function publicPath(locale: Locale | string, view: PublicView | string, venueSlug?: string) {
  const base = `/${locale || 'vi'}`;

  if (view === 'VENUES') return `${base}/dia-diem`;
  if (view === 'VENUE_DETAIL' && venueSlug) return `${base}/dia-diem/${encodeURIComponent(venueSlug)}`;
  if (view === 'ABOUT' || view === 'CONTACT') return `${base}/${routeSegment(locale, view)}`;

  return base;
}
