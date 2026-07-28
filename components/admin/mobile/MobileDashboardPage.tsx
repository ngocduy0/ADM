'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  Eye,
  Film,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Settings,
  Table2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { BookingStatus, type ReservationRequest } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { BookingFormModal } from '../forms/BookingFormModal';
import { getNotificationHref, isContactNotification } from '../notification-utils';
import {
  addDays,
  formatCompact,
  formatDate,
  formatDateTime,
  formatVnd,
  getMonday,
  localDateKey,
  reservationMinimumSpend,
  statusLabels,
} from '../utils';

const mobileNavItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Đặt chỗ', icon: CalendarDays },
  { href: '/admin/bookings/calendar', label: 'Lịch', icon: CalendarDays },
  { href: '/admin/requests', label: 'Yêu cầu', icon: Mail },
] as const;

const moreItems = [
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

export function MobileDashboardPage() {
  const router = useRouter();
  const {
    reservations,
    venues,
    notifications,
    unreadCount,
    markNotificationsRead,
    logout,
  } = useAdminData();
  const [selectedVenueId, setSelectedVenueId] = useState('all');
  const [venueOpen, setVenueOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const today = localDateKey();
  const filteredReservations = useMemo(
    () => selectedVenueId === 'all'
      ? reservations
      : reservations.filter((item) => item.venueId === selectedVenueId),
    [reservations, selectedVenueId],
  );
  const filteredVenues = useMemo(
    () => selectedVenueId === 'all'
      ? venues
      : venues.filter((item) => item.id === selectedVenueId),
    [selectedVenueId, venues],
  );

  const metrics = useMemo(() => {
    const active = filteredReservations.filter(
      (item) => ![BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(item.status),
    );
    const pendingBookings = filteredReservations.filter(
      (item) => item.status === BookingStatus.NEW || item.status === BookingStatus.CONTACTED,
    ).length;
    const contactRequests = notifications.filter(
      (notice) => isContactNotification(notice) && !notice.read,
    ).length;

    return {
      today: filteredReservations.filter((item) => item.date === today).length,
      pending: pendingBookings + contactRequests,
      revenue: active.reduce(
        (sum, item) => sum + reservationMinimumSpend(item, venues),
        0,
      ),
      views: filteredVenues.reduce(
        (sum, venue) => sum + Number(venue.viewCount || 0),
        0,
      ),
    };
  }, [filteredReservations, filteredVenues, notifications, today, venues]);

  const weekData = useMemo(() => {
    const monday = getMonday(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(monday, index);
      return {
        label: index === 6 ? 'CN' : `T${index + 2}`,
        date,
        count: filteredReservations.filter((item) => item.date === localDateKey(date)).length,
      };
    });
  }, [filteredReservations]);
  const maxWeek = Math.max(...weekData.map((item) => item.count), 1);
  const currentDayIndex = (new Date().getDay() + 6) % 7;

  const recentReservations = useMemo(
    () => [...filteredReservations]
      .sort((a, b) => reservationSortValue(b) - reservationSortValue(a))
      .slice(0, 3),
    [filteredReservations],
  );

  const selectedVenueName = selectedVenueId === 'all'
    ? 'Tất cả địa điểm'
    : venues.find((venue) => venue.id === selectedVenueId)?.name || 'Địa điểm';

  const openNotification = async (id: string, href: string) => {
    await markNotificationsRead([id]);
    setNotificationsOpen(false);
    router.push(href);
  };

  return (
    <div className="duyt-mobile-dashboard min-h-[100dvh] bg-[#F7F8FC] text-slate-950 md:hidden">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[520px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-[0_3px_14px_rgba(15,23,42,.16)] ring-2 ring-blue-100">
              <img
                src="/duyt-avatar.jpg"
                alt="Avatar DuyT"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-600">DuyT Admin</p>
              <p className="truncate text-[15px] font-black tracking-[-0.025em] text-slate-950">Tổng quan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-100 bg-slate-50 text-slate-600 active:scale-95"
            aria-label={`Mở thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
          >
            <Bell size={20} />
            {unreadCount ? <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" /> : null}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[520px] px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-[calc(76px+env(safe-area-inset-top))]">
        <section className="flex items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
              {formatDate(new Date(), { weekday: 'long', day: '2-digit', month: 'short' })}
            </p>
            <h1 className="mt-1 text-[22px] font-black tracking-[-0.04em] text-slate-950">Chào DuyT Admin,</h1>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setVenueOpen((open) => !open)}
              className="flex h-10 max-w-[154px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 shadow-sm"
              aria-expanded={venueOpen}
              aria-haspopup="listbox"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              <span className="truncate">{selectedVenueName}</span>
              <ChevronDown size={15} className="shrink-0 text-slate-400" />
            </button>
            {venueOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Đóng danh sách địa điểm"
                  onClick={() => setVenueOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-[230px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl" role="listbox">
                  <VenueOption
                    active={selectedVenueId === 'all'}
                    label="Tất cả địa điểm"
                    onClick={() => { setSelectedVenueId('all'); setVenueOpen(false); }}
                  />
                  {venues.map((venue) => (
                    <VenueOption
                      key={venue.id}
                      active={selectedVenueId === venue.id}
                      label={venue.name}
                      onClick={() => { setSelectedVenueId(venue.id); setVenueOpen(false); }}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <article className="relative min-h-[108px] overflow-hidden rounded-2xl bg-[#2563EB] p-4 text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)]">
            <div className="relative z-10">
              <p className="text-[11px] font-semibold text-blue-100">Đặt chỗ hôm nay</p>
              <p className="mt-1 text-[30px] font-black leading-none tracking-[-0.04em]">{metrics.today}</p>
              <p className="mt-3 inline-flex rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold">Dữ liệu thời gian thực</p>
            </div>
            <span className="absolute -bottom-8 -right-7 h-24 w-24 rounded-full bg-white/10" />
          </article>
          <article className="flex min-h-[108px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Yêu cầu chờ</p>
              <p className="mt-1 text-[30px] font-black leading-none tracking-[-0.04em] text-slate-950">{metrics.pending}</p>
            </div>
            <Link href="/admin/requests" className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.06em] text-amber-600">
              Cần xử lý ngay <ArrowRight size={13} />
            </Link>
          </article>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setBookingOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-800 shadow-sm active:scale-[0.98]"
          >
            <Plus size={18} className="text-blue-600" /> Tạo Đặt Chỗ
          </button>
          <Link
            href="/admin/bookings/calendar"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-800 shadow-sm active:scale-[0.98]"
          >
            <CalendarDays size={18} className="text-blue-600" /> Xem Lịch
          </Link>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard label="Doanh thu dự kiến" value={formatMobileMoney(metrics.revenue)} icon={<WalletCards size={18} />} />
          <MetricCard label="Lượt tương tác" value={formatCompact(metrics.views)} icon={<Eye size={18} />} meta={`${filteredVenues.length} địa điểm`} />
        </section>

        <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-slate-950">Thống kê đặt chỗ tuần này</h2>
            <span className="text-[10px] font-semibold text-slate-400">7 ngày hiện tại</span>
          </div>
          <div className="mt-4 flex h-32 items-end justify-between gap-2">
            {weekData.map((day, index) => {
              const height = Math.max((day.count / maxWeek) * 88, day.count ? 14 : 6);
              const active = index === currentDayIndex;
              return (
                <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[9px] font-extrabold text-slate-400">{day.count || ''}</span>
                  <div className="flex h-[88px] w-full items-end justify-center">
                    <span
                      className={`w-[14px] rounded-t-md ${active ? 'bg-blue-600' : 'bg-slate-200'}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-extrabold ${active ? 'text-blue-600' : 'text-slate-400'}`}>{day.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-4 pb-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-950">Đặt chỗ gần đây</h2>
            <Link href="/admin/bookings" className="text-xs font-extrabold text-blue-600">Tất cả</Link>
          </div>
          <div className="mt-2.5 space-y-2.5">
            {recentReservations.map((reservation) => <RecentBooking key={reservation.id} reservation={reservation} />)}
            {!recentReservations.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                <CalendarDays className="mx-auto text-slate-300" size={28} />
                <p className="mt-2 text-sm font-bold text-slate-600">Chưa có đặt chỗ</p>
                <p className="mt-1 text-xs text-slate-400">Booking mới sẽ xuất hiện tại đây.</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <button
        type="button"
        onClick={() => setBookingOpen(true)}
        className="fixed bottom-[calc(78px+env(safe-area-inset-bottom))] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.34)] active:scale-95 md:hidden"
        aria-label="Tạo booking mới"
      >
        <Plus size={28} />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden" aria-label="Điều hướng quản trị trên điện thoại">
        <div className="mx-auto flex max-w-[520px] items-start justify-between">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/admin';
            const requestBadge = item.href === '/admin/requests' ? metrics.pending : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-extrabold uppercase tracking-[-0.01em] ${active ? 'text-blue-600' : 'text-slate-400'}`}
              >
                <span className={`grid h-8 min-w-10 place-items-center rounded-xl ${active ? 'bg-blue-50' : ''}`}><Icon size={20} /></span>
                <span>{item.label}</span>
                {requestBadge > 0 ? <span className="absolute right-[20%] top-0 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[8px] leading-4 text-white">{requestBadge > 99 ? '99+' : requestBadge}</span> : null}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-extrabold uppercase tracking-[-0.01em] text-slate-400"
            aria-label="Mở menu khác"
          >
            <span className="grid h-8 min-w-10 place-items-center rounded-xl"><MoreHorizontal size={22} /></span>
            <span>Khác</span>
          </button>
        </div>
      </nav>

      <BookingFormModal open={bookingOpen} onClose={() => setBookingOpen(false)} />

      {notificationsOpen ? (
        <MobileSheet title="Thông báo" onClose={() => setNotificationsOpen(false)}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-3">
            <p className="text-xs font-semibold text-slate-500">{unreadCount} thông báo chưa đọc</p>
            {unreadCount ? (
              <button type="button" onClick={() => markNotificationsRead()} className="text-xs font-extrabold text-blue-600">Đánh dấu đã đọc</button>
            ) : null}
          </div>
          <div className="max-h-[68dvh] overflow-y-auto pb-[max(12px,env(safe-area-inset-bottom))]">
            {notifications.slice(0, 30).map((notice) => {
              const contact = isContactNotification(notice);
              return (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => openNotification(notice.id, getNotificationHref(notice))}
                  className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left ${notice.read ? 'bg-white' : 'bg-blue-50/50'}`}
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
        </MobileSheet>
      ) : null}

      {moreOpen ? (
        <MobileSheet title="Quản lý hệ thống" onClose={() => setMoreOpen(false)}>
          <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-slate-950 p-3.5 text-white shadow-lg">
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-slate-200">
              <img src="/duyt-avatar.jpg" alt="Avatar DuyT" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-black">DuyT</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-white/60">Quản trị viên hệ thống</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 px-4 pb-5">
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 text-center text-[11px] font-extrabold text-slate-700 active:scale-[0.98]"
                >
                  <Icon size={21} className="text-blue-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={logout}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-extrabold text-red-600"
            >
              Đăng xuất
            </button>
          </div>
        </MobileSheet>
      ) : null}
    </div>
  );
}

function VenueOption({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-blue-600' : 'bg-slate-300'}`} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function MetricCard({ label, value, icon, meta }: { label: string; value: string; icon: React.ReactNode; meta?: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-slate-400">
        <p className="truncate text-[10px] font-semibold">{label}</p>
        {icon}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="truncate text-xl font-black tracking-[-0.03em] text-slate-950">{value}</p>
        {meta ? <p className="shrink-0 text-[9px] font-bold text-emerald-600">{meta}</p> : null}
      </div>
    </article>
  );
}

function RecentBooking({ reservation }: { reservation: ReservationRequest }) {
  const tone = bookingTone(reservation.status);
  return (
    <Link
      href={`/admin/bookings?bookingId=${encodeURIComponent(reservation.id)}`}
      className="block rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm active:scale-[0.995]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-950">{reservation.fullName}</p>
          <p className="mt-1 truncate text-[11px] font-medium text-slate-500">{reservation.phoneNumber} · {reservation.guestCount} người</p>
        </div>
        <span className={`shrink-0 rounded-lg border px-2 py-1 text-[9px] font-black uppercase ${tone}`}>{statusLabels[reservation.status]}</span>
      </div>
      <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600">
        <span className="flex min-w-0 items-center gap-1.5"><Clock3 size={13} className="shrink-0 text-blue-500" /><span className="truncate">{reservation.arrivalTime} · {formatDate(reservation.date)}</span></span>
        <span className="flex max-w-[120px] items-center gap-1.5"><Building2 size={13} className="shrink-0 text-slate-400" /><span className="truncate">{reservation.preferredTableName || reservation.venueName}</span></span>
      </div>
    </Link>
  );
}

function MobileSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose} aria-label={`Đóng ${title}`} />
      <section className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
        <div className="mx-auto mt-2 h-1.5 w-11 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label={`Đóng ${title}`}><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function bookingTone(status: BookingStatus) {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'border-emerald-100 bg-emerald-50 text-emerald-700';
    case BookingStatus.CONTACTED:
      return 'border-blue-100 bg-blue-50 text-blue-700';
    case BookingStatus.COMPLETED:
      return 'border-slate-200 bg-slate-100 text-slate-700';
    case BookingStatus.CANCELLED:
    case BookingStatus.NO_SHOW:
      return 'border-red-100 bg-red-50 text-red-700';
    default:
      return 'border-amber-100 bg-amber-50 text-amber-700';
  }
}

function reservationSortValue(reservation: ReservationRequest) {
  const created = Date.parse(reservation.createdAt);
  if (Number.isFinite(created)) return created;
  const scheduled = Date.parse(`${reservation.date}T${reservation.arrivalTime || '00:00'}:00`);
  return Number.isFinite(scheduled) ? scheduled : 0;
}

function formatMobileMoney(value: number) {
  if (value >= 1_000_000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000)} Tr`;
  if (value >= 1_000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value / 1_000)} N`;
  return formatVnd(value);
}
