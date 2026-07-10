'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import VenueCard from '../components/VenueCard';
import { Locale, useI18n } from '../i18n';
import { Venue } from '../types';
import PublicShell from './PublicShell';
import { publicPath } from './routes';
import { usePublicVenues } from './usePublicData';

function VenuesPageBody({ initialLocale, venues }: { initialLocale: Locale; venues: Venue[] }) {
  const router = useRouter();
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const { t, locale } = useI18n();
  const categories = ['ALL', 'Nightclub', 'Karaoke'];
  const filteredVenues = venues.filter(
    (venue) => activeCategoryFilter === 'ALL' || venue.category.toLowerCase() === activeCategoryFilter.toLowerCase(),
  );

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-16">
      <div className="mx-auto mb-12 max-w-2xl space-y-4 text-center">
        <h1 className="font-serif text-4xl tracking-wide text-on-surface md:text-5xl">{t('venues')}</h1>
        <p className="text-sm font-light leading-relaxed text-on-surface-variant">{t('heroSubtitle')}</p>
      </div>

      <div className="mb-12 flex flex-col items-center justify-between gap-6 border-b border-gold/10 pb-8 md:flex-row">
        <div className="flex items-center gap-2 text-gold">
          <SlidersHorizontal className="h-4 w-4 text-gold/80" />
          <span className="sans-label text-xs font-bold uppercase tracking-widest">{t('filterCategory')}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategoryFilter(cat)}
              className={`cursor-pointer rounded-full border px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeCategoryFilter === cat
                  ? 'border-gold bg-gold text-dark-navy shadow-md'
                  : 'border-gold/15 text-on-surface-variant hover:border-gold hover:text-gold'
              }`}
            >
              {cat === 'ALL' ? (locale === 'vi' ? 'Tất cả địa điểm' : 'All destinations') : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredVenues.map((venue) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            onClick={(venueId) => router.push(publicPath(initialLocale, 'VENUE_DETAIL', venueId))}
          />
        ))}
      </div>
    </div>
  );
}

export default function VenuesPageClient({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const { venues, siteSettings, isLoadingData } = usePublicVenues();

  if (isLoadingData) {
    return <div className="min-h-screen bg-deep-black" aria-busy="true" />;
  }

  return (
    <PublicShell initialLocale={initialLocale} activeView="VENUES" logoUrl={siteSettings.logoUrl}>
      <VenuesPageBody initialLocale={initialLocale} venues={venues} />
    </PublicShell>
  );
}
