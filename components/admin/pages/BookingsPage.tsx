'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Edit3, Eye, Filter, MoreVertical, Plus, Trash2, Users, XCircle } from 'lucide-react';
import { BookingStatus, type ReservationRequest } from '@/components/aurelius/types';
import { getStatusTransitionDecision } from '@/lib/booking-rules';
import { useAdminData } from '../AdminDataProvider';
import { BookingFormModal } from '../forms/BookingFormModal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { PageHeader } from '../ui/PageHeader';
import { cn, formatDate, formatVnd, localDateKey, reservationMinimumSpend, statusLabels } from '../utils';

const PAGE_SIZE = 8;
const tabItems: Array<{ value: 'ALL' | BookingStatus; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: BookingStatus.NEW, label: 'Mới' },
  { value: BookingStatus.CONFIRMED, label: 'Đã xác nhận' },
  { value: BookingStatus.CONTACTED, label: 'Chờ xử lý' },
];

const statusStyle: Record<BookingStatus, { pill: string; menu: string; dot: string }> = {
  [BookingStatus.NEW]: { pill: 'border-blue-200 bg-blue-50 text-blue-700 shadow-blue-100/60', menu: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  [BookingStatus.CONTACTED]: { pill: 'border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100/60', menu: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  [BookingStatus.CONFIRMED]: { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100/60', menu: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  [BookingStatus.COMPLETED]: { pill: 'border-slate-200 bg-slate-100 text-slate-700 shadow-slate-100/60', menu: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
  [BookingStatus.CANCELLED]: { pill: 'border-red-200 bg-red-50 text-red-600 shadow-red-100/60', menu: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  [BookingStatus.NO_SHOW]: { pill: 'border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100/60', menu: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
};

export function BookingsPage() {
  const params = useSearchParams();
  const focusBookingId = params.get('bookingId');
  const { reservations, venues, searchQuery, updateReservationStatus, deleteReservation } = useAdminData();
  const [status, setStatus] = useState<'ALL' | BookingStatus>('ALL');
  const [venueId, setVenueId] = useState('ALL');
  const [todayOnly, setTodayOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationRequest | null>(null);
  const [detail, setDetail] = useState<ReservationRequest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReservationRequest | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = focusBookingId ? '' : searchQuery.trim().toLowerCase();
    const today = localDateKey();
    return [...reservations]
      .filter((item) => Boolean(focusBookingId) || status === 'ALL' || item.status === status)
      .filter((item) => Boolean(focusBookingId) || venueId === 'ALL' || item.venueId === venueId)
      .filter((item) => Boolean(focusBookingId) || !todayOnly || item.date === today)
      .filter((item) => !query || [item.fullName, item.phoneNumber, item.venueName, item.preferredTableName, item.preferredTableArea, item.referenceCode, item.id].join(' ').toLowerCase().includes(query))
      .sort((a, b) => `${b.date}T${b.arrivalTime}`.localeCompare(`${a.date}T${a.arrivalTime}`));
  }, [focusBookingId, reservations, searchQuery, status, venueId, todayOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const focusedIndex = focusBookingId ? filtered.findIndex((item) => item.id === focusBookingId) : -1;
  const focusedPage = focusedIndex >= 0 ? Math.floor(focusedIndex / PAGE_SIZE) + 1 : null;
  const currentPage = focusedPage || Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!focusBookingId || focusedIndex < 0) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`booking-${focusBookingId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusBookingId, focusedIndex]);

  const changeTab = (value: 'ALL' | BookingStatus) => { setStatus(value); setPage(1); };

  return (
    <div className="pb-10">
      <PageHeader
        title="Danh sách đặt chỗ"
        description="Ưu tiên thông tin khách, số điện thoại, bàn, địa điểm và thời gian để xử lý nhanh."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus size={18} />Đặt chỗ mới</Button>}
      />

      <Card className="mb-7 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-full overflow-x-auto rounded-2xl bg-slate-100 p-1 lg:w-auto">
            {tabItems.map((tab) => <button key={tab.value} onClick={() => changeTab(tab.value)} className={cn('shrink-0 rounded-xl px-5 py-2.5 text-sm font-black transition', status === tab.value ? 'bg-white text-[#1F3A8A] shadow-sm' : 'text-slate-600 hover:text-slate-950')}>{tab.label}</button>)}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant={todayOnly ? 'primary' : 'outline'} onClick={() => { setTodayOnly(!todayOnly); setPage(1); }}><CalendarDays size={18} />{todayOnly ? 'Đang xem hôm nay' : 'Hôm nay'}</Button>
            <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}><Filter size={18} />Bộ lọc</Button>
            <Link href="/admin/bookings/calendar"><Button variant="outline"><CalendarDays size={18} />Xem lịch</Button></Link>
          </div>
        </div>
        {filterOpen ? <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"><select value={venueId} onChange={(event) => { setVenueId(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-[#1F3A8A]"><option value="ALL">Tất cả địa điểm</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select><p className="text-xs font-medium text-slate-400">Tìm theo tên, số điện thoại, bàn hoặc mã booking bằng ô tìm kiếm trên thanh điều hướng.</p></div> : null}
      </Card>

      {rows.length ? <div className="space-y-4">
        {rows.map((booking, index) => {
          const tableLabel = booking.preferredTableName || 'Chưa chọn bàn';
          const isFocused = focusBookingId === booking.id;
          return (
            <Card id={`booking-${booking.id}`} key={booking.id} className={cn('relative overflow-visible rounded-[26px] p-0 transition-all duration-500', isFocused ? 'border-blue-300 ring-4 ring-blue-100 shadow-[0_22px_70px_rgba(37,99,235,0.16)]' : index === 0 && booking.status === BookingStatus.NEW ? 'border-blue-200 ring-2 ring-blue-100' : '')}>
              <div className="grid gap-5 p-5 md:grid-cols-[minmax(210px,1.1fr)_minmax(220px,1.1fr)_160px_170px_70px] md:items-center lg:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 text-[#1F3A8A]"><Users size={22} /></div>
                  <div className="min-w-0">
                    <span className="inline-flex max-w-full rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: `${booking.preferredTableColor || '#1F3A8A'}18`, color: booking.preferredTableColor || '#1F3A8A' }}>{tableLabel}{booking.preferredTableArea ? ` · ${booking.preferredTableArea}` : ''}</span>
                    <h3 className="mt-2 truncate text-base font-black text-slate-950">{booking.fullName}</h3>
                    <a href={`tel:${booking.phoneNumber}`} className="mt-1 block text-sm font-bold text-[#1F3A8A] hover:underline">{booking.phoneNumber || 'Chưa có SĐT'}</a>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-800">{booking.venueName}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(booking.date)} · {booking.arrivalTime}</p>
                  <p className="mt-2 truncate text-[11px] font-medium text-slate-400">Mã: {booking.referenceCode || booking.id}</p>
                </div>

                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-700"><Users size={16} className="text-slate-400" />{booking.guestCount} người</p>
                  <p className="mt-2 text-sm font-black text-emerald-600">{formatVnd(reservationMinimumSpend(booking, venues))}</p>
                </div>

                <div>
                  <StatusPicker booking={booking} onChange={(next) => updateReservationStatus(booking.id, next)} />
                  <p className="mt-2 pl-1 text-[10px] font-bold text-slate-400">Nguồn: {booking.source}</p>
                </div>

                <div className="relative flex justify-end">
                  <button onClick={() => setMenuId(menuId === booking.id ? null : booking.id)} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Thao tác"><MoreVertical size={20} /></button>
                  {menuId === booking.id ? <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <button onClick={() => { setDetail(booking); setMenuId(null); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"><Eye size={17} />Xem chi tiết</button>
                    <button onClick={() => { setEditing(booking); setMenuId(null); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"><Edit3 size={17} />Chỉnh sửa</button>
                    <div className="my-1 h-px bg-slate-100" />
                    <button onClick={() => { updateReservationStatus(booking.id, BookingStatus.CANCELLED); setMenuId(null); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50"><XCircle size={17} />Hủy đặt chỗ</button>
                    <button onClick={() => { setDeleteTarget(booking); setMenuId(null); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 size={17} />Xóa khỏi hệ thống</button>
                  </div> : null}
                </div>
              </div>
            </Card>
          );
        })}

        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-500">Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} đặt chỗ</p>
          <div className="flex items-center gap-2"><Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17} /></Button>{Array.from({ length: Math.min(5, totalPages) }, (_, index) => index + 1).map((value) => <button key={value} onClick={() => setPage(value)} className={cn('h-10 min-w-10 rounded-xl px-3 text-sm font-black', currentPage === value ? 'bg-[#1F3A8A] text-white shadow-lg' : 'text-slate-600 hover:bg-white')}>{value}</button>)}{totalPages > 5 ? <span className="px-2 text-slate-400">…</span> : null}<Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17} /></Button></div>
        </div>
      </div> : <EmptyState icon={CalendarDays} title="Không có booking phù hợp" description="Hãy đổi bộ lọc, từ khóa tìm kiếm hoặc tạo booking mới." action={<Button onClick={() => setCreateOpen(true)}><Plus size={18} />Tạo booking</Button>} />}

      <BookingFormModal open={createOpen || Boolean(editing)} booking={editing} onClose={() => { setCreateOpen(false); setEditing(null); }} />
      <BookingDetail booking={detail} venues={venues} onClose={() => setDetail(null)} onEdit={() => { if (detail) setEditing(detail); setDetail(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa booking?" description={`Booking của ${deleteTarget?.fullName || 'khách hàng'} sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.`} confirmLabel="Xóa booking" onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteReservation(deleteTarget.id)} />
    </div>
  );
}

function StatusPicker({ booking, onChange }: { booking: ReservationRequest; onChange: (value: BookingStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const value = booking.status;
  const style = statusStyle[value];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative inline-block w-full max-w-[170px]">
      <button type="button" onClick={() => setOpen((current) => !current)} className={cn('flex h-10 w-full items-center justify-between gap-2 rounded-full border px-3.5 text-[11px] font-black uppercase shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', style.pill)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="flex min-w-0 items-center gap-2"><span className={cn('h-2 w-2 shrink-0 rounded-full', style.dot)} /><span className="truncate">{statusLabels[value]}</span></span>
        <ChevronDown size={15} className={cn('shrink-0 transition-transform', open ? 'rotate-180' : '')} />
      </button>
      {open ? (
        <div role="listbox" className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
          {Object.values(BookingStatus).map((item) => {
            const itemStyle = statusStyle[item];
            const decision = getStatusTransitionDecision(booking, item);
            const disabled = item !== value && !decision.allowed;
            return <button key={item} type="button" role="option" aria-selected={item === value} disabled={disabled} title={disabled ? decision.reason : undefined} onClick={() => { if (!disabled) onChange(item); setOpen(false); }} className={cn('mb-1 flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-xs font-black transition last:mb-0', disabled ? 'cursor-not-allowed bg-slate-50 text-slate-300' : item === value ? itemStyle.menu : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-50')}><span className="flex items-center gap-2.5"><span className={cn('h-2.5 w-2.5 rounded-full', disabled ? 'bg-slate-300' : itemStyle.dot)} />{statusLabels[item]}</span>{item === value ? <Check size={15} /> : null}</button>;
          })}
        </div>
      ) : null}
    </div>
  );
}

function BookingDetail({ booking, venues, onClose, onEdit }: { booking: ReservationRequest | null; venues: Parameters<typeof reservationMinimumSpend>[1]; onClose: () => void; onEdit: () => void }) {
  if (!booking) return null;
  return <Modal open title={`Booking · ${booking.fullName}`} description={booking.referenceCode || booking.id} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Đóng</Button><Button onClick={onEdit}><Edit3 size={17} />Chỉnh sửa</Button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Detail label="Số điện thoại" value={booking.phoneNumber} />
      <Detail label="Số khách" value={`${booking.guestCount} người`} />
      <Detail label="Địa điểm" value={booking.venueName} />
      <Detail label="Bàn / khu" value={`${booking.preferredTableName || 'Chưa chọn bàn'}${booking.preferredTableArea ? ` · ${booking.preferredTableArea}` : ''}`} />
      <Detail label="Ngày giờ" value={`${formatDate(booking.date)} · ${booking.arrivalTime}`} />
      <Detail label="Chi tiêu tối thiểu" value={formatVnd(reservationMinimumSpend(booking, venues))} />
      <Detail label="Trạng thái" value={statusLabels[booking.status]} />
      <Detail label="Nguồn" value={booking.source} />
      <div className="sm:col-span-2"><Detail label="Ghi chú" value={booking.notes || 'Không có ghi chú'} /></div>
    </div>
  </Modal>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 break-words text-sm font-black text-slate-900">{value}</p></div>; }
