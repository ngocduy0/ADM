import React from 'react';
import { cn } from '../utils';

type Tone = 'primary' | 'warning' | 'success' | 'danger' | 'neutral';
const tones: Record<Tone, string> = {
  primary: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
};

export function Badge({ tone = 'neutral', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]', tones[tone], className)} {...props} />;
}
