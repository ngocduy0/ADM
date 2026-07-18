'use client';

import { useRouter } from 'next/navigation';
import HomepageView from '../components/HomepageView';
import PublicShell from './PublicShell';
import { publicPath } from './routes';
import { Locale } from '../i18n';
import { usePublicVenues } from './usePublicData';

export default function HomePageClient({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const router = useRouter();
  const { venues, siteSettings, isLoadingData } = usePublicVenues();

  const navigate = (view: string, targetId?: string) => {
    const url = publicPath(initialLocale, view);
    if (targetId && (view === 'HOME' || url.includes('#'))) {
      router.push(publicPath(initialLocale, 'HOME'));
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }
    router.push(url);
  };

  if (isLoadingData) {
    return <div className="min-h-screen bg-deep-black" aria-busy="true" />;
  }

  return (
    <PublicShell initialLocale={initialLocale} activeView="HOME" logoUrl={siteSettings.logoUrl} siteSettings={siteSettings}>
      <HomepageView
        featuredVenues={venues}
        siteSettings={siteSettings}
        onNavigate={navigate}
        onSelectVenue={(venueId) => router.push(publicPath(initialLocale, 'VENUE_DETAIL', venueId))}
      />
    </PublicShell>
  );
}
