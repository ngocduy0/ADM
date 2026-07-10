'use client';

import { AboutView, ContactView } from '../components/AboutContactViews';
import { Locale } from '../i18n';
import PublicShell from './PublicShell';
import { PublicView } from './routes';
import { usePublicSettings } from './usePublicData';

export default function StaticPageClient({
  initialLocale = 'vi',
  view,
}: {
  initialLocale?: Locale;
  view: Extract<PublicView, 'ABOUT' | 'CONTACT'>;
}) {
  const { siteSettings, isLoadingData } = usePublicSettings();

  if (isLoadingData) {
    return <div className="min-h-screen bg-deep-black" aria-busy="true" />;
  }

  return (
    <PublicShell initialLocale={initialLocale} activeView={view} logoUrl={siteSettings.logoUrl}>
      {view === 'ABOUT' ? <AboutView /> : <ContactView />}
    </PublicShell>
  );
}
