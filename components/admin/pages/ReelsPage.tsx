'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp, Edit3, Film, AtSign, Plus, Power, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { HomepageReel, Venue } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';

type ReelItem = { reel: HomepageReel; venue: Venue };

export function ReelsPage() {
  const { venues, searchQuery, saveVenue } = useAdminData();
  const [deleteTarget, setDeleteTarget] = useState<ReelItem | null>(null);
  const [visibility, setVisibility] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');
  const reels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.flatMap((venue) => (venue.reels || []).map((reel) => ({ reel, venue })))
      .filter(({ reel }) => visibility === 'ALL' || (visibility === 'ACTIVE' ? reel.isActive : !reel.isActive))
      .filter(({ reel, venue }) => !q || [reel.title, reel.caption, reel.tag, venue.name].join(' ').toLowerCase().includes(q))
      .sort((a, b) => Number(a.reel.order || 0) - Number(b.reel.order || 0));
  }, [searchQuery, venues, visibility]);

  const updateReel = async (item: ReelItem, patch: Partial<HomepageReel>) => {
    try { await saveVenue({ ...item.venue, reels: (item.venue.reels || []).map((reel) => reel.id === item.reel.id ? { ...reel, ...patch } : reel) }); } catch { /* toast handled by provider */ }
  };

  const move = async (item: ReelItem, direction: -1 | 1) => {
    const list = [...(item.venue.reels || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const index = list.findIndex((reel) => reel.id === item.reel.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    try { await saveVenue({ ...item.venue, reels: list.map((reel, order) => ({ ...reel, order })) }); } catch { /* toast handled by provider */ }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try { await saveVenue({ ...deleteTarget.venue, reels: (deleteTarget.venue.reels || []).filter((reel) => reel.id !== deleteTarget.reel.id) }); } catch { /* toast handled by provider */ }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Quản lý Reels" description={`${reels.length} nội dung video ngắn trên toàn hệ thống`} actions={<Link href="/admin/reels/new"><Button><Plus size={18} />Thêm Reel</Button></Link>} />
      <div className="mb-5 inline-flex rounded-xl bg-slate-100 p-1">{([['ALL','Tất cả'],['ACTIVE','Đang hiển thị'],['HIDDEN','Đang ẩn']] as const).map(([value,label]) => <button key={value} onClick={() => setVisibility(value)} className={`rounded-lg px-4 py-2 text-xs font-black transition ${visibility === value ? 'bg-white text-[#1F3A8A] shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</div>
      {reels.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{reels.map((item) => {
        const { reel, venue } = item;
        const media = reel.posterUrl || venue.image;
        return <Card key={`${venue.id}-${reel.id}`} className="group overflow-hidden rounded-[28px] p-0">
          <div className="relative m-3 mb-0 aspect-[9/14] overflow-hidden rounded-[22px] bg-slate-950">
            {reel.videoUrl && /\.(mp4|webm|mov)(\?|$)/i.test(reel.videoUrl) ? <video src={reel.videoUrl} poster={media} muted playsInline preload="none" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" /> : <img src={media || '/about.jpg'} alt={reel.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
            <div className="absolute left-3 top-3 flex gap-2"><Badge tone={reel.isActive ? 'success' : 'neutral'}>{reel.isActive ? 'Đang hiển thị' : 'Đang ẩn'}</Badge><Badge tone="primary">{reel.placement === 'HOME_HOST' ? 'Host' : 'Feed'}</Badge></div>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-wider text-white/65">{venue.name}</p><h3 className="mt-1 line-clamp-2 text-lg font-black">{reel.title || 'Reel chưa đặt tên'}</h3><p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-white/70">{reel.caption}</p></div>
          </div>
          <div className="flex items-center gap-1 p-3.5">
            <button onClick={() => move(item, -1)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Di chuyển lên"><ChevronUp size={17} /></button>
            <button onClick={() => move(item, 1)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Di chuyển xuống"><ChevronDown size={17} /></button>
            {reel.instagramUrl ? <a href={reel.instagramUrl} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-pink-50 hover:text-pink-600"><AtSign size={17} /></a> : null}
            <button onClick={() => updateReel(item, { isActive: !reel.isActive })} className={`grid h-9 w-9 place-items-center rounded-lg ${reel.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`} aria-label="Bật tắt"><Power size={17} /></button>
            <div className="flex-1" />
            <Link href={`/admin/reels/new?id=${encodeURIComponent(reel.id)}&venueId=${encodeURIComponent(venue.id)}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Edit3 size={17} /></Link>
            <button onClick={() => setDeleteTarget(item)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
          </div>
        </Card>;
      })}</div> : <EmptyState icon={Film} title="Chưa có Reel" description="Tạo video ngắn đầu tiên và gắn trực tiếp với một địa điểm có sẵn." action={<Link href="/admin/reels/new"><Button><Plus size={18} />Tạo Reel</Button></Link>} />}
      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa Reel?" description={`Reel “${deleteTarget?.reel.title || ''}” sẽ không còn hiển thị trên homepage.`} confirmLabel="Xóa Reel" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </div>
  );
}
