'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  MapPin,
  Phone,
  Plus,
  Users,
} from 'lucide-react';
import { BookingStatus, type ReservationRequest } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { BookingFormModal } from '../forms/BookingFormModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { addDays, formatDate, getMonday, localDateKey, statusLabels, statusTone } from '../utils';

const statusCardStyle: Record<BookingStatus, { border: string; background: string; dot: string; text: string }> = {
  [BookingStatus.NEW]: { border: '#FDBA74', background: '#FFF7ED', dot: '#F97316', text: '#C2410C' },
  [BookingStatus.CONTACTED]: { border: '#93C5FD', background: '#EFF6FF', dot: '#2563EB', text: '#1D4ED8' },
  [BookingStatus.CONFIRMED]: { border: '#86EFAC', background: '#F0FDF4', dot: '#16A34A', text: '#15803D' },
  [BookingStatus.COMPLETED]: { border: '#CBD5E1', background: '#F8FAFC', dot: '#475569', text: '#334155' },
  [BookingStatus.CANCELLED]: { border: '#FCA5A5', background: '#FEF2F2', dot: '#DC2626', text: '#B91C1C' },
  [BookingStatus.NO_SHOW]: { border: '#C4B5FD', background: '#F5F3FF', dot: '#7C3AED', text: '#6D28D9' },
};

function sortBookings(bookings: ReservationRequest[]) {
  return [...bookings].sort((a, b) => {
    const byTime = a.arrivalTime.localeCompare(b.arrivalTime);
    if (byTime) return byTime;
    return a.fullName.localeCompare(b.fullName, 'vi');
  });
}

export function BookingCalendarPage() {
  const { reservations } = useAdminData();
  const [anchor, setAnchor] = useState(new Date());
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editBooking, setEditBooking] = useState<ReservationRequest | null>(null);
  const [selected, setSelected] = useState<ReservationRequest | null>(null);

  const monday = useMemo(() => getMonday(anchor), [anchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(monday, index)), [monday]);
  const selectedDateKey = localDateKey(anchor);

  const bookingsByDay = useMemo(() => days.map((date) => {
    const key = localDateKey(date);
    return sortBookings(reservations.filter((item) => item.date === key));
  }), [days, reservations]);

  const selectedDayBookings = useMemo(
    () => sortBookings(reservations.filter((item) => item.date === selectedDateKey)),
    [reservations, selectedDateKey],
  );

  const monthLabel = formatDate(monday, { month: 'long', year: 'numeric' });
  const selectedLabel = formatDate(selectedDateKey, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const moveWeek = (daysToMove: number) => setAnchor((current) => addDays(current, daysToMove));

  return (
    <div className="pb-10">
      <PageHeader
        title="Lịch đặt chỗ"
        description={`Theo tuần · ${monthLabel}. Chọn một ngày để xem toàn bộ booking theo giờ.`}
        actions={(
          <>
            <Link href="/admin/bookings"><Button variant="secondary"><List size={18} />Danh sách</Button></Link>
            <Button onClick={() => setBookingOpen(true)}><Plus size={18} />Tạo booking</Button>
          </>
        )}
      />

      <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => moveWeek(-7)} aria-label="Tuần trước"><ChevronLeft size={18} /></Button>
          <Button variant="outline" onClick={() => setAnchor(new Date())}>Tuần này</Button>
          <Button variant="outline" size="icon" onClick={() => moveWeek(7)} aria-label="Tuần sau"><ChevronRight size={18} /></Button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDateKey}
            onChange={(event) => setAnchor(new Date(`${event.target.value}T12:00:00`))}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#1F3A8A]"
          />
          <span className="hidden text-xs font-semibold text-slate-400 md:block">{reservations.length} booking toàn hệ thống</span>
        </div>
      </Card>

      <Card className="mb-5 overflow-hidden p-0">
        <div className="custom-scrollbar overflow-x-auto p-3">
          <div className="grid min-w-[780px] grid-cols-7 gap-2">
            {days.map((day, index) => {
              const key = localDateKey(day);
              const active = key === selectedDateKey;
              const today = key === localDateKey();
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAnchor(new Date(`${key}T12:00:00`))}
                  className={`rounded-2xl border px-3 py-3 text-center transition ${active ? 'border-[#1F3A8A] bg-[#1F3A8A] text-white shadow-lg shadow-[#1F3A8A]/15' : 'border-slate-100 bg-slate-50/70 text-slate-900 hover:border-[#1F3A8A]/30 hover:bg-white'}`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-white/70' : 'text-slate-400'}`}>{formatDate(day, { weekday: 'short' })}</p>
                  <p className="mt-1 text-xl font-black">{day.getDate()}</p>
                  <p className={`mt-1 text-[10px] font-bold ${active ? 'text-white/75' : today ? 'text-[#1F3A8A]' : 'text-slate-400'}`}>{bookingsByDay[index].length} booking</p>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="mb-5 p-0">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1F3A8A]">Booking trong ngày</p>
            <h3 className="mt-1 text-xl font-black capitalize text-slate-950">{selectedLabel}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Đã sắp xếp tăng dần theo giờ đến.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">{selectedDayBookings.length} booking</div>
        </div>

        {selectedDayBookings.length ? (
          <div className="divide-y divide-slate-100">
            {selectedDayBookings.map((booking) => {
              const style = statusCardStyle[booking.status];
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setSelected(booking)}
                  className="grid w-full gap-4 p-5 text-left transition hover:bg-slate-50/80 md:grid-cols-[92px_minmax(180px,1.1fr)_minmax(220px,1.4fr)_minmax(150px,.8fr)_auto] md:items-center"
                >
                  <span className="flex items-center gap-3 md:block">
                    <span className="block text-xl font-black text-slate-950">{booking.arrivalTime}</span>
                    <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Giờ đến</span>
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-base font-black text-slate-950">{booking.fullName}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-500"><Phone size={14} />{booking.phoneNumber}</span>
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-center gap-2 truncate text-sm font-black text-slate-800"><MapPin size={15} className="shrink-0 text-[#1F3A8A]" />{booking.venueName}</span>
                    <span className="mt-1 block truncate text-sm font-semibold text-slate-500">Bàn {booking.preferredTableName || 'Chưa chọn'}{booking.preferredTableArea ? ` · ${booking.preferredTableArea}` : ''}</span>
                  </span>

                  <span className="flex items-center gap-2 text-sm font-bold text-slate-600"><Users size={16} className="text-[#1F3A8A]" />{booking.guestCount} khách</span>

                  <span
                    className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-black"
                    style={{ borderColor: style.border, backgroundColor: style.background, color: style.text }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
                    {statusLabels[booking.status]}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6"><EmptyState icon={CalendarDays} title="Ngày này chưa có booking" description="Chọn ngày khác hoặc tạo booking mới." /></div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-5">
          <h3 className="text-lg font-black text-slate-950">Tổng quan cả tuần</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">Mỗi cột hiển thị đầy đủ booking của ngày, theo đúng thứ tự giờ.</p>
        </div>
        <div className="custom-scrollbar overflow-x-auto p-4">
          <div className="grid min-w-[1120px] grid-cols-7 gap-3">
            {days.map((day, dayIndex) => {
              const key = localDateKey(day);
              const active = key === selectedDateKey;
              return (
                <section key={key} className={`min-h-[260px] rounded-2xl border p-3 ${active ? 'border-[#1F3A8A]/35 bg-[#1F3A8A]/[0.025]' : 'border-slate-100 bg-slate-50/60'}`}>
                  <button type="button" onClick={() => setAnchor(new Date(`${key}T12:00:00`))} className="mb-3 w-full text-left">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{formatDate(day, { weekday: 'long' })}</p>
                    <p className="mt-1 text-base font-black text-slate-900">{formatDate(key, { day: '2-digit', month: '2-digit' })}</p>
                  </button>
                  <div className="space-y-2">
                    {bookingsByDay[dayIndex].map((booking) => {
                      const style = statusCardStyle[booking.status];
                      return (
                        <button
                          key={booking.id}
                          type="button"
                          onClick={() => setSelected(booking)}
                          className="w-full rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          style={{ borderColor: style.border, backgroundColor: style.background }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-black text-slate-950">{booking.arrivalTime}</span>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
                          </div>
                          <p className="mt-1 truncate text-sm font-black text-slate-900">{booking.fullName}</p>
                          <p className="mt-1 truncate text-[11px] font-bold text-slate-600">{booking.venueName}</p>
                          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{booking.preferredTableName || 'Chưa chọn bàn'} · {booking.guestCount} khách</p>
                        </button>
                      );
                    })}
                    {!bookingsByDay[dayIndex].length ? <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs font-semibold text-slate-400">Không có lịch</p> : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#1F3A8A]">{selected.referenceCode || selected.id}</p>
                <h3 className="mt-1 text-xl font-black">{selected.fullName}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{selected.phoneNumber}</p>
              </div>
              <Badge tone={statusTone[selected.status]}>{statusLabels[selected.status]}</Badge>
            </div>
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <Info icon={<CalendarDays size={17} />} text={`${formatDate(selected.date)} · ${selected.arrivalTime}`} />
              <Info icon={<Users size={17} />} text={`${selected.guestCount} khách · ${selected.preferredTableName || 'Chưa chọn bàn'}`} />
              <Info icon={<MapPin size={17} />} text={selected.venueName} />
              {selected.preferredTableArea ? <Info icon={<Clock size={17} />} text={selected.preferredTableArea} /> : null}
            </div>
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Đóng</Button>
              <Button className="flex-1" onClick={() => { setEditBooking(selected); setSelected(null); }}>Chỉnh sửa</Button>
            </div>
          </div>
        </div>
      ) : null}

      <BookingFormModal open={bookingOpen || Boolean(editBooking)} booking={editBooking} onClose={() => { setBookingOpen(false); setEditBooking(null); }} />
    </div>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-3 text-sm font-bold text-slate-700"><span className="text-[#1F3A8A]">{icon}</span>{text}</div>;
}
