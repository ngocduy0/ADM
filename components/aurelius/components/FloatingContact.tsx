"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PhoneCall } from "lucide-react";
import { getLocalizedContactChannels } from "../contactConfig";
import { useI18n } from "../i18n";
import type { SiteSettings } from "../siteSettings";

/**
 * Lightweight floating contact bar.
 *
 * The row is visible before and after the Concierge section. It only docks
 * while the Concierge contact panel crosses the central viewport band, then
 * returns to the bottom as soon as that panel is left behind.
 */
export default function FloatingContact({ siteSettings }: { siteSettings?: SiteSettings }) {
  const { locale } = useI18n();
  const contacts = useMemo(
    () => getLocalizedContactChannels(siteSettings, locale),
    [locale, siteSettings],
  );
  const [panelVisible, setPanelVisible] = useState(false);
  const [hasDockTarget, setHasDockTarget] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = document.getElementById("concierge-contact-dock");

    if (!target) {
      setHasDockTarget(false);
      return;
    }

    setHasDockTarget(true);
    target.dataset.contactActive = "false";
    let current = false;
    let fallbackFrame = 0;

    const applyDockState = (next: boolean) => {
      if (next === current) return;
      current = next;

      const floating = navRef.current;
      if (next && floating) {
        const floatingRect = floating.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + Math.min(82, targetRect.height * 0.2);
        const floatingX = floatingRect.left + floatingRect.width / 2;
        const floatingY = floatingRect.top + floatingRect.height / 2;
        const targetScale = Math.min(
          0.96,
          Math.max(0.68, targetRect.width / Math.max(1, floatingRect.width)),
        );

        floating.style.setProperty(
          "--duyt-contact-dock-x",
          `${Math.round(targetX - floatingX)}px`,
        );
        floating.style.setProperty(
          "--duyt-contact-dock-y",
          `${Math.round(targetY - floatingY)}px`,
        );
        floating.style.setProperty(
          "--duyt-contact-dock-scale",
          targetScale.toFixed(3),
        );
      }

      setPanelVisible(next);
      target.dataset.contactActive = next ? "true" : "false";
    };

    // Keep the dock active only while the Concierge panel overlaps the
    // central viewport band. This means the row reappears in later sections.
    const syncFromTargetPosition = () => {
      const rect = target.getBoundingClientRect();
      const bandTop = window.innerHeight * 0.16;
      const bandBottom = window.innerHeight * 0.82;
      applyDockState(rect.bottom > bandTop && rect.top < bandBottom);
    };

    const initialFrame = window.requestAnimationFrame(syncFromTargetPosition);

    if (typeof IntersectionObserver === "undefined") {
      const onScrollOrResize = () => {
        if (fallbackFrame) return;
        fallbackFrame = window.requestAnimationFrame(() => {
          fallbackFrame = 0;
          syncFromTargetPosition();
        });
      };

      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize, { passive: true });

      return () => {
        window.cancelAnimationFrame(initialFrame);
        if (fallbackFrame) window.cancelAnimationFrame(fallbackFrame);
        window.removeEventListener("scroll", onScrollOrResize);
        window.removeEventListener("resize", onScrollOrResize);
        delete target.dataset.contactActive;
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => applyDockState(entry.isIntersecting),
      {
        rootMargin: "-16% 0px -18% 0px",
        threshold: 0,
      },
    );

    observer.observe(target);

    const onResize = () => syncFromTargetPosition();
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.cancelAnimationFrame(initialFrame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      delete target.dataset.contactActive;
    };
  }, []);

  if (!contacts.length || !hasDockTarget) return null;

  return (
    <nav
      ref={navRef}
      data-duyt-contact-float
      aria-label={({ vi: "Liên hệ nhanh", en: "Quick contact", ko: "빠른 연락", zh: "快速联系", th: "ติดต่อด่วน", ja: "クイック連絡", hi: "त्वरित संपर्क" } as const)[locale]}
      aria-hidden={panelVisible}
      data-panel-visible={panelVisible ? "true" : "false"}
      className="duyt-contact-float pointer-events-none fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-1/2 z-40 h-[52px] w-max max-w-[calc(100vw-20px)] md:bottom-4 md:h-14 md:max-w-[calc(100vw-44px)]"
    >
      <div className="duyt-contact-bar pointer-events-auto inline-flex h-full w-max max-w-full items-center justify-start gap-0.5 overflow-x-auto overscroll-x-contain rounded-full border border-[#d0bcff]/20 bg-black/92 px-1.5 py-1 shadow-[0_16px_42px_rgba(0,0,0,.56),0_0_24px_rgba(160,120,255,.10)] hide-scrollbar md:bg-black/86 md:shadow-[0_18px_55px_rgba(0,0,0,.62),0_0_34px_rgba(160,120,255,.13)] md:backdrop-blur-xl"
      >
        {contacts.map((contact, index) => {
          const isPhone = contact.href.startsWith("tel:") || contact.id === "phone";
          const external = !contact.href.startsWith("mailto:") && !contact.href.startsWith("tel:");
          return (
            <a
              key={contact.id}
              href={contact.href || "#"}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              tabIndex={panelVisible ? -1 : undefined}
              className={[
                "duyt-contact-item group relative flex shrink-0 items-center gap-1.5 rounded-full px-1 py-1 transition-transform duration-200 md:min-w-[106px] md:max-w-[142px] md:px-2.5",
                isPhone ? "bg-[#a078ff]/15 ring-1 ring-[#d0bcff]/35" : "",
              ].join(" ")}
              style={{ animationDelay: `${80 + index * 45}ms` }}
              aria-label={`${contact.name}: ${contact.label}`}
            >
              <span className={[
                "relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full p-1.5",
                isPhone ? "bg-gradient-to-br from-[#d0bcff] to-[#6d3bd7] text-[#23005c]" : "bg-white/10",
              ].join(" ")}
              >
                {isPhone ? (
                  <PhoneCall className="duyt-phone-ring h-4 w-4" />
                ) : (
                  <img
                    src={contact.icon}
                    alt=""
                    width={28}
                    height={28}
                    decoding="async"
                    className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                )}
                {isPhone ? <span className="duyt-phone-pulse absolute inset-0 rounded-full border border-[#e9ddff]/75" /> : null}
              </span>
              <span className="hidden min-w-0 flex-1 pr-1 md:block">
                <span className="block truncate text-[11px] font-black uppercase tracking-[.08em] text-white">{contact.name}</span>
                <span className="mt-0.5 block truncate text-[10px] text-white/48">{contact.label}</span>
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
