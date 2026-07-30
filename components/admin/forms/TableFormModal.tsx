'use client';

import React, { useEffect, useState } from 'react';
import type { PreferredTable, Venue } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { slugId } from '../utils';
import { Button } from '../ui/Button';
import { FormField, inputClass, textareaClass } from '../ui/FormField';
import { Modal } from '../ui/Modal';

export function TableFormModal({ open, venue, table, onClose }: { open: boolean; venue: Venue | null; table?: PreferredTable | null; onClose: () => void }) {
  const { saveVenue, saving, showToast } = useAdminData();
  const [draft, setDraft] = useState<PreferredTable>({
    id: '', name: '', area: '', minimumSpend: 0, capacity: 4, description: '', status: 'AVAILABLE', shape: 'RECT', bookingMode: 'REQUEST', color: '#1F3A8A', badge: 'NONE', sortOrder: 1,
  });

  useEffect(() => {
    if (!open) return;
    // Reset the editable form whenever a different record is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(table ? { ...table } : {
      id: slugId('table'), name: '', area: venue?.tableZones?.[0]?.label || '', zoneId: venue?.tableZones?.[0]?.id,
      minimumSpend: venue?.tableZones?.[0]?.minimumSpend || 3000000, capacity: venue?.tableZones?.[0]?.capacity || 4,
      description: '', status: 'AVAILABLE', shape: 'RECT', bookingMode: 'REQUEST', color: venue?.tableZones?.[0]?.color || '#1F3A8A', badge: 'NONE', sortOrder: (venue?.preferredTables.length || 0) + 1,
    });
  }, [open, table, venue]);

  if (!venue) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return showToast('error', 'Vui lòng nhập tên hoặc số bàn.');
    if (!draft.area.trim()) return showToast('error', 'Vui lòng nhập khu vực hiển thị.');
    if (!Number.isInteger(draft.capacity) || draft.capacity < 1 || draft.capacity > 200) return showToast('error', 'Sức chứa phải là số nguyên từ 1 đến 200.');
    if (!Number.isFinite(draft.minimumSpend) || draft.minimumSpend < 0) return showToast('error', 'Minimum spend không được âm.');
    const duplicateName = venue.preferredTables.some((item) => item.id !== draft.id && item.name.trim().toLowerCase() === draft.name.trim().toLowerCase());
    if (duplicateName) return showToast('error', 'Tên/số bàn đã tồn tại trong địa điểm này.');
    const normalized = { ...draft, name: draft.name.trim(), area: draft.area.trim(), description: draft.description.trim() };
    const exists = venue.preferredTables.some((item) => item.id === draft.id);
    const preferredTables = exists ? venue.preferredTables.map((item) => item.id === draft.id ? normalized : item) : [...venue.preferredTables, normalized];
    try {
      await saveVenue({ ...venue, preferredTables });
      onClose();
    } catch {
      // Provider displays the validation or synchronization error.
    }
  };

  return (
    <Modal open={open} title={table ? `Chỉnh sửa bàn ${table.name}` : `Thêm bàn · ${venue.name}`} description="Thông tin bàn sẽ hiển thị trong form đặt chỗ và sơ đồ quản lý." onClose={onClose} size="lg" footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="table-form" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu bàn'}</Button></>}>
      <form id="table-form" onSubmit={submit} className="grid gap-5 md:grid-cols-2">
        <FormField label="Tên / số bàn" required><input className={inputClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="V01" /></FormField>
        <FormField label="Khu vực"><select className={inputClass} value={draft.zoneId || ''} onChange={(event) => {
          const zone = venue.tableZones?.find((item) => item.id === event.target.value);
          setDraft({ ...draft, zoneId: zone?.id, area: zone?.label || draft.area, color: zone?.color || draft.color, minimumSpend: zone?.minimumSpend || draft.minimumSpend });
        }}><option value="">Khu tự do</option>{venue.tableZones?.map((zone) => <option key={zone.id} value={zone.id}>{zone.label}</option>)}</select></FormField>
        <FormField label="Tên khu hiển thị"><input className={inputClass} value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })} /></FormField>
        <FormField label="Sức chứa"><input type="number" min={1} max={50} className={inputClass} value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) })} /></FormField>
        <FormField label="Minimum spend"><input type="number" min={0} step={100000} className={inputClass} value={draft.minimumSpend} onChange={(event) => setDraft({ ...draft, minimumSpend: Number(event.target.value) })} /></FormField>
        <FormField label="Trạng thái"><select className={inputClass} value={draft.status || 'AVAILABLE'} onChange={(event) => setDraft({ ...draft, status: event.target.value as PreferredTable['status'] })}><option value="AVAILABLE">Sẵn sàng</option><option value="RESERVED">Đã giữ</option><option value="INQUIRY">Cần liên hệ</option><option value="HIDDEN">Ẩn</option></select></FormField>
        <FormField label="Hình dạng"><select className={inputClass} value={draft.shape || 'RECT'} onChange={(event) => setDraft({ ...draft, shape: event.target.value as PreferredTable['shape'] })}><option value="RECT">Chữ nhật</option><option value="ROUND">Tròn</option><option value="SOFA">Sofa</option><option value="BAR">Bar</option></select></FormField>
        <FormField label="Màu bàn"><input type="color" className={`${inputClass} p-1.5`} value={draft.color || '#1F3A8A'} onChange={(event) => setDraft({ ...draft, color: event.target.value })} /></FormField>
        <FormField label="Mô tả" className="md:col-span-2"><textarea className={textareaClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></FormField>
      </form>
    </Modal>
  );
}
