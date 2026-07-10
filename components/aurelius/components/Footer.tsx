'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../i18n';
import { publicPath } from '../public/routes';

interface FooterProps {
  onNavigate?: (view: string) => void;
  logoUrl?: string;
}

export default function Footer({ onNavigate, logoUrl }: FooterProps) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
      return;
    }
    router.push(publicPath(locale, view));
  };

  return (
    <footer className="bg-dark-navy border-t border-gold/10 py-20 mt-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-6 md:px-16 max-w-[1440px] mx-auto">
        <div className="col-span-1 md:col-span-2 flex flex-col justify-between">
          <div>
            <img src={logoUrl || '/duyt-logo.png'} alt="DuyT Da Nang Concierge" className="mb-6 h-16 w-auto object-contain" />
            <p className="text-sm font-sans text-on-surface-variant max-w-sm leading-relaxed mb-8">
              {t('heroSubtitle')}
            </p>
          </div>
          <div className="text-xs sans-label text-on-surface-variant/50">
            © {new Date().getFullYear()} DUYT DANANG-CONCIERGE. {t('rightsReserved').toUpperCase()}.
          </div>
        </div>

        <div>
          <h4 className="text-xs sans-label text-gold tracking-widest uppercase mb-6 font-bold">{t('discover')}</h4>
          <ul className="space-y-4 flex flex-col">
            <button onClick={() => handleNavigate('VENUES')} className="text-xs sans-label text-on-surface-variant hover:text-gold transition-colors text-left">
              {t('venues')}
            </button>
            <button onClick={() => handleNavigate('ABOUT')} className="text-xs sans-label text-on-surface-variant hover:text-gold transition-colors text-left">
              {t('about')}
            </button>
            <button onClick={() => handleNavigate('CONTACT')} className="text-xs sans-label text-on-surface-variant hover:text-gold transition-colors text-left">
              {t('contact')}
            </button>
          </ul>
        </div>

        <div>
          <h4 className="text-xs sans-label text-gold tracking-widest uppercase mb-6 font-bold">{t('legal')}</h4>
          <ul className="space-y-4 flex flex-col text-left">
            <a href="#" className="text-xs sans-label text-on-surface-variant hover:text-gold transition-colors">{t('privacy')}</a>
            <a href="#" className="text-xs sans-label text-on-surface-variant hover:text-gold transition-colors">{t('terms')}</a>
            <a href="#" className="text-xs sans-label text-on-surface-variant hover:text-gold transition-colors">{t('membership')}</a>
          </ul>
        </div>
      </div>
    </footer>
  );
}
