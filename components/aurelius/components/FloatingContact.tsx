"use client";

import React from "react";
import { Headset, X } from "lucide-react";
import { useI18n } from "../i18n";
import { CONTACT_CHANNELS } from "../contactConfig";

export default function FloatingContact() {
  const [open, setOpen] = React.useState(false);
  const { t } = useI18n();

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-4">
      {open && (
        <div className="w-[min(420px,calc(100vw-48px))] rounded-3xl border border-white/20 bg-[#12151B]/95 p-5 text-white shadow-2xl shadow-black/50 backdrop-blur-2xl">
          <div className="grid grid-cols-3 gap-3">
            {CONTACT_CHANNELS.map((contact) => (
              <a
                key={contact.name}
                href={contact.href}
                target={
                  contact.href.startsWith("mailto:") ? undefined : "_blank"
                }
                rel="noreferrer"
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-[10px] font-semibold text-white/80 transition hover:-translate-y-0.5 hover:border-[#D6A85F]/50 hover:bg-[#D6A85F]/10"
              >
                <img
                  src={contact.icon}
                  alt={contact.name}
                  className="h-10 w-10 rounded-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <span className="text-white">{contact.name}</span>
                <span className="max-w-full truncate text-[9px] text-white/50">
                  {contact.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("openContacts")}
        className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-transparent text-white shadow-2xl shadow-black/40 backdrop-blur-sm transition hover:scale-105 hover:bg-white/10"
      >
        {open ? (
          <X className="h-7 w-7" />
        ) : (
          <img
            src="/icons/headphone.svg"
            alt=""
            aria-hidden="true"
            className="h-9 w-9 object-contain brightness-0 invert"
          />
        )}
      </button>
    </div>
  );
}
