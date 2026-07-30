'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Database,
  Film,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  Settings,
  Table2,
  UserRound,
  X,
} from 'lucide-react';
import { BookingStatus } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { getNotificationHref, isContactNotification } from '../notification-utils';
import { formatDateTime } from '../utils';
import { getAdminPageTitle } from '../layout/navigation';

const mainNavigation = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Đặt chỗ', icon: CalendarDays },
  { href: '/admin/bookings/calendar', label: 'Lịch', icon: CalendarDays },
  { href: '/admin/requests', label: 'Yêu cầu', icon: Mail },
] as const;

const moreNavigation = [
  { href: '/admin/tables', label: 'Bàn', icon: Table2 },
  { href: '/admin/venues', label: 'Địa điểm', icon: MapPin },
  { href: '/admin/customers', label: 'Khách hàng', icon: UserRound },
  { href: '/admin/reels', label: 'Reels', icon: Film },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/homepage', label: 'Homepage', icon: Home },
  { href: '/admin/contacts', label: 'Kênh liên hệ', icon: Phone },
  { href: '/admin/data-files', label: 'Tệp dữ liệu', icon: Database },
  { href: '/admin/notifications', label: 'Thông báo', icon: Bell },
  { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
] as const;

export function MobileAdminChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    notifications,
    reservations,
    unreadCount,
    markNotificationsRead,
    searchQuery,
    setSearchQuery,
    logout,
  } = useAdminData();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [searchOpen]);

  const openNotification = async (id: string, href: string) => {
    await markNotificationsRead([id]);
    setNotificationsOpen(false);
    router.push(href);
  };

  const requestCount = reservations.filter(
    (item) => item.status === BookingStatus.NEW || item.status === BookingStatus.CONTACTED,
  ).length + notifications.filter((notice) => isContactNotification(notice) && !notice.read).length;
  const pageTitle = getAdminPageTitle(pathname);
  const moreActive = moreNavigation.some((item) => routeIsActive(pathname, item.href));

  return (
    <>
      <header className="duyt-mobile-admin-topbar fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 px-3 pb-2.5 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[560px] items-center gap-2.5">
          <Link href="/admin" onClick={() => setSearchOpen(false)} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl" aria-label="Về tổng quan">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-[0_3px_14px_rgba(15,23,42,.16)] ring-2 ring-blue-100">
              <Image src="/duyt-avatar.jpg" alt="Avatar DuyT" fill sizes="40px" className="object-cover" priority />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-600">DuyT Admin</span>
              <span className="block truncate text-[15px] font-black tracking-[-0.025em] text-slate-950">{pageTitle}</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition active:scale-95 ${searchOpen ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
            aria-label="Tìm kiếm trong trang quản trị"
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-100 bg-slate-50 text-slate-600 transition active:scale-95"
            aria-label={`Mở thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
          >
            <Bell size={19} />
            {unreadCount ? (
              <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[8px] font-black leading-3 text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>
        </div>

        {searchOpen ? (
          <div className="mx-auto mt-2 max-w-[560px]">
            <label className="relative block">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm booking, khách hàng, địa điểm..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[16px] font-semibold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>
        ) : null}
      </header>

      <nav className="duyt-mobile-admin-bottomnav fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/96 px-1.5 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur-xl md:hidden" aria-label="Điều hướng quản trị">
        <div className="mx-auto flex max-w-[560px] items-start justify-between">
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const active = routeIsActive(pathname, item.href);
            const badge = item.href === '/admin/requests' ? requestCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSearchOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[9px] font-black uppercase tracking-[-0.01em] transition active:scale-95 ${active ? 'text-blue-600' : 'text-slate-400'}`}
              >
                <span className={`grid h-8 min-w-10 place-items-center rounded-xl transition ${active ? 'bg-blue-50 shadow-inner' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </span>
                <span>{item.label}</span>
                {badge > 0 ? (
                  <span className="absolute right-[18%] top-0 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[8px] leading-3 text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[9px] font-black uppercase tracking-[-0.01em] transition active:scale-95 ${moreActive ? 'text-blue-600' : 'text-slate-400'}`}
            aria-label="Mở menu quản trị khác"
          >
            <span className={`grid h-8 min-w-10 place-items-center rounded-xl ${moreActive ? 'bg-blue-50 shadow-inner' : ''}`}>
              <MoreHorizontal size={22} />
            </span>
            <span>Khác</span>
          </button>
        </div>
      </nav>

      {notificationsOpen ? (
        <MobileAdminSheet title="Thông báo" onClose={() => setNotificationsOpen(false)}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-3">
            <p className="text-xs font-semibold text-slate-500">{unreadCount} thông báo chưa đọc</p>
            {unreadCount ? (
              <button type="button" onClick={() => markNotificationsRead()} className="min-h-10 px-2 text-xs font-extrabold text-blue-600">
                Đánh dấu đã đọc
              </button>
            ) : null}
          </div>
          <div className="max-h-[68dvh] overflow-y-auto pb-[max(12px,env(safe-area-inset-bottom))]">
            {notifications.slice(0, 40).map((notice) => {
              const contact = isContactNotification(notice);
              return (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => openNotification(notice.id, getNotificationHref(notice))}
                  className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition active:bg-slate-100 ${notice.read ? 'bg-white' : 'bg-blue-50/55'}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${contact ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                    {contact ? <Mail size={18} /> : <CheckCircle2 size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-900">{notice.title}</span>
                    <span className="mt-1 block line-clamp-2 whitespace-pre-line text-xs font-medium leading-5 text-slate-500">{notice.message}</span>
                    <span className="mt-1.5 block text-[10px] font-bold text-slate-400">{formatDateTime(notice.createdAt)}</span>
                  </span>
                </button>
              );
            })}
            {!notifications.length ? <p className="px-5 py-12 text-center text-sm font-semibold text-slate-500">Chưa có thông báo.</p> : null}
          </div>
        </MobileAdminSheet>
      ) : null}

      {moreOpen ? (
        <MobileAdminSheet title="Quản lý hệ thống" onClose={() => setMoreOpen(false)}>
          <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-slate-950 p-3.5 text-white shadow-lg">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-slate-200">
              <Image src="/duyt-avatar.jpg" alt="Avatar DuyT" fill sizes="48px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-black">DuyT</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-white/60">Quản trị viên hệ thống</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 px-4 pb-5">
            {moreNavigation.map((item) => {
              const Icon = item.icon;
              const active = routeIsActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 text-center text-[11px] font-extrabold transition active:scale-[0.98] ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                >
                  <Icon size={21} className={active ? 'text-blue-700' : 'text-blue-600'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={logout}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-extrabold text-red-600 transition active:scale-[0.99]"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </MobileAdminSheet>
      ) : null}
    </>
  );
}

function MobileAdminSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose} aria-label={`Đóng ${title}`} />
      <section className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
        <div className="mx-auto mt-2 h-1.5 w-11 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label={`Đóng ${title}`}>
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function routeIsActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/admin/bookings') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
