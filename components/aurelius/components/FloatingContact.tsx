"use client";

import React from "react";
import { PhoneCall } from "lucide-react";
import { getContactChannels } from "../contactConfig";
import type { SiteSettings } from "../siteSettings";

export default function FloatingContact({ siteSettings }: { siteSettings?: SiteSettings }) {
  const contacts = getContactChannels(siteSettings);
  if (!contacts.length) return null;

  return (
    <nav aria-label="Liên hệ nhanh" className="pointer-events-none fixed inset-x-0 bottom-3 z-[90] px-3 sm:bottom-5 sm:px-6">
      <div className="mx-auto flex max-w-[1100px] justify-center">
        <div className="duyt-contact-bar pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-white/15 bg-[#11141a]/92 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl hide-scrollbar">
          {contacts.map((contact, index) => {
            const isPhone = contact.href.startsWith('tel:') || contact.id === 'phone';
            const external = !contact.href.startsWith('mailto:') && !contact.href.startsWith('tel:');
            return (
              <a
                key={contact.id}
                href={contact.href || '#'}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className={`duyt-contact-item group relative flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 ${isPhone ? 'bg-blue-600/15 ring-1 ring-blue-400/30' : ''}`}
                style={{ animationDelay: `${120 + index * 70}ms` }}
                aria-label={`${contact.name}: ${contact.label}`}
              >
                <span className={`relative grid h-9 w-9 place-items-center overflow-hidden rounded-full p-1.5 ${isPhone ? 'bg-blue-600 text-white' : 'bg-white/10'}`}>
                  {isPhone ? <PhoneCall className="h-5 w-5 duyt-phone-ring" /> : <img src={contact.icon} alt="" className="h-full w-full object-contain transition duration-300 group-hover:scale-110" />}
                  {isPhone ? <span className="absolute inset-0 rounded-full border border-blue-300/70 duyt-phone-pulse" /> : null}
                </span>
                <span className="hidden pr-1 sm:block">
                  <span className="block text-[10px] font-black text-white">{contact.name}</span>
                  <span className="block max-w-28 truncate text-[9px] text-white/50">{contact.label}</span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
