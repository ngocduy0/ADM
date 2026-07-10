'use client';

import React from 'react';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { LANGUAGES, Locale, useI18n } from '../i18n';

export default function LanguageSelector({ compact = false, variant = 'dark' }: { compact?: boolean; variant?: 'dark' | 'light' }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const active = LANGUAGES.find((language) => language.code === locale) || LANGUAGES[0];
  const light = variant === 'light';

  const changeLanguage = (nextLocale: Locale) => {
    setLocale(nextLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurelius-locale', nextLocale);

      // Đổi locale trên URL nhưng không reload app, nhờ vậy người dùng vẫn ở đúng trang/venue đang xem.
      const parts = (pathname || '/').split('/').filter(Boolean);
      const first = parts[0];
      const publicLocale = LANGUAGES.some((language) => language.code === first);
      if (publicLocale) {
        parts[0] = nextLocale;
        router.replace(`/${parts.join('/')}`);
      }
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          light
            ? 'border-[#E8E8ED] bg-white text-[#1D1D1F] shadow-sm hover:border-[#D6A85F]'
            : 'border-white/15 bg-[#0B0D11]/70 text-white hover:border-[#D6A85F]/60 hover:text-[#F4C377]'
        }`}
        aria-label="Change language"
      >
        <Globe2 className="h-4 w-4" />
        <span>{compact ? active.code.toUpperCase() : active.native}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute right-0 z-[80] mt-3 w-56 overflow-hidden rounded-2xl border p-2 shadow-2xl ${
          light ? 'border-[#E8E8ED] bg-white text-[#1D1D1F] shadow-black/10' : 'border-white/15 bg-[#12151B] text-white shadow-black/50'
        }`}>
          {LANGUAGES.map((language) => {
            const selected = language.code === locale;
            return (
              <button
                key={language.code}
                type="button"
                onClick={() => changeLanguage(language.code)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition ${
                  selected
                    ? light
                      ? 'bg-[#F5F5F7] text-[#7C5816]'
                      : 'bg-[#D6A85F]/18 text-[#F4C377]'
                    : light
                      ? 'text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
                      : 'text-white hover:bg-white/7'
                }`}
              >
                <span>{language.native}</span>
                {selected && <Check className="h-4 w-4 text-[#D6A85F]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
