"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck2, Menu, X } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { useI18n } from "../i18n";
import { publicPath } from "../public/routes";

interface HeaderProps {
  currentView: string;
  onNavigate?: (view: string, targetId?: string) => void;
  logoUrl?: string;
}

export default function Header({ currentView, onNavigate, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, locale } = useI18n();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: t("home"), view: "HOME" },
    { label: t("venues"), view: "VENUES" },
    { label: t("about"), view: "ABOUT" },
  ];

  const handleNav = (view: string) => {
    if (onNavigate) onNavigate(view);
    else router.push(publicPath(locale, view));
    setMobileMenuOpen(false);
  };

  const bookNow = () => handleNav("CONTACT");

  return (
    <header
      data-duyt-public-header
      className={[
        "fixed left-0 top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-[#d0bcff]/14 bg-black/82 shadow-[0_16px_48px_rgba(0,0,0,0.58)] backdrop-blur-2xl"
          : "!border-transparent !bg-transparent !shadow-none !backdrop-blur-0",
      ].join(" ")}
      style={!isScrolled ? { background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" } : undefined}
    >
      <div className={["relative mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 transition-all duration-300 md:px-10 lg:grid lg:grid-cols-[minmax(190px,1fr)_auto_minmax(190px,1fr)] lg:px-12", isScrolled ? "h-[74px]" : "h-[84px]"].join(" ")}>
        <button type="button" onClick={() => handleNav("HOME")} className="flex items-center justify-self-start text-left transition hover:opacity-85" aria-label={t("home")}>
          <img src={logoUrl || "/duyt-logo.png"} alt="DuyT Da Nang Concierge" className="h-12 w-auto object-contain md:h-[54px]" />
        </button>

        <nav className="hidden items-center justify-center gap-11 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNav(item.view)}
                className={[
                  "group relative text-[12px] font-semibold uppercase tracking-[0.16em] transition duration-200",
                  isActive ? "text-[#efe8ff]" : "text-white/66 hover:text-[#d0bcff]",
                ].join(" ")}
              >
                {item.label}
                <span className={["absolute -bottom-2 left-0 h-px bg-[#d0bcff] transition-all duration-300", isActive ? "w-full opacity-80" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-60"].join(" ")} />
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 sm:gap-3 lg:ml-0 lg:justify-self-end">
          <div className="hidden sm:block"><LanguageSelector /></div>
          <button
            type="button"
            onClick={bookNow}
            className="duyt-book-now group relative hidden items-center gap-2 overflow-hidden rounded-full border border-[#e9ddff]/45 bg-gradient-to-r from-[#b99aff] via-[#8b5cf6] to-[#6d3bd7] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-[0_0_26px_rgba(160,120,255,.46)] transition hover:-translate-y-0.5 hover:shadow-[0_0_38px_rgba(208,188,255,.62)] sm:inline-flex"
          >
            <span className="duyt-book-now-shine" aria-hidden="true" />
            <CalendarCheck2 className="relative h-4 w-4" />
            <span className="relative">{t("bookNow")}</span>
            <ArrowRight className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="rounded-full border border-[#d0bcff]/25 bg-black/55 p-2 text-[#e9ddff] transition hover:border-[#d0bcff]/60 hover:bg-[#d0bcff]/10 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] min-h-screen bg-[#030305] px-5 py-4 text-white lg:hidden">
          <div className="mb-8 flex items-center justify-between">
            <button type="button" onClick={() => handleNav("HOME")} className="text-left">
              <img src={logoUrl || "/duyt-logo.png"} alt="DuyT Da Nang Concierge" className="h-12 w-auto object-contain" />
            </button>
            <div className="flex items-center gap-3">
              <LanguageSelector compact />
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="rounded-full border border-[#d0bcff]/25 bg-[#0a0a0e] p-2 text-[#e9ddff]">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {navItems.map((item) => (
              <button key={item.view} type="button" onClick={() => handleNav(item.view)} className="flex w-full items-center justify-between py-5 text-left text-lg font-semibold text-white">
                <span>{item.label}</span><ArrowRight className="h-4 w-4 text-white/70" />
              </button>
            ))}
          </div>

          <button type="button" onClick={bookNow} className="duyt-book-now mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#c5a7ff] via-[#8b5cf6] to-[#6d3bd7] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_0_34px_rgba(160,120,255,.48)]">
            <CalendarCheck2 className="h-5 w-5" />{t("bookNow")}<ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}
