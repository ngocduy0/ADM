import React from 'react';
import { MapPin, Sparkles, Star } from 'lucide-react';
import { Venue } from '../types';
import { useI18n } from '../i18n';
import { formatVnd, localizeVenue } from '../localize';

interface VenueCardProps {
  key?: string;
  venue: Venue;
  onClick: (venueId: string) => void;
}

export default function VenueCard({ venue, onClick }: VenueCardProps) {
  const { locale, t } = useI18n();
  const displayVenue = localizeVenue(venue, locale);
  const minSpend = Math.min(...venue.preferredTables.map(t => t.minimumSpend));
  return (
    <article 
      onClick={() => onClick(venue.id)}
      className="group relative h-[500px] rounded-2xl overflow-hidden border border-gold/10 glass-card cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-gold/5 hover:border-gold/30"
    >
      {/* Background Image with Hover scale */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={venue.image}
          alt={displayVenue.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/30 to-deep-black/10 transition-opacity duration-500 group-hover:opacity-90" />
      </div>

      {/* Card Content Overlay */}
      <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between">
        {/* Top bar */}
        <div className="flex justify-between items-start">
          <span className="text-[10px] sans-label tracking-widest bg-deep-black/60 border border-gold/25 text-gold px-3.5 py-1.5 rounded-full backdrop-blur-md uppercase font-bold">
            {displayVenue.category}
          </span>
          <div className="flex items-center gap-1 bg-deep-black/60 border border-on-surface-variant/10 text-gold px-2.5 py-1 rounded-full backdrop-blur-md">
            <Star className="w-3 h-3 fill-gold text-gold" />
            <span className="text-xs font-semibold">{venue.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Bottom Details */}
        <div>
          <div className="flex items-center gap-1.5 text-gold-light/80 text-xs mb-2 tracking-wide font-sans">
            <MapPin className="w-3.5 h-3.5 text-gold" />
            <span>{displayVenue.location}</span>
          </div>

          <h3 className="text-2xl font-serif text-on-surface tracking-wide mb-2 group-hover:text-gold-light transition-colors duration-300">
            {displayVenue.name}
          </h3>

          <p className="text-sm text-on-surface-variant/90 leading-relaxed line-clamp-2 mb-5 font-sans font-light">
            {displayVenue.shortDescription}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gold/10">
            <span className="text-xs text-on-surface-variant font-light">
              {locale === 'vi' ? 'Chi tiêu tối thiểu từ' : 'Min. spend from'} <strong className="text-gold font-medium">{formatVnd(minSpend)}</strong>
            </span>
            <button className="text-[11px] sans-label text-gold font-bold tracking-widest group-hover:translate-x-1.5 transition-transform duration-300 flex items-center gap-1">
              {t('discover')} <span className="text-[14px]">→</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
