'use client';

import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import { I18nProvider, Locale } from '../i18n';
import { PublicView } from './routes';

export default function PublicShell({
  initialLocale = 'vi',
  activeView,
  logoUrl,
  children,
}: {
  initialLocale?: Locale;
  activeView: PublicView;
  logoUrl?: string;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurelius-locale', initialLocale);
    }
  }, [initialLocale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurelius-locale', nextLocale);
    }
  };

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      <div
        id="app-viewport-root"
        className="relative flex min-h-screen flex-col justify-between bg-deep-black text-on-surface"
      >
        <Header currentView={activeView} logoUrl={logoUrl} />
        <main className={["flex-grow", activeView === 'HOME' ? 'pt-0' : 'pt-[84px]'].join(' ')}>
          {children}
        </main>
        <FloatingContact />
        <Footer logoUrl={logoUrl} />
      </div>
    </I18nProvider>
  );
}
