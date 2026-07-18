'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, LayoutTemplate, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react';
import type { Venue, VenueFloorPlanTheme } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { slugId } from '../utils';
import { Button } from '../ui/Button';
import { FormField, inputClass, textareaClass } from '../ui/FormField';
import { Modal } from '../ui/Modal';

const defaultTheme: VenueFloorPlanTheme = {
  style: 'NIGHTCLUB', ratio: 'PORTRAIT', backgroundColor: '#070A12', accentColor: '#D6A85F',
  surfaceColor: '#111827', gridColor: 'rgba(255,255,255,0.055)', texture: 'GRID', showGrid: true,
  helperText: 'Chọn khu hoặc bàn để xem chi tiết.',
};

function emptyVenue(): Venue {
  return {
    id: slugId('venue'), name: '', category: 'Nightclub', location: '', shortDescription: '', longDescription: '',
    image: '', images: [], videoUrl: '', menuUrl: '', menuPdfUrl: '', openingHours: { open: '20:00', close: '03:00', label: '20:00 - 03:00' },
    viewCount: 0, floorPlanTheme: defaultTheme, floorPlanElements: [], tableZones: [], preferredTables: [], rating: 5, reviewsCount: 0,
  };
}

export function VenueFormModal({ open, venue, onClose }: { open: boolean; venue?: Venue | null; onClose: () => void }) {
  const router = useRouter();
  const { saveVenue, uploadMedia, saving, showToast } = useAdminData();
  const [draft, setDraft] = useState<Venue>(emptyVenue());
  const [uploading, setUploading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const base = venue ? structuredClone(venue) : emptyVenue();
    base.images = Array.from(new Set([base.image, ...(base.images || [])].filter(Boolean)));
    base.floorPlanTheme ||= defaultTheme;
    base.floorPlanElements ||= [];
    base.tableZones ||= [];
    base.preferredTables ||= [];
    // Reset the editable form whenever a different record is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(base);
  }, [open, venue]);

  const primaryImage = draft.image || draft.images[0] || '';
  const openingLabel = useMemo(() => `${draft.openingHours?.open || '20:00'} - ${draft.openingHours?.close || '03:00'}`, [draft.openingHours?.close, draft.openingHours?.open]);

  const uploadImages = async (files: FileList | null) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    setUploading(true);
    try {
      const uploads = [];
      for (const file of selected) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} không phải file ảnh.`);
        uploads.push(await uploadMedia(file, 'venues'));
      }
      const urls = uploads.map((item) => item.url);
      setDraft((current) => ({ ...current, image: current.image || urls[0], images: Array.from(new Set([...current.images, ...urls])) }));
      showToast('success', `Đã tải lên ${urls.length} ảnh.`);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Upload ảnh thất bại.');
    } finally {
      setUploading(false);
      if (imageInput.current) imageInput.current.value = '';
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.name.trim().length < 2) return showToast('error', 'Vui lòng nhập tên địa điểm.');
    if (draft.location.trim().length < 3) return showToast('error', 'Vui lòng nhập địa chỉ địa điểm.');
    const images = Array.from(new Set([draft.image, ...draft.images].filter(Boolean)));
    try {
      await saveVenue({
        ...draft,
        name: draft.name.trim(),
        location: draft.location.trim(),
        shortDescription: draft.shortDescription.trim(),
        longDescription: draft.longDescription.trim(),
        image: images[0] || '/about.jpg',
        images,
        openingHours: { open: draft.openingHours?.open || '20:00', close: draft.openingHours?.close || '03:00', label: openingLabel },
      });
      onClose();
    } catch {
      // Provider displays the validation or synchronization error.
    }
  };


  return (
    <>
      <Modal open={open} title={venue ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm'} description="Thông tin hiển thị ở website người dùng và toàn bộ quy trình booking." onClose={onClose} size="xl" footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="venue-form" disabled={saving || uploading}>{saving ? 'Đang lưu...' : 'Lưu địa điểm'}</Button></>}>
        <form id="venue-form" onSubmit={submit} className="space-y-7">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Tên địa điểm" required><input className={inputClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="ADM Club" /></FormField>
            <FormField label="Loại hình"><select className={inputClass} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Venue['category'] })}><option>Nightclub</option><option>Karaoke</option></select></FormField>
            <FormField label="Địa chỉ" required className="md:col-span-2"><input className={inputClass} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></FormField>
            <FormField label="Mở cửa"><input type="time" className={inputClass} value={draft.openingHours?.open || '20:00'} onChange={(event) => setDraft({ ...draft, openingHours: { ...(draft.openingHours || { close: '03:00' }), open: event.target.value } })} /></FormField>
            <FormField label="Đóng cửa"><input type="time" className={inputClass} value={draft.openingHours?.close || '03:00'} onChange={(event) => setDraft({ ...draft, openingHours: { ...(draft.openingHours || { open: '20:00' }), close: event.target.value } })} /></FormField>
            <FormField label="Mô tả ngắn" className="md:col-span-2"><textarea className={textareaClass} value={draft.shortDescription} onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })} /></FormField>
            <FormField label="Mô tả chi tiết" className="md:col-span-2"><textarea className={`${textareaClass} min-h-36`} value={draft.longDescription} onChange={(event) => setDraft({ ...draft, longDescription: event.target.value })} /></FormField>
            <FormField label="Video URL"><input className={inputClass} value={draft.videoUrl || ''} onChange={(event) => setDraft({ ...draft, videoUrl: event.target.value })} placeholder="https://.../venue.mp4" /></FormField>
            <FormField label="Menu text / URL"><input className={inputClass} value={draft.menuUrl || ''} onChange={(event) => setDraft({ ...draft, menuUrl: event.target.value })} /></FormField>
            <FormField label="Menu PDF URL"><input className={inputClass} value={draft.menuPdfUrl || ''} onChange={(event) => setDraft({ ...draft, menuPdfUrl: event.target.value })} /></FormField>
            <FormField label="Lượt xem"><input type="number" min={0} className={inputClass} value={draft.viewCount || 0} onChange={(event) => setDraft({ ...draft, viewCount: Number(event.target.value) })} /></FormField>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-extrabold text-slate-900">Hình ảnh địa điểm</h3><p className="mt-1 text-xs font-medium text-slate-500">Ảnh đầu tiên là ảnh đại diện. Có thể thêm URL hoặc upload trực tiếp.</p></div>
              <Button variant="outline" size="sm" onClick={() => imageInput.current?.click()} disabled={uploading}>{uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}{uploading ? 'Đang tải...' : 'Upload ảnh'}</Button>
              <input ref={imageInput} type="file" accept="image/*" multiple className="hidden" onChange={(event) => uploadImages(event.target.files)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {draft.images.map((url, index) => (
                <div key={`${url}-${index}`} className={`group relative aspect-[16/10] overflow-hidden rounded-xl border-2 bg-white ${url === primaryImage ? 'border-[#1F3A8A]' : 'border-transparent'}`}>
                  <img src={url} alt={`Ảnh ${index + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-slate-950/75 p-2 transition group-hover:translate-y-0">
                    <button type="button" onClick={() => setDraft({ ...draft, image: url })} className="text-[10px] font-bold text-white">Đặt làm ảnh chính</button>
                    <button type="button" onClick={() => {
                      const images = draft.images.filter((item) => item !== url);
                      setDraft({ ...draft, images, image: draft.image === url ? images[0] || '' : draft.image });
                    }} className="grid h-7 w-7 place-items-center rounded-lg bg-red-500 text-white"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => {
                const url = window.prompt('Dán URL ảnh địa điểm');
                if (url?.trim()) setDraft({ ...draft, image: draft.image || url.trim(), images: Array.from(new Set([...draft.images, url.trim()])) });
              }} className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-500 transition hover:border-[#1F3A8A] hover:text-[#1F3A8A]"><ImagePlus size={24} /><span className="mt-2 text-xs font-bold">Thêm URL ảnh</span></button>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-[#D9DFF5] bg-[#D9DFF5]/35 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1F3A8A] text-white"><LayoutTemplate size={21} /></span><div><h3 className="font-extrabold text-slate-900">Sơ đồ khu & bàn</h3><p className="mt-1 text-xs font-medium text-slate-500">{draft.tableZones?.length || 0} khu · {draft.preferredTables.length} bàn · {draft.floorPlanElements?.length || 0} thành phần sơ đồ</p></div></div>
            <Button variant="outline" disabled={!venue} onClick={() => { if (!venue) return; onClose(); router.push(`/admin/venues/${encodeURIComponent(venue.id)}/layout`); }}><Plus size={17} />Mở trang sơ đồ bàn</Button>
          </section>
        </form>
      </Modal>

    </>
  );
}
