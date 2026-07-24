"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PhoneCall } from "lucide-react";
import { getLocalizedContactChannels } from "../contactConfig";
import { useI18n } from "../i18n";
import type { SiteSettings } from "../siteSettings";

type DockGeometry = { left: number; top: number; width: number; height: number };

function floatingGeometry(contactCount: number): DockGeometry {
  if (typeof window === "undefined") return { left: 12, top: 700, width: 630, height: 56 };
  const mobile = window.innerWidth < 768;
  const side = mobile ? 10 : 22;
  const availableWidth = window.innerWidth - side * 2;
  // Keep the floating dock compact, but reserve enough width for every item.
  // A centered overflowing flex row can hide both ends, so desktop items use a
  // predictable width and the container is sized from that same contract.
  const contentWidth = mobile
    ? contactCount * 36 + Math.max(0, contactCount - 1) * 2 + 12
    : contactCount * 118 + Math.max(0, contactCount - 1) * 2 + 16;
  const width = Math.min(860, availableWidth, Math.max(mobile ? 180 : 360, contentWidth));
  const height = mobile ? 52 : 56;
  return {
    left: (window.innerWidth - width) / 2,
    top: window.innerHeight - height - (mobile ? 10 : 16),
    width,
    height,
  };
}

export default function FloatingContact({ siteSettings }: { siteSettings?: SiteSettings }) {
  const { locale } = useI18n();
  const contacts = useMemo(
    () => getLocalizedContactChannels(siteSettings, locale),
    [locale, siteSettings],
  );
  const [docked, setDocked] = useState(false);
  const dockedRef = useRef(false);
  const [geometry, setGeometry] = useState<DockGeometry>(() => floatingGeometry(contacts.length));

  useEffect(() => {
    let frame = 0;
    let observedTarget: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;

    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const floating = floatingGeometry(contacts.length);
        const target = document.getElementById("concierge-contact-dock");

        if (target !== observedTarget) {
          if (observedTarget) observer?.unobserve(observedTarget);
          if (target) observer?.observe(target);
          observedTarget = target;
        }

        if (!target) {
          dockedRef.current = false;
          setDocked(false);
          setGeometry(floating);
          return;
        }

        const rect = target.getBoundingClientRect();
        const header = document.querySelector<HTMLElement>("[data-duyt-public-header]");
        const headerBottom = header?.getBoundingClientRect().bottom ?? (window.innerWidth < 768 ? 68 : 84);
        const safeHeaderBottom = Math.max(0, headerBottom) + (window.innerWidth < 768 ? 10 : 14);

        // Use two top thresholds so the dock does not rapidly switch state at
        // the edge of the fixed header. Once the contact panel reaches the
        // header, the bar returns to its original floating position below.
        const enterTop = safeHeaderBottom + 24;
        const exitTop = safeHeaderBottom + 4;
        const entryBottom = window.innerHeight * 0.82;
        const enoughPanelVisible = rect.bottom > safeHeaderBottom + Math.min(150, Math.max(88, rect.height * 0.3));
        const shouldDock = dockedRef.current
          ? rect.top > exitTop && rect.top < entryBottom && enoughPanelVisible
          : rect.top > enterTop && rect.top < entryBottom && enoughPanelVisible;

        dockedRef.current = shouldDock;
        setDocked(shouldDock);
        setGeometry(
          shouldDock
            ? {
                left: rect.left + 10,
                top: Math.max(rect.top + 10, safeHeaderBottom),
                width: Math.max(0, rect.width - 20),
                height: Math.max(0, rect.height - 20),
              }
            : floating,
        );
      });
    };

    observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (observedTarget) observer?.unobserve(observedTarget);
      observer?.disconnect();
    };
  }, [contacts.length]);

  if (!contacts.length) return null;

  return (
    <nav
      aria-label={({ vi: "Liên hệ nhanh", en: "Quick contact", ko: "빠른 연락", zh: "快速联系", th: "ติดต่อด่วน", ja: "クイック連絡", hi: "त्वरित संपर्क" } as const)[locale]}
      data-docked={docked ? "true" : "false"}
      className="duyt-contact-morph pointer-events-none fixed z-40"
      style={{
        left: geometry.left,
        top: geometry.top,
        width: geometry.width,
        height: geometry.height,
      }}
    >
      <div
        className={[
          "duyt-contact-bar pointer-events-auto h-full w-full border border-[#d0bcff]/20 bg-black/88 shadow-[0_18px_55px_rgba(0,0,0,.62),0_0_34px_rgba(160,120,255,.13)] backdrop-blur-2xl",
          docked
            ? "grid grid-cols-2 gap-2 overflow-hidden rounded-[28px] p-3 sm:grid-cols-3 sm:gap-3 sm:p-4"
            : "flex items-center justify-start gap-0.5 overflow-x-auto overscroll-x-contain rounded-full px-1.5 py-1 hide-scrollbar",
        ].join(" ")}
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
              className={[
                "duyt-contact-item group relative flex shrink-0 items-center transition duration-300 hover:-translate-y-0.5 hover:bg-[#d0bcff]/10",
                docked
                  ? "min-w-0 justify-start gap-3 rounded-2xl border border-white/8 bg-white/[.035] px-3 py-2.5 sm:px-4"
                  : `gap-1.5 rounded-full px-1 py-1 md:w-[118px] md:shrink md:px-2 ${isPhone ? "bg-[#a078ff]/15 ring-1 ring-[#d0bcff]/35" : ""}`,
              ].join(" ")}
              style={{ animationDelay: `${120 + index * 70}ms` }}
              aria-label={`${contact.name}: ${contact.label}`}
            >
              <span className={[
                "relative grid shrink-0 place-items-center overflow-hidden rounded-full p-1.5",
                docked ? "h-10 w-10 sm:h-11 sm:w-11" : "h-7 w-7",
                isPhone ? "bg-gradient-to-br from-[#d0bcff] to-[#6d3bd7] text-[#23005c]" : "bg-white/10",
              ].join(" ")}>
                {isPhone ? <PhoneCall className="duyt-phone-ring h-4 w-4" /> : <img src={contact.icon} alt="" className="h-full w-full object-contain transition duration-300 group-hover:scale-110" />}
                {isPhone ? <span className="duyt-phone-pulse absolute inset-0 rounded-full border border-[#e9ddff]/75" /> : null}
              </span>
              <span className={docked ? "min-w-0" : "hidden min-w-0 flex-1 pr-1 md:block"}>
                <span className="block truncate text-[10px] font-black uppercase tracking-[.08em] text-white md:text-[11px]">{contact.name}</span>
                <span className="mt-0.5 block max-w-24 truncate text-[8px] text-white/48 md:max-w-none md:text-[10px]">{contact.label}</span>
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
