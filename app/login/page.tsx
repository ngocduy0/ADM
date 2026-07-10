'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { I18nProvider, isLocale, Locale, useI18n } from '@/components/aurelius/i18n';
import LanguageSelector from '@/components/aurelius/components/LanguageSelector';

function LoginContent() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('admin@duytconcierge.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.ok) {
      setError(json.error || 'Invalid admin email or password.');
      return;
    }
    router.replace('/admin');
  };

  return (
    <main className="duyt-admin-app flex min-h-screen items-center justify-center bg-surface px-5 text-on-surface">
      <div className="absolute right-6 top-6">
        <LanguageSelector variant="light" />
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-outline-variant/30 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-24 w-40 items-center justify-center rounded-3xl border border-outline-variant/30 bg-slate-950 px-4">
            <img src="/duyt-logo.png" alt="DuyT Da Nang Concierge" className="max-h-20 w-auto object-contain" />
          </div>
          <h1 className="font-serif text-3xl text-on-surface">{t('adminLogin')}</h1>
          <p className="mt-2 text-sm font-medium text-on-surface-variant/70">DuyT Danang-Concierge Admin Console</p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {t('email')}
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-outline-variant/40 bg-slate-50 px-4 py-3 text-sm normal-case tracking-normal text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {t('password')}
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-outline-variant/40 bg-slate-50 px-4 py-3 text-sm normal-case tracking-normal text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </div>

        {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

        <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-container">
          <LockKeyhole className="h-4 w-4" />
          {t('signIn')}
        </button>

      </form>
    </main>
  );
}

export default function LoginPage() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('aurelius-locale');
    if (isLocale(stored)) setLocaleState(stored);
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    localStorage.setItem('aurelius-locale', nextLocale);
  };

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      <LoginContent />
    </I18nProvider>
  );
}
