'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BedDouble, Clock, Edit3, Eye, Grid3X3, MapPin, Plus, Star, Trash2, Users } from 'lucide-react';
import type { Venue } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { VenueFormModal } from '../forms/VenueFormModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { formatCompact } from '../utils';

export function VenuesPage() {
  const { venues, reservations, searchQuery, deleteVenue } = useAdminData();
  const [editing, setEditing] = useState<Venue | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.filter((item) => !q || [item.name, item.location, item.category, item.shortDescription].join(' ').toLowerCase().includes(q));
  }, [searchQuery, venues]);

  const totalViews = venues.reduce((sum, venue) => sum + Number(venue.viewCount || 0), 0);
  const avgRating = venues.length ? venues.reduce((sum, venue) => sum + Number(venue.rating || 0), 0) / venues.length : 0;

  return (
    <div className="pb-10">
      <PageHeader title="Quản lý địa điểm" description="Quản lý và cập nhật danh sách club, lounge, nhà hàng hoặc phòng karaoke." actions={<Button onClick={() => setCreateOpen(true)}><Plus size={18} />Tạo địa điểm mới</Button>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary icon={<MapPin size={20} />} label="Tổng địa điểm" value={String(venues.length)} />
        <Summary icon={<Eye size={20} />} label="Lượt xem tháng" value={formatCompact(totalViews)} tone="green" />
        <Summary icon={<Star size={20} />} label="Đánh giá TB" value={avgRating.toFixed(1)} tone="amber" />
        <Summary icon={<Grid3X3 size={20} />} label="Sức chứa tối đa" value={String(venues.reduce((sum, venue) => sum + venue.preferredTables.reduce((a, table) => a + Number(table.capacity || 0), 0), 0))} tone="brown" />
      </div>

      {filtered.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((venue) => {
        const bookings = reservations.filter((item) => item.venueId === venue.id);
        const capacity = venue.preferredTables.reduce((sum, table) => sum + Number(table.capacity || 0), 0);
        return <Card key={venue.id} className="group overflow-hidden rounded-[28px] p-0">
          <div className="relative m-3 mb-0 aspect-[16/10] overflow-hidden rounded-[22px] bg-slate-100">
            <img src={venue.image || '/about.jpg'} alt={venue.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <Badge tone="primary" className="border border-white/25 bg-white/90 text-[#1F3A8A] shadow-sm backdrop-blur">{venue.category === 'Nightclub' ? 'Nightclub' : 'Karaoke'}</Badge>
              <span className="rounded-full bg-slate-950/65 px-2.5 py-1 text-[9px] font-black text-white backdrop-blur">{formatCompact(Number(venue.viewCount || 0))} lượt xem</span>
            </div>
          </div>

          <div className="p-4 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h3 className="truncate text-lg font-black text-slate-950">{venue.name}</h3><p className="mt-1 flex items-center gap-1.5 truncate text-[11px] font-semibold text-slate-500"><MapPin size={12} />{venue.location}</p></div>
              <div className="flex shrink-0 items-center gap-1 text-xs font-black text-amber-500"><Star size={14} fill="currentColor" />{Number(venue.rating || 0).toFixed(1)} <span className="text-[9px] text-slate-400">({venue.reviewsCount || 0})</span></div>
            </div>
            <p className="mt-3 line-clamp-2 min-h-10 text-xs font-medium leading-5 text-slate-500">{venue.shortDescription}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-2"><Grid3X3 size={16} className="text-slate-400" /><div><p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Sức chứa</p><p className="mt-0.5 text-xs font-black">{capacity} khách</p></div></div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-slate-400" /><div><p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Giờ mở cửa</p><p className="mt-0.5 truncate text-xs font-black">{venue.openingHours?.label || `${venue.openingHours?.open || '—'} – ${venue.openingHours?.close || '—'}`}</p></div></div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-[11px] font-bold text-slate-500"><span className="flex items-center gap-1.5"><BedDouble size={14} />{venue.preferredTables.length} bàn</span><span className="flex items-center gap-1.5"><Users size={14} />{bookings.length} booking</span></div>
            <div className="mt-4 grid grid-cols-[1fr_1fr_42px] gap-2">
              <Button variant="secondary" className="rounded-2xl" onClick={() => setEditing(venue)}><Edit3 size={15} />Sửa</Button>
              <Link href={`/admin/venues/${encodeURIComponent(venue.id)}/layout`}><Button variant="secondary" className="w-full rounded-2xl"><Grid3X3 size={15} />Sơ đồ</Button></Link>
              <button onClick={() => setDeleteTarget(venue)} className="grid h-11 place-items-center rounded-2xl bg-red-50 text-red-500 transition hover:bg-red-100"><Trash2 size={16} /></button>
            </div>
          </div>
        </Card>;
      })}</div> : <EmptyState icon={MapPin} title="Chưa có địa điểm" description="Thêm địa điểm đầu tiên để bắt đầu nhận booking." action={<Button onClick={() => setCreateOpen(true)}><Plus size={18} />Thêm địa điểm</Button>} />}

      <VenueFormModal open={createOpen || Boolean(editing)} venue={editing} onClose={() => { setCreateOpen(false); setEditing(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa địa điểm?" description={`${deleteTarget?.name || 'Địa điểm'} và toàn bộ sơ đồ bàn, reels liên quan sẽ bị xóa. Địa điểm có booking sẽ không thể xóa.`} confirmLabel="Xóa địa điểm" onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteVenue(deleteTarget.id)} />
    </div>
  );
}

function Summary({ icon, label, value, tone = 'blue' }: { icon: React.ReactNode; label: string; value: string; tone?: 'blue' | 'green' | 'amber' | 'brown' }) {
  const tones = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', brown: 'bg-orange-50 text-orange-700' };
  return <Card className="flex items-center gap-4 rounded-[22px] p-4"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}>{icon}</span><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div></Card>;
}
