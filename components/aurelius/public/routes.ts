import { Locale } from '../i18n';

export type PublicView = 'HOME' | 'VENUES' | 'VENUE_DETAIL' | 'HOW_IT_WORKS' | 'FAQ' | 'ABOUT' | 'CONTACT';

function routeSegment(locale: Locale | string, view: string) {
  const isVi = locale === 'vi';
  if (view === 'HOW_IT_WORKS') return isVi ? 'cach-hoat-dong' : 'how-it-works';
  if (view === 'FAQ') return isVi ? 'cau-hoi' : 'questions';
  if (view === 'ABOUT') return isVi ? 'gioi-thieu' : 'about';
  if (view === 'CONTACT') return isVi ? 'lien-he' : 'contact';
  return '';
}

export function publicPath(locale: Locale | string, view: string, venueId?: string) {
  const base = `/${locale || 'vi'}`;

  if (view === 'VENUES') return `${base}/dia-diem`;
  if (view === 'VENUE_DETAIL' && venueId) return `${base}/dia-diem/${encodeURIComponent(venueId)}`;
  if (view === 'HOW_IT_WORKS' || view === 'FAQ' || view === 'ABOUT' || view === 'CONTACT') {
    return `${base}/${routeSegment(locale, view)}`;
  }

  return base;
}
