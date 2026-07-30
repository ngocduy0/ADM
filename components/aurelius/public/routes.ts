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
 * Creates a readable, stable URL segment from a venue name.
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
  return slugifyVenueName(venue.name) || venue.id;
}

export function publicPath(locale: Locale | string, view: PublicView | string, venueSlug?: string) {
  const base = `/${locale || 'vi'}`;

  if (view === 'VENUES') return `${base}/dia-diem`;
  if (view === 'VENUE_DETAIL' && venueSlug) return `${base}/dia-diem/${encodeURIComponent(venueSlug)}`;
  if (view === 'ABOUT' || view === 'CONTACT') return `${base}/${routeSegment(locale, view)}`;

  return base;
}
