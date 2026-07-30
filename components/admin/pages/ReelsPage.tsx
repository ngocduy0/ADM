'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp, Edit3, Film, AtSign, Plus, Power, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { HomepageReel, Venue } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { Pagination } from '../ui/Pagination';

type ReelItem = { reel: HomepageReel; venue: Venue };
const PAGE_SIZE = 12;


export function ReelsPage() {
  const { venues, searchQuery, saveVenueReels, reorderReels, deleteMedia } = useAdminData();
  const [deleteTarget, setDeleteTarget] = useState<ReelItem | null>(null);
  const [visibility, setVisibility] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');
  const [page, setPage] = useState(1);
  const allReels = useMemo(() => venues
    .flatMap((venue) => (venue.reels || []).map((reel) => ({ reel, venue })))
    .sort((a, b) => Number(a.reel.order ?? 0) - Number(b.reel.order ?? 0)), [venues]);
  const totalReelCount = allReels.length;
  const reels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allReels
      .filter(({ reel }) => visibility === 'ALL' || (visibility === 'ACTIVE' ? reel.isActive : !reel.isActive))
      .filter(({ reel, venue }) => !q || [reel.title, reel.caption, reel.tag, venue.name].join(' ').toLowerCase().includes(q));
  }, [allReels, searchQuery, visibility]);
  const totalPages = Math.max(1, Math.ceil(reels.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = reels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setPage(1), [searchQuery, visibility]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateReel = async (item: ReelItem, patch: Partial<HomepageReel>) => {
    try { await saveVenueReels(item.venue.id, (item.venue.reels || []).map((reel) => reel.id === item.reel.id ? { ...reel, ...patch } : reel)); } catch { /* toast handled by provider */ }
  };

  const move = async (item: ReelItem, direction: -1 | 1) => {
    const ordered = allReels.map(({ reel, venue }) => ({ venueId: venue.id, reelId: reel.id }));
    const index = ordered.findIndex((entry) => entry.venueId === item.venue.id && entry.reelId === item.reel.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    try { await reorderReels(ordered); } catch { /* toast handled by provider */ }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await saveVenueReels(deleteTarget.venue.id, (deleteTarget.venue.reels || []).filter((reel) => reel.id !== deleteTarget.reel.id));
      await Promise.allSettled([
        deleteMedia(deleteTarget.reel.videoPath),
        deleteMedia(deleteTarget.reel.posterPath),
      ]);
    } catch { /* toast handled by provider */ }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Quản lý Reels" description={`${totalReelCount}/10 reels trên toàn hệ thống${reels.length !== totalReelCount ? ` · ${reels.length} kết quả đang lọc` : ''}`} actions={totalReelCount < 10 ? <Link href="/admin/reels/new"><Button><Plus size={18} />Thêm Reel</Button></Link> : <Button disabled title="Hệ thống đã đạt giới hạn 10 reels"><Plus size={18} />Đã đủ 10 Reels</Button>} />
      <div className="mb-5 inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1">{([['ALL','Tất cả'],['ACTIVE','Đang hiển thị'],['HIDDEN','Đang ẩn']] as const).map(([value,label]) => <button key={value} onClick={() => setVisibility(value)} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-black transition ${visibility === value ? 'bg-white text-[#1F3A8A] shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</div>
      {rows.length ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{rows.map((item) => {
            const { reel, venue } = item;
            const media = reel.posterUrl || venue.image;
            const globalIndex = allReels.findIndex((entry) => entry.venue.id === venue.id && entry.reel.id === reel.id);
            return <Card key={`${venue.id}-${reel.id}`} className="group overflow-hidden rounded-[28px] p-0">
              <div className="relative m-3 mb-0 aspect-[9/14] overflow-hidden rounded-[22px] bg-slate-950">
                <img src={media || '/about.jpg'} alt={reel.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
                {reel.videoUrl ? <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur"><Film size={16} /></span> : null}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
                <div className="pointer-events-none absolute left-3 top-3 flex gap-2"><Badge tone={reel.isActive ? 'success' : 'neutral'}>{reel.isActive ? 'Đang hiển thị' : 'Đang ẩn'}</Badge><Badge tone="primary">{reel.placement === 'HOME_HOST' ? 'Host' : 'Feed'}</Badge></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-wider text-white/65">{venue.name}</p><h3 className="mt-1 line-clamp-2 text-lg font-black">{reel.title || 'Reel chưa đặt tên'}</h3><p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-white/70">{reel.caption}</p></div>
              </div>
              <div className="flex items-center gap-1 p-3.5">
                <button onClick={() => move(item, -1)} disabled={globalIndex <= 0} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Di chuyển lên"><ChevronUp size={17} /></button>
                <button onClick={() => move(item, 1)} disabled={globalIndex < 0 || globalIndex >= allReels.length - 1} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Di chuyển xuống"><ChevronDown size={17} /></button>
                <a href={reel.instagramUrl || 'https://www.instagram.com/duytadm/'} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-pink-50 hover:text-pink-600" title={reel.instagramUrl ? 'Mở Reel Instagram' : 'Mở Instagram @duytadm'}><AtSign size={17} /></a>
                <button onClick={() => updateReel(item, { isActive: !reel.isActive })} className={`grid h-9 w-9 place-items-center rounded-lg ${reel.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`} aria-label="Bật tắt"><Power size={17} /></button>
                <div className="flex-1" />
                <Link href={`/admin/reels/new?id=${encodeURIComponent(reel.id)}&venueId=${encodeURIComponent(venue.id)}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Edit3 size={17} /></Link>
                <button onClick={() => setDeleteTarget(item)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
              </div>
            </Card>;
          })}</div>
          <Pagination page={currentPage} totalItems={reels.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="Reel" />
        </>
      ) : <EmptyState icon={Film} title="Chưa có Reel" description="Tạo video ngắn đầu tiên và gắn trực tiếp với một địa điểm có sẵn." action={<Link href="/admin/reels/new"><Button><Plus size={18} />Tạo Reel</Button></Link>} />}
      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa Reel?" description={`Reel “${deleteTarget?.reel.title || ''}” và media Cloudinary liên quan sẽ bị xóa.`} confirmLabel="Xóa Reel" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </div>
  );
}
