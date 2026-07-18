'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertCircle, ArrowRight, BarChart2, Calendar, CalendarDays, CreditCard, Eye, MapPin, MoreVertical, PlusCircle, Star,
} from 'lucide-react';
import { BookingStatus } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { BookingFormModal } from '../forms/BookingFormModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { formatCompact, formatDate, formatVnd, getMonday, addDays, localDateKey, reservationMinimumSpend, statusLabels, statusTone } from '../utils';

export function DashboardPage() {
  const { reservations, venues, customers } = useAdminData();
  const [bookingOpen, setBookingOpen] = useState(false);
  const today = localDateKey();

  const metrics = useMemo(() => {
    const active = reservations.filter((item) => ![BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(item.status));
    return {
      total: reservations.length,
      today: reservations.filter((item) => item.date === today).length,
      revenue: active.reduce((sum, item) => sum + reservationMinimumSpend(item, venues), 0),
      pending: reservations.filter((item) => item.status === BookingStatus.NEW || item.status === BookingStatus.CONTACTED).length,
      views: venues.reduce((sum, venue) => sum + Number(venue.viewCount || 0), 0),
      rating: venues.length ? venues.reduce((sum, venue) => sum + Number(venue.rating || 0), 0) / venues.length : 0,
    };
  }, [reservations, today, venues]);

  const weekData = useMemo(() => {
    const monday = getMonday(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(monday, index);
      const key = localDateKey(date);
      return {
        label: index === 6 ? 'CN' : `T${index + 2}`,
        date,
        count: reservations.filter((item) => item.date === key).length,
      };
    });
  }, [reservations]);
  const maxWeek = Math.max(...weekData.map((item) => item.count), 1);

  const statuses = Object.values(BookingStatus).map((status) => ({
    status,
    count: reservations.filter((item) => item.status === status).length,
    percent: reservations.length ? Math.round((reservations.filter((item) => item.status === status).length / reservations.length) * 100) : 0,
  }));

  const recent = [...reservations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  const topVenues = [...venues].sort((a, b) => Number(b.viewCount || 0) - Number(a.viewCount || 0)).slice(0, 4);

  return (
    <div className="pb-10">
      <PageHeader
        title="Tổng quan hệ thống"
        description={`Hôm nay, ${formatDate(new Date(), { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`}
        actions={<><Link href="/admin/venues"><Button variant="secondary"><MapPin size={18} />Mở Địa điểm</Button></Link><Link href="/admin/bookings"><Button variant="secondary"><Calendar size={18} />Mở Đặt chỗ</Button></Link><Button onClick={() => setBookingOpen(true)}><PlusCircle size={18} />Tạo booking</Button></>}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric icon={<BarChart2 size={23} />} label="Tổng đặt chỗ" value={formatCompact(metrics.total)} meta={`${customers.length} khách`} />
        <Metric icon={<CalendarDays size={23} />} label="Đặt chỗ hôm nay" value={String(metrics.today).padStart(2, '0')} meta={metrics.today ? 'Đang hoạt động' : 'Chưa có lịch'} accent />
        <Metric icon={<CreditCard size={23} className="text-emerald-600" />} label="Dự kiến (Min. spend)" value={formatCompact(metrics.revenue)} meta="VNĐ" />
        <Metric icon={<AlertCircle size={23} className="text-red-600" />} label="Cần xử lý" value={String(metrics.pending).padStart(2, '0')} meta="Booking mới/liên hệ" danger />
        <Metric icon={<Eye size={23} className="text-slate-400" />} label="Lượt xem địa điểm" value={formatCompact(metrics.views)} meta={`${venues.length} địa điểm`} />
        <Metric icon={<Star size={23} className="text-amber-500" />} label="Đánh giá TB" value={metrics.rating.toFixed(1)} meta="/ 5.0" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 md:p-8 lg:col-span-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div><h2 className="text-lg font-extrabold">Booking trong tuần</h2><p className="mt-1 text-sm font-medium text-slate-500">Dữ liệu 7 ngày hiện tại</p></div>
            <Link href="/admin/bookings/calendar" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-200">Mở lịch</Link>
          </div>
          <div className="relative flex h-[280px] items-end justify-between gap-2 px-2 sm:gap-4 sm:px-4">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-[0.07]">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="border-t border-slate-900" />)}</div>
            {weekData.map((day, index) => (
              <div key={day.label} className="group z-10 flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="relative flex w-full items-end" style={{ height: `${Math.max((day.count / maxWeek) * 88, 8)}%` }}>
                  <div className={`h-full w-full rounded-t-lg transition hover:opacity-80 ${index === new Date().getDay() - 1 || (new Date().getDay() === 0 && index === 6) ? 'bg-[#1F3A8A]' : 'bg-[#1F3A8A]/20'}`} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">{day.count}</span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-500">{day.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 md:p-8 lg:col-span-4">
          <h2 className="mb-6 text-lg font-extrabold">Trạng thái Booking</h2>
          <div className="space-y-5">
            {statuses.map(({ status, count, percent }) => {
              const colors = {
                primary: 'bg-blue-600 text-blue-700', warning: 'bg-amber-500 text-amber-700', success: 'bg-emerald-600 text-emerald-700',
                danger: 'bg-red-600 text-red-700', neutral: 'bg-slate-700 text-slate-700',
              }[statusTone[status]];
              return <div key={status}>
                <div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-slate-700">{statusLabels[status]}</span><span className={`font-extrabold ${colors.split(' ')[1]}`}>{count} · {percent}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${colors.split(' ')[0]}`} style={{ width: `${Math.max(percent, count ? 3 : 0)}%` }} /></div>
              </div>;
            })}
          </div>
        </Card>

        <Card className="overflow-hidden p-0 lg:col-span-8">
          <div className="flex items-center justify-between px-6 py-5 md:px-8"><h2 className="text-lg font-extrabold">Đặt chỗ mới nhất</h2><Link href="/admin/bookings" className="flex items-center gap-1 text-sm font-extrabold text-[#1F3A8A] hover:underline">Xem tất cả <ArrowRight size={16} /></Link></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead><tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><th className="px-6 py-3 md:px-8">Khách hàng</th><th className="px-4 py-3">Địa điểm</th><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map((booking) => <tr key={booking.id} className="hover:bg-slate-50/70"><td className="px-6 py-4 md:px-8"><p className="text-sm font-extrabold">{booking.fullName}</p><p className="mt-1 text-xs font-medium text-slate-400">{booking.phoneNumber}</p></td><td className="px-4 py-4 text-sm font-semibold text-slate-700">{booking.venueName}</td><td className="px-4 py-4"><p className="text-sm font-bold">{booking.arrivalTime}</p><p className="mt-1 text-xs text-slate-400">{formatDate(booking.date)}</p></td><td className="px-4 py-4"><Badge tone={statusTone[booking.status]}>{statusLabels[booking.status]}</Badge></td><td className="px-4 py-4"><Link href="/admin/bookings"><button className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><MoreVertical size={18} /></button></Link></td></tr>)}
                {!recent.length ? <tr><td colSpan={5} className="p-10 text-center text-sm font-medium text-slate-500">Chưa có booking.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 md:p-8 lg:col-span-4">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-extrabold">Địa điểm nổi bật</h2><Link href="/admin/venues" className="text-xs font-extrabold text-[#1F3A8A]">Quản lý</Link></div>
          <div className="space-y-4">
            {topVenues.map((venue) => <div key={venue.id} className="flex items-center gap-3"><img src={venue.image} alt={venue.name} className="h-12 w-12 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{venue.name}</p><p className="mt-1 truncate text-xs font-medium text-slate-400">{venue.location}</p></div><div className="text-right"><p className="text-xs font-extrabold">{formatCompact(Number(venue.viewCount || 0))}</p><p className="mt-1 text-[10px] text-slate-400">lượt xem</p></div></div>)}
          </div>
          <div className="mt-6 rounded-2xl bg-[#D9DFF5]/50 p-4"><p className="text-xs font-bold text-[#1F3A8A]">Tổng doanh thu dự kiến</p><p className="mt-1 text-xl font-extrabold text-slate-950">{formatVnd(metrics.revenue)}</p></div>
        </Card>
      </div>

      <BookingFormModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}

function Metric({ icon, label, value, meta, accent, danger }: { icon: React.ReactNode; label: string; value: string; meta: string; accent?: boolean; danger?: boolean }) {
  return <Card className={`flex h-[140px] flex-col justify-between p-5 ${accent ? 'border-l-4 border-l-[#1F3A8A]' : ''} ${danger ? 'border-red-100 bg-red-50/60 shadow-none' : ''}`}><div className={danger ? 'text-red-600' : 'text-[#1F3A8A]'}>{icon}<p className={`mt-3 text-[11px] font-bold ${danger ? 'text-red-600' : 'text-slate-500'}`}>{label}</p></div><div><div className={`text-2xl font-black ${danger ? 'text-red-600' : 'text-slate-950'}`}>{value}</div><p className="mt-1 text-[10px] font-semibold text-slate-400">{meta}</p></div></Card>;
}
