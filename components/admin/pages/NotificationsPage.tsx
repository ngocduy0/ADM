'use client';

import Link from 'next/link';
import { Bell, CheckCheck, Circle, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { formatDateTime } from '../utils';

export function NotificationsPage() {
  const { notifications, unreadCount, markNotificationsRead, searchQuery } = useAdminData();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((notice) => (filter === 'ALL' || !notice.read) && (!q || [notice.title, notice.message].join(' ').toLowerCase().includes(q)));
  }, [filter, notifications, searchQuery]);

  return (
    <div className="pb-10">
      <PageHeader title="Thông báo" description={`${unreadCount} thông báo chưa đọc`} actions={unreadCount ? <Button variant="secondary" onClick={() => markNotificationsRead()}><CheckCheck size={18} />Đánh dấu tất cả đã đọc</Button> : undefined} />
      <Card className="mb-5 flex gap-2 p-2"><button onClick={() => setFilter('ALL')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black ${filter === 'ALL' ? 'bg-[#1F3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Tất cả ({notifications.length})</button><button onClick={() => setFilter('UNREAD')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black ${filter === 'UNREAD' ? 'bg-[#1F3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Chưa đọc ({unreadCount})</button></Card>
      {rows.length ? <Card className="overflow-hidden p-0"><div className="divide-y divide-slate-100">{rows.map((notice) => <Link key={notice.id} href={`/admin/bookings?bookingId=${encodeURIComponent(notice.reservationId)}`} onClick={() => markNotificationsRead([notice.id])} className={`flex gap-4 p-5 transition hover:bg-slate-50 ${notice.read ? '' : 'bg-[#1F3A8A]/[0.025]'}`}><span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: notice.tableColor || '#1F3A8A' }}><Bell size={21} />{!notice.read ? <Circle size={10} fill="white" className="absolute right-1.5 top-1.5" /> : null}</span><span className="min-w-0 flex-1"><span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><span><span className="block font-black text-slate-950">{notice.title}</span><span className="mt-1 block text-sm font-medium leading-6 text-slate-500">{notice.message}</span><span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">{formatDateTime(notice.createdAt)}</span></span><span className="flex shrink-0 items-center gap-1 text-xs font-black text-[#1F3A8A]">Mở booking <ExternalLink size={13} /></span></span></span></Link>)}</div></Card> : <EmptyState icon={Bell} title="Không có thông báo" description="Thông báo booking realtime sẽ xuất hiện tại đây." />}
    </div>
  );
}
