"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { pageCopy } from "../components/HomepageView";
import { Locale, useI18n } from "../i18n";
import PublicShell from "./PublicShell";
import { PublicView, publicPath } from "./routes";
import { usePublicSettings } from "./usePublicData";

const iconSet = [ShieldCheck, Sparkles, CheckCircle2, MessageCircle];

type GuideView = Extract<PublicView, "HOW_IT_WORKS" | "FAQ">;

function GuidePageBody({
  initialLocale,
  view,
}: {
  initialLocale: Locale;
  view: GuideView;
}) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const c = pageCopy[locale] || pageCopy.vi;
  const isFaq = view === "FAQ";

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-16 md:px-16">
      <section className="mb-12 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl leading-tight text-on-surface md:text-6xl">
          {isFaq ? c.faqTitle : t("stepsTitle")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm font-light leading-relaxed text-on-surface-variant">
          {isFaq ? c.faqIntro : c.whyText}
        </p>
      </section>

      {isFaq ? (
        <section className="grid gap-4">
          {c.faqs.map(([question, answer], index) => (
            <article
              key={`${question}-${index}`}
              className="rounded-[28px] border border-gold/10 bg-dark-navy/45 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
            >
              <div className="mb-3 flex items-start gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/20 bg-gold/10 text-xs font-black text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="pt-1 text-xl font-semibold leading-snug text-on-surface">
                  {question}
                </h2>
              </div>
              <p className="pl-0 text-sm font-light leading-7 text-on-surface-variant md:pl-[52px]">
                {answer}
              </p>
            </article>
          ))}
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {c.blocks.map(([title, text], index) => {
            const Icon = iconSet[index % iconSet.length];
            return (
              <article
                key={`${title}-${index}`}
                className="rounded-[30px] border border-gold/10 bg-dark-navy/45 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.24)] transition hover:border-gold/30"
              >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-gold/20 bg-gold/10 text-gold">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs font-black text-gold/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-on-surface">
                  {title}
                </h2>
                <p className="text-sm font-light leading-7 text-on-surface-variant">
                  {text}
                </p>
              </article>
            );
          })}
        </section>
      )}

      <section className="mt-12 rounded-[32px] border border-gold/15 bg-gradient-to-br from-gold/15 via-dark-navy/65 to-deep-black p-7 text-center md:p-10">
        <p className="mb-5 text-sm font-light leading-relaxed text-on-surface-variant">
          {isFaq ? t("questionsMessage") : c.flexible}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(publicPath(initialLocale, "VENUES"))}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-xs font-black uppercase tracking-widest text-dark-navy transition hover:bg-gold-light"
          >
            {t("browseVenues")} <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push(publicPath(initialLocale, "CONTACT"))}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/20 px-6 py-3 text-xs font-black uppercase tracking-widest text-gold transition hover:border-gold hover:bg-gold/10"
          >
            {t("contact")}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function GuidePageClient({
  initialLocale = "vi",
  view,
}: {
  initialLocale?: Locale;
  view: GuideView;
}) {
  const { siteSettings, isLoadingData } = usePublicSettings();

  if (isLoadingData) {
    return <div className="min-h-screen bg-deep-black" aria-busy="true" />;
  }

  return (
    <PublicShell
      initialLocale={initialLocale}
      activeView={view}
      logoUrl={siteSettings.logoUrl}
    >
      <GuidePageBody initialLocale={initialLocale} view={view} />
    </PublicShell>
  );
}
