'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Edit3, MessageSquare, Phone, Plus } from 'lucide-react';
import { BookingStatus, type ReservationRequest } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { BookingFormModal } from '../forms/BookingFormModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { formatDateTime, statusLabels, statusTone } from '../utils';

export function RequestsPage() {
  const { reservations, searchQuery, updateReservationStatus } = useAdminData();
  const [editing, setEditing] = useState<ReservationRequest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'OPEN' | 'ALL'>('OPEN');

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...reservations]
      .filter((item) => filter === 'ALL' || item.status === BookingStatus.NEW || item.status === BookingStatus.CONTACTED)
      .filter((item) => !q || [item.fullName, item.phoneNumber, item.venueName, item.notes, item.source].join(' ').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filter, reservations, searchQuery]);

  return (
    <div className="pb-10">
      <PageHeader title="Yêu cầu từ khách" description="Tập trung các booking mới và yêu cầu cần liên hệ." actions={<Button onClick={() => setCreateOpen(true)}><Plus size={18} />Tạo yêu cầu</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><Metric icon={<Clock3 size={21} />} value={reservations.filter((item) => item.status === BookingStatus.NEW).length} label="Chưa xử lý" tone="warning" /><Metric icon={<Phone size={21} />} value={reservations.filter((item) => item.status === BookingStatus.CONTACTED).length} label="Đã liên hệ" tone="primary" /><Metric icon={<CheckCircle2 size={21} />} value={reservations.filter((item) => item.status === BookingStatus.CONFIRMED).length} label="Đã xác nhận" tone="success" /></div>
      <Card className="mb-5 flex gap-2 p-2"><button onClick={() => setFilter('OPEN')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition ${filter === 'OPEN' ? 'bg-[#1F3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Đang cần xử lý</button><button onClick={() => setFilter('ALL')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black transition ${filter === 'ALL' ? 'bg-[#1F3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Tất cả yêu cầu</button></Card>
      {rows.length ? <div className="space-y-4">{rows.map((request) => <Card key={request.id} className="p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D9DFF5] text-[#1F3A8A]"><MessageSquare size={21} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-black text-slate-950">{request.fullName}</h3><Badge tone={statusTone[request.status]}>{statusLabels[request.status]}</Badge><Badge tone="neutral">{request.source}</Badge></div><p className="mt-1 text-sm font-semibold text-slate-500">{request.phoneNumber} · {request.venueName}</p><p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-600">{request.notes || `Yêu cầu bàn ${request.preferredTableName || 'phù hợp'} cho ${request.guestCount} khách.`}</p><p className="mt-2 text-[10px] font-bold text-slate-400">Gửi lúc {formatDateTime(request.createdAt)}</p></div></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><a href={`tel:${request.phoneNumber.replace(/\s/g, '')}`}><Button variant="outline" size="sm"><Phone size={15} />Gọi khách</Button></a>{request.status === BookingStatus.NEW ? <Button variant="secondary" size="sm" onClick={() => updateReservationStatus(request.id, BookingStatus.CONTACTED)}>Đã liên hệ</Button> : null}{request.status !== BookingStatus.CONFIRMED ? <Button size="sm" onClick={() => updateReservationStatus(request.id, BookingStatus.CONFIRMED)}><CheckCircle2 size={15} />Xác nhận</Button> : null}<button onClick={() => setEditing(request)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Edit3 size={17} /></button></div></div></Card>)}</div> : <EmptyState icon={MessageSquare} title="Không có yêu cầu cần xử lý" description="Tất cả yêu cầu hiện tại đã được xử lý hoặc không phù hợp từ khóa tìm kiếm." />}
      <BookingFormModal open={createOpen || Boolean(editing)} booking={editing} onClose={() => { setCreateOpen(false); setEditing(null); }} />
    </div>
  );
}
function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: 'warning' | 'primary' | 'success' }) { const classes = tone === 'warning' ? 'bg-amber-50 text-amber-700' : tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'; return <Card className="flex items-center gap-4 p-5"><span className={`grid h-11 w-11 place-items-center rounded-xl ${classes}`}>{icon}</span><div><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div></Card>; }
