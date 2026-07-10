"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { useI18n } from "../i18n";
import { publicPath } from "../public/routes";

interface HeaderProps {
  currentView: string;
  onNavigate?: (view: string, targetId?: string) => void;
  logoUrl?: string;
}

export default function Header({
  currentView,
  onNavigate,
  logoUrl,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, locale } = useI18n();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: t("home"), view: "HOME" },
    { label: t("venues"), view: "VENUES" },
    { label: t("howItWorks"), view: "HOW_IT_WORKS" },
    { label: t("faq"), view: "FAQ" },
    { label: t("contact"), view: "CONTACT" },
  ];

  const handleNav = (view: string) => {
    if (onNavigate) {
      if (view === "HOW_IT_WORKS") {
        onNavigate("HOME", "how-it-works");
        setTimeout(() => {
          document
            .getElementById("how-it-works")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      } else if (view === "FAQ") {
        onNavigate("HOME", "faq");
        setTimeout(() => {
          document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      } else {
        onNavigate(view);
      }
    } else {
      router.push(publicPath(locale, view));
    }

    setMobileMenuOpen(false);
  };

  return (
    <header
      className={[
        "fixed left-0 top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-white/10 bg-[#05070A]/95 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          : "!border-transparent !bg-transparent !shadow-none !backdrop-blur-0",
      ].join(" ")}
      style={
        !isScrolled
          ? {
              background: "transparent",
              backgroundColor: "transparent",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
              boxShadow: "none",
            }
          : undefined
      }
    >
      <div
        className={[
          "mx-auto flex max-w-[1440px] items-center justify-between px-5 transition-all duration-300 md:px-12",
          isScrolled ? "h-[76px]" : "h-[84px]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => handleNav("HOME")}
          className="flex items-center text-left transition duration-200 hover:opacity-85"
          aria-label="Về trang chủ"
        >
          <img
            src={logoUrl || "/duyt-logo.png"}
            alt="DuyT Da Nang Concierge"
            className="h-12 w-auto object-contain md:h-[54px]"
          />
        </button>

        <nav className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => {
            const isActive =
              currentView === item.view ||
              (item.view === "HOME" && currentView === "HOME");

            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNav(item.view)}
                className={[
                  "group relative flex items-center gap-2 text-[15px] font-medium tracking-[-0.01em] transition-all duration-200",
                  isActive ? "text-white" : "text-white/82 hover:text-white",
                ].join(" ")}
              >
                <span>{item.label}</span>

                <span
                  className={[
                    "absolute -bottom-2 left-0 h-[1px] bg-white transition-all duration-300",
                    isActive
                      ? "w-full opacity-80"
                      : "w-0 opacity-0 group-hover:w-full group-hover:opacity-60",
                  ].join(" ")}
                />

                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-80" />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-full border border-white/20 bg-white/[0.03] p-2 text-white transition hover:border-white/40 hover:bg-white/[0.08] lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] min-h-screen bg-[#090B0F] px-5 py-4 text-white lg:hidden">
          <div className="mb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleNav("HOME")}
              className="text-left"
            >
              <img
                src={logoUrl || "/duyt-logo.png"}
                alt="DuyT Da Nang Concierge"
                className="h-12 w-auto object-contain"
              />
            </button>

            <div className="flex items-center gap-3">
              <LanguageSelector compact />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
                className="rounded-full border border-white/20 bg-white/[0.03] p-2 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {navItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNav(item.view)}
                className="flex w-full items-center justify-between py-5 text-left text-lg font-semibold text-white"
              >
                <span>{item.label}</span>
                <ArrowRight className="h-4 w-4 text-white/70" />
              </button>
            ))}

            <a
              href="#"
              className="flex w-full items-center justify-between py-5 text-left text-base font-medium text-white/85"
            >
              <span>{t("questionsMessage")}</span>
              <ArrowRight className="h-4 w-4 text-white/70" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
