import React from 'react';
import { cn } from '../utils';

export const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F3A8A] focus:ring-4 focus:ring-[#1F3A8A]/10 disabled:bg-slate-100';
export const textareaClass = 'min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F3A8A] focus:ring-4 focus:ring-[#1F3A8A]/10';

export function FormField({ label, hint, required, className, children }: { label: string; hint?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-700">{label}{required ? <span className="text-red-500">*</span> : null}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] font-medium text-slate-400">{hint}</span> : null}
    </label>
  );
}
