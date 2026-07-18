'use client';

import { useMemo, useState } from 'react';
import { Edit3, MapPinned, Plus, TableProperties, Trash2, Users } from 'lucide-react';
import type { PreferredTable } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { TableFormModal } from '../forms/TableFormModal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { formatVnd } from '../utils';

export function TablesPage() {
  const { venues, reservations, searchQuery, saveVenue } = useAdminData();
  const [venueId, setVenueId] = useState(venues[0]?.id || '');
  const activeVenue = venues.find((item) => item.id === venueId) || venues[0] || null;
  const [editing, setEditing] = useState<PreferredTable | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PreferredTable | null>(null);

  const tables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (activeVenue?.preferredTables || []).filter((table) => !q || [table.name, table.area, table.description, table.status].join(' ').toLowerCase().includes(q)).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [activeVenue, searchQuery]);

  const deleteTable = async () => {
    if (!activeVenue || !deleteTarget) return;
    if (reservations.some((booking) => booking.venueId === activeVenue.id && booking.preferredTableId === deleteTarget.id)) return;
    try { await saveVenue({ ...activeVenue, preferredTables: activeVenue.preferredTables.filter((item) => item.id !== deleteTarget.id) }); } catch { /* toast handled by provider */ }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Quản lý bàn" description="Quản lý nhanh từng bàn. Sơ đồ nâng cao nằm trong màn chỉnh sửa địa điểm." actions={<Button disabled={!activeVenue} onClick={() => setCreateOpen(true)}><Plus size={18} />Thêm bàn</Button>} />
      <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Địa điểm</label><select value={activeVenue?.id || ''} onChange={(event) => setVenueId(event.target.value)} className="h-11 min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold outline-none focus:border-[#1F3A8A]">{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select><div className="sm:ml-auto flex items-center gap-4 text-xs font-bold text-slate-500"><span>{tables.length} bàn</span><span>{activeVenue?.tableZones?.length || 0} khu</span></div></Card>
      {activeVenue && tables.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{tables.map((table) => {
        const used = reservations.filter((booking) => booking.venueId === activeVenue.id && booking.preferredTableId === table.id).length;
        const status = table.status || 'AVAILABLE';
        return <Card key={table.id} className="relative overflow-hidden p-5"><div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: table.color || '#1F3A8A' }} /><div className="flex items-start justify-between pl-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{table.area || 'Chưa phân khu'}</p><h3 className="mt-1 text-2xl font-black text-slate-950">{table.name}</h3></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : status === 'RESERVED' ? 'bg-red-50 text-red-700' : status === 'HIDDEN' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>{status === 'AVAILABLE' ? 'Sẵn sàng' : status === 'RESERVED' ? 'Đã giữ' : status === 'HIDDEN' ? 'Đang ẩn' : 'Liên hệ'}</span></div><div className="mt-5 space-y-3 pl-2"><Row icon={<Users size={16} />} label="Sức chứa" value={`${table.capacity} khách`} /><Row icon={<TableProperties size={16} />} label="Minimum spend" value={formatVnd(table.minimumSpend)} /><Row icon={<MapPinned size={16} />} label="Booking" value={`${used} lượt`} /></div><p className="mt-4 line-clamp-2 min-h-10 pl-2 text-xs font-medium leading-5 text-slate-500">{table.description || 'Chưa có mô tả bàn.'}</p><div className="mt-5 flex gap-2 pl-2"><Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(table)}><Edit3 size={15} />Sửa</Button><button onClick={() => setDeleteTarget(table)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div></Card>;
      })}</div> : <EmptyState icon={TableProperties} title={activeVenue ? 'Địa điểm chưa có bàn' : 'Chưa có địa điểm'} description={activeVenue ? 'Thêm bàn mới hoặc mở chỉnh sửa địa điểm để xây dựng sơ đồ đầy đủ.' : 'Hãy tạo địa điểm trước khi quản lý bàn.'} action={activeVenue ? <Button onClick={() => setCreateOpen(true)}><Plus size={18} />Thêm bàn</Button> : undefined} />}
      <TableFormModal open={createOpen || Boolean(editing)} venue={activeVenue} table={editing} onClose={() => { setCreateOpen(false); setEditing(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa bàn?" description={`Bàn ${deleteTarget?.name || ''} sẽ bị xóa. Nếu bàn đã có booking, thao tác sẽ không được thực hiện.`} confirmLabel="Xóa bàn" onClose={() => setDeleteTarget(null)} onConfirm={deleteTable} />
    </div>
  );
}
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 text-xs"><span className="text-[#1F3A8A]">{icon}</span><span className="flex-1 font-semibold text-slate-500">{label}</span><span className="font-extrabold text-slate-800">{value}</span></div>; }
