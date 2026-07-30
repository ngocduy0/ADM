'use client';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

export function ToastHost({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  if (!toast) return null;
  const config = {
    success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    error: { icon: AlertCircle, className: 'border-red-200 bg-red-50 text-red-800' },
    info: { icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-800' },
  }[toast.kind];
  const Icon = config.icon;
  return (
    <div className={`fixed bottom-5 right-5 z-[150] flex max-w-[calc(100vw-40px)] items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl ${config.className}`}>
      <Icon size={20} className="shrink-0" />
      <p className="text-sm font-bold">{toast.message}</p>
      <button onClick={onClose} className="ml-2 rounded-lg p-1 opacity-60 hover:bg-black/5 hover:opacity-100"><X size={16} /></button>
    </div>
  );
}
