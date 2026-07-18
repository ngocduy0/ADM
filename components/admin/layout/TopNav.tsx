'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, CheckCircle2, Menu, Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAdminData } from '../AdminDataProvider';
import { formatDateTime } from '../utils';
import { getAdminPageTitle } from './navigation';

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { searchQuery, setSearchQuery, notifications, unreadCount, markNotificationsRead } = useAdminData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
        <button onClick={onMenuClick} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden" aria-label="Mở menu"><Menu size={23} /></button>
        <h2 className="hidden shrink-0 text-lg font-extrabold text-slate-950 md:block">{getAdminPageTitle(pathname)}</h2>
        <div className="hidden h-6 w-px bg-slate-200 md:block" />
        <div className="relative max-w-md flex-1">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm booking, khách hàng, địa điểm..."
            className="h-10 w-full rounded-full border-0 bg-slate-100 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-[#1F3A8A]/10"
          />
        </div>
      </div>

      <div ref={ref} className="relative ml-3 shrink-0">
        <button onClick={() => setOpen(!open)} className={`relative grid h-10 w-10 place-items-center rounded-full transition ${open ? 'bg-[#1F3A8A]/10 text-[#1F3A8A]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`} aria-label="Thông báo">
          <Bell size={20} />
          {unreadCount ? <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" /> : null}
        </button>
        {open ? (
          <div className="absolute right-0 top-full mt-3 w-[min(390px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 p-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950">Thông báo mới</h3>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">{unreadCount} thông báo chưa đọc</p>
              </div>
              {unreadCount ? <button onClick={() => markNotificationsRead()} className="text-xs font-bold text-[#1F3A8A] hover:underline">Đánh dấu đã đọc</button> : null}
            </div>
            <div className="custom-scrollbar max-h-[430px] overflow-y-auto">
              {notifications.slice(0, 8).map((notice) => (
                <button
                  key={notice.id}
                  onClick={() => { markNotificationsRead([notice.id]); setOpen(false); router.push(`/admin/bookings?bookingId=${encodeURIComponent(notice.reservationId)}`); }}
                  className={`flex w-full gap-3 border-b border-slate-50 p-4 text-left transition hover:bg-slate-50 ${notice.read ? '' : 'bg-[#1F3A8A]/[0.035]'}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1F3A8A]/10 text-[#1F3A8A]"><CheckCircle2 size={19} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-slate-900">{notice.title}</span>
                    <span className="mt-1 block line-clamp-2 text-xs font-medium leading-5 text-slate-500">{notice.message}</span>
                    <span className="mt-1.5 block text-[10px] font-bold text-slate-400">{formatDateTime(notice.createdAt)}</span>
                  </span>
                </button>
              ))}
              {!notifications.length ? <div className="p-10 text-center text-sm font-medium text-slate-500">Chưa có thông báo.</div> : null}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 p-3">
              <Link href="/admin/notifications" onClick={() => setOpen(false)} className="block rounded-lg py-2 text-center text-sm font-extrabold text-slate-800 hover:bg-slate-200">Xem tất cả thông báo</Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
