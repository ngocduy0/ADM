'use client';

import Link from 'next/link';
import { Bell, CheckCheck, Circle, ExternalLink, Mail } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { Pagination } from '../ui/Pagination';
import { formatDateTime } from '../utils';
import { getNotificationHref, isContactNotification } from '../notification-utils';

const PAGE_SIZE = 20;

export function NotificationsPage() {
  const { notifications, unreadCount, markNotificationsRead, searchQuery } = useAdminData();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((notice) => (filter === 'ALL' || !notice.read) && (!q || [notice.title, notice.message].join(' ').toLowerCase().includes(q)));
  }, [filter, notifications, searchQuery]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setPage(1), [filter, searchQuery]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="pb-10">
      <PageHeader title="Thông báo" description={`${unreadCount} thông báo chưa đọc`} actions={unreadCount ? <Button variant="secondary" onClick={() => markNotificationsRead()}><CheckCheck size={18} />Đánh dấu tất cả đã đọc</Button> : undefined} />
      <Card className="mb-5 flex gap-2 p-2"><button onClick={() => setFilter('ALL')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black ${filter === 'ALL' ? 'bg-[#1F3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Tất cả ({notifications.length})</button><button onClick={() => setFilter('UNREAD')} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-black ${filter === 'UNREAD' ? 'bg-[#1F3A8A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Chưa đọc ({unreadCount})</button></Card>
      {rows.length ? (
        <>
          <Card className="overflow-hidden p-0"><div className="divide-y divide-slate-100">{rows.map((notice) => {
            const contactNotice = isContactNotification(notice);
            return <Link key={notice.id} href={getNotificationHref(notice)} onClick={() => markNotificationsRead([notice.id])} className={`flex gap-4 p-5 transition hover:bg-slate-50 ${notice.read ? '' : 'bg-[#1F3A8A]/[0.025]'}`}><span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: notice.tableColor || '#1F3A8A' }}>{contactNotice ? <Mail size={21} /> : <Bell size={21} />}{!notice.read ? <Circle size={10} fill="white" className="absolute right-1.5 top-1.5" /> : null}</span><span className="min-w-0 flex-1"><span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><span><span className="block font-black text-slate-950">{notice.title}</span><span className="mt-1 block whitespace-pre-line text-sm font-medium leading-6 text-slate-500">{notice.message}</span><span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">{formatDateTime(notice.createdAt)}</span></span><span className="flex shrink-0 items-center gap-1 text-xs font-black text-[#1F3A8A]">{contactNotice ? 'Mở yêu cầu' : 'Mở booking'} <ExternalLink size={13} /></span></span></span></Link>;
          })}</div></Card>
          <Pagination page={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="thông báo" />
        </>
      ) : <EmptyState icon={Bell} title="Không có thông báo" description="Booking mới và yêu cầu liên hệ trực tiếp sẽ xuất hiện tại đây." />}
    </div>
  );
}
