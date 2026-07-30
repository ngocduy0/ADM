'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, CheckCircle2, Clock3, Edit3, Mail, MessageSquare, Phone, Plus } from 'lucide-react';
import { BookingStatus, type ReservationRequest } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { isContactNotification, parseContactNotification } from '../notification-utils';
import { BookingFormModal } from '../forms/BookingFormModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { Pagination } from '../ui/Pagination';
import { formatDateTime, statusLabels, statusTone } from '../utils';

const CONTACT_PAGE_SIZE = 8;
const BOOKING_PAGE_SIZE = 10;

export function RequestsPage() {
  const { reservations, notifications, searchQuery, updateReservationStatus, markNotificationsRead } = useAdminData();
  const searchParams = useSearchParams();
  const selectedContactId = searchParams.get('contactId') || '';
  const [editing, setEditing] = useState<ReservationRequest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'OPEN' | 'ALL'>('OPEN');
  const [contactPage, setContactPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);

  const contactRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications
      .filter(isContactNotification)
      .map(parseContactNotification)
      .filter((item) => filter === 'ALL' || !item.read || item.requestId === selectedContactId)
      .filter((item) => !q || [item.name, item.email, item.phone, item.message, item.referenceCode].join(' ').toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.requestId === selectedContactId) return -1;
        if (b.requestId === selectedContactId) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [filter, notifications, searchQuery, selectedContactId]);

  const bookingRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...reservations]
      .filter((item) => filter === 'ALL' || item.status === BookingStatus.NEW || item.status === BookingStatus.CONTACTED)
      .filter((item) => !q || [item.fullName, item.phoneNumber, item.venueName, item.notes, item.source].join(' ').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filter, reservations, searchQuery]);

  const unreadContacts = notifications.filter((notice) => isContactNotification(notice) && !notice.read).length;
  const contactTotalPages = Math.max(1, Math.ceil(contactRows.length / CONTACT_PAGE_SIZE));
  const bookingTotalPages = Math.max(1, Math.ceil(bookingRows.length / BOOKING_PAGE_SIZE));
  const currentContactPage = Math.min(contactPage, contactTotalPages);
  const currentBookingPage = Math.min(bookingPage, bookingTotalPages);
  const visibleContacts = contactRows.slice((currentContactPage - 1) * CONTACT_PAGE_SIZE, currentContactPage * CONTACT_PAGE_SIZE);
  const visibleBookings = bookingRows.slice((currentBookingPage - 1) * BOOKING_PAGE_SIZE, currentBookingPage * BOOKING_PAGE_SIZE);

  useEffect(() => {
    setContactPage(1);
    setBookingPage(1);
  }, [filter, searchQuery]);

  useEffect(() => {
    if (contactPage > contactTotalPages) setContactPage(contactTotalPages);
  }, [contactPage, contactTotalPages]);

  useEffect(() => {
    if (bookingPage > bookingTotalPages) setBookingPage(bookingTotalPages);
  }, [bookingPage, bookingTotalPages]);

  useEffect(() => {
    if (!selectedContactId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`request-${selectedContactId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [selectedContactId, visibleContacts.length]);

  const hasRows = contactRows.length > 0 || bookingRows.length > 0;

  return (
    <div className="pb-10">
      <PageHeader
        title="Yêu cầu từ khách"
        description="Booking mới và biểu mẫu liên hệ trực tiếp đều được tập trung tại đây."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus size={18} />Tạo yêu cầu</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Clock3 size={21} />} value={reservations.filter((item) => item.status === BookingStatus.NEW).length} label="Booking mới" tone="warning" />
        <Metric icon={<Mail size={21} />} value={unreadContacts} label="Liên hệ mới" tone="violet" />
        <Metric icon={<Phone size={21} />} value={reservations.filter((item) => item.status === BookingStatus.CONTACTED).length} label="Đã liên hệ" tone="primary" />
        <Metric icon={<CheckCircle2 size={21} />} value={reservations.filter((item) => item.status === BookingStatus.CONFIRMED).length} label="Đã xác nhận" tone="success" />
      </div>

      <Card className="mb-5 flex gap-2 p-2">
        <button onClick={() => setFilter('OPEN')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition ${filter === 'OPEN' ? 'bg-[#1F3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Đang cần xử lý</button>
        <button onClick={() => setFilter('ALL')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition ${filter === 'ALL' ? 'bg-[#1F3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Tất cả yêu cầu</button>
      </Card>

      {contactRows.length ? (
        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">Liên hệ trực tiếp</h2>
            </div>
            <Badge tone={unreadContacts ? 'warning' : 'neutral'}>{unreadContacts} chưa xem</Badge>
          </div>
          <div className="space-y-4">
            {visibleContacts.map((request) => {
              const selected = request.requestId === selectedContactId;
              const subject = encodeURIComponent(`[${request.referenceCode}] Phản hồi yêu cầu liên hệ DuyT`);
              const body = encodeURIComponent(`Chào ${request.name},\n\nDuyT đã nhận được yêu cầu ${request.referenceCode} của bạn:\n${request.message}\n\n`);
              const callHref = request.phone ? `tel:${request.phone.replace(/[^\d+]/g, '')}` : '';
              return (
                <Card
                  id={`request-${request.requestId}`}
                  key={request.id}
                  className={`p-5 transition ${selected ? 'border-violet-300 ring-4 ring-violet-100' : ''} ${request.read ? '' : 'border-violet-200 bg-violet-50/35'}`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Mail size={21} /></span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-slate-950">{request.name}</h3>
                          <Badge tone={request.read ? 'neutral' : 'warning'}>{request.read ? 'Đã xem' : 'Mới'}</Badge>
                          <Badge tone="neutral">Web liên hệ</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <a href={`mailto:${request.email}`} className="truncate text-sm font-semibold text-violet-700 hover:underline">{request.email}</a>
                          {request.phone ? <a href={callHref} className="text-sm font-semibold text-emerald-700 hover:underline">{request.phone}</a> : null}
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">{request.message}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>{request.referenceCode}</span>
                          <span>Gửi lúc {formatDateTime(request.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {request.phone ? <a href={callHref}><Button variant="outline" size="sm"><Phone size={15} />Gọi khách</Button></a> : null}
                      <a href={`mailto:${request.email}?subject=${subject}&body=${body}`}>
                        <Button size="sm"><Mail size={15} />Phản hồi email</Button>
                      </a>
                      {!request.read ? (
                        <Button variant="secondary" size="sm" onClick={() => markNotificationsRead([request.id])}><Check size={15} />Đã xem</Button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination page={currentContactPage} totalItems={contactRows.length} pageSize={CONTACT_PAGE_SIZE} onPageChange={setContactPage} itemLabel="yêu cầu liên hệ" />
        </section>
      ) : null}

      {bookingRows.length ? (
        <section>
          <div className="mb-3">
            <h2 className="text-base font-black text-slate-950">Yêu cầu đặt chỗ</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Booking từ sơ đồ bàn và biểu mẫu đặt chỗ.</p>
          </div>
          <div className="space-y-4">
            {visibleBookings.map((request) => (
              <Card key={request.id} className="p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D9DFF5] text-[#1F3A8A]"><MessageSquare size={21} /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-950">{request.fullName}</h3>
                        <Badge tone={statusTone[request.status]}>{statusLabels[request.status]}</Badge>
                        <Badge tone="neutral">{request.source}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{request.phoneNumber} · {request.venueName}</p>
                      <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-600">{request.notes || `Yêu cầu bàn ${request.preferredTableName || 'phù hợp'} cho ${request.guestCount} khách.`}</p>
                      <p className="mt-2 text-[10px] font-bold text-slate-400">Gửi lúc {formatDateTime(request.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <a href={`tel:${request.phoneNumber.replace(/\s/g, '')}`}><Button variant="outline" size="sm"><Phone size={15} />Gọi khách</Button></a>
                    {request.status === BookingStatus.NEW ? <Button variant="secondary" size="sm" onClick={() => updateReservationStatus(request.id, BookingStatus.CONTACTED)}>Đã liên hệ</Button> : null}
                    {request.status !== BookingStatus.CONFIRMED ? <Button size="sm" onClick={() => updateReservationStatus(request.id, BookingStatus.CONFIRMED)}><CheckCircle2 size={15} />Xác nhận</Button> : null}
                    <button onClick={() => setEditing(request)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Edit3 size={17} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={currentBookingPage} totalItems={bookingRows.length} pageSize={BOOKING_PAGE_SIZE} onPageChange={setBookingPage} itemLabel="yêu cầu đặt chỗ" />
        </section>
      ) : null}

      {!hasRows ? <EmptyState icon={MessageSquare} title="Không có yêu cầu cần xử lý" description="Tất cả booking và yêu cầu liên hệ hiện tại đã được xử lý hoặc không phù hợp từ khóa tìm kiếm." /> : null}
      <BookingFormModal open={createOpen || Boolean(editing)} booking={editing} onClose={() => { setCreateOpen(false); setEditing(null); }} />
    </div>
  );
}

function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: 'warning' | 'primary' | 'success' | 'violet' }) {
  const classes = tone === 'warning'
    ? 'bg-amber-50 text-amber-700'
    : tone === 'success'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'violet'
        ? 'bg-violet-50 text-violet-700'
        : 'bg-blue-50 text-blue-700';
  return <Card className="flex items-center gap-4 p-5"><span className={`grid h-11 w-11 place-items-center rounded-xl ${classes}`}>{icon}</span><div><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div></Card>;
}
