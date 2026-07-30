'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

function pageWindow(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1]);
  return Array.from(values).filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
}

export function Pagination({ page, totalItems, pageSize, onPageChange, itemLabel = 'mục', className = '' }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(page, 1), totalPages);
  if (totalItems <= pageSize) return null;

  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, totalItems);
  const pages = pageWindow(current, totalPages);

  return (
    <div className={`mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-xs font-semibold text-slate-500">Hiển thị {start}–{end} / {totalItems} {itemLabel}</p>
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Trang trước"
        >
          <ChevronLeft size={17} />
        </button>
        {pages.map((value, index) => {
          const previous = pages[index - 1];
          return (
            <span key={value} className="contents">
              {previous && value - previous > 1 ? <span className="px-1 text-slate-400">…</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(value)}
                aria-current={current === value ? 'page' : undefined}
                className={`h-10 min-w-10 rounded-xl px-3 text-sm font-black transition ${current === value ? 'bg-[#1F3A8A] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {value}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Trang sau"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
