'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils';

export function Modal({ open, title, description, onClose, children, footer, size = 'lg' }: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-[calc(100vw-32px)]' };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        className={cn('flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]', widths[size])}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm font-medium text-slate-500">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Đóng"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">{children}</div>
        {footer ? <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">{footer}</footer> : null}
      </section>
    </div>
  );
}
