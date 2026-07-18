import React from 'react';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Icon size={26} /></div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm font-medium text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
