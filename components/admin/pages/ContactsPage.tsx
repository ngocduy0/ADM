'use client';

import { ChevronDown, ChevronUp, ExternalLink, ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ContactChannel, SiteSettings } from '@/components/aurelius/siteSettings';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FormField, inputClass } from '../ui/FormField';
import { PageHeader } from '../ui/PageHeader';
import { slugId } from '../utils';

export function ContactsPage() {
  const { settings, saveSettings, uploadMedia, saving, showToast } = useAdminData();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});


  const setChannels = (channels: ContactChannel[]) => setDraft((current) => ({
    ...current,
    contactChannels: channels.map((item, order) => ({ ...item, order })),
  }));

  const patch = (id: string, next: Partial<ContactChannel>) => {
    setChannels(draft.contactChannels.map((item) => item.id === id ? { ...item, ...next } : item));
  };

  const move = (id: string, direction: -1 | 1) => {
    const items = [...draft.contactChannels];
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    setChannels(items);
  };

  const add = () => {
    const id = slugId('contact');
    setChannels([...draft.contactChannels, {
      id,
      name: 'Kênh liên hệ mới',
      label: '',
      href: 'https://',
      icon: '/brand-icons/email.svg',
      iconPath: '',
      isActive: true,
      order: draft.contactChannels.length,
    }]);
  };

  const uploadIcon = async (channel: ContactChannel, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('error', 'Icon phải là file ảnh hoặc SVG.');
    setUploadingId(channel.id);
    try {
      const uploaded = await uploadMedia(file, `brand/contacts/${channel.id}`, channel.iconPath);
      patch(channel.id, { icon: uploaded.url, iconPath: uploaded.path });
      showToast('success', 'Đã upload icon. Nhấn Lưu thay đổi để áp dụng ra website.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Upload icon thất bại.');
    } finally {
      setUploadingId(null);
      const input = inputRefs.current[channel.id];
      if (input) input.value = '';
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Kênh liên hệ"
        description="Quản lý số điện thoại, mạng xã hội, đường dẫn và icon hiển thị trên website người dùng."
        actions={<Button onClick={() => saveSettings(draft)} disabled={saving || Boolean(uploadingId)}><Save size={18} />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {draft.contactChannels.map((channel, index) => (
            <Card key={channel.id} className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex shrink-0 items-center gap-3 lg:w-44">
                  <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <img src={channel.icon || '/brand-icons/email.svg'} alt={channel.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{channel.name}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Vị trí {index + 1}</p>
                  </div>
                </div>

                <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-2">
                  <FormField label="Tên kênh"><input className={inputClass} value={channel.name} onChange={(event) => patch(channel.id, { name: event.target.value })} /></FormField>
                  <FormField label="Thông tin hiển thị"><input className={inputClass} value={channel.label} onChange={(event) => patch(channel.id, { label: event.target.value })} placeholder="Số điện thoại, username hoặc email" /></FormField>
                  <FormField label="Đường dẫn" className="md:col-span-2"><input className={inputClass} value={channel.href} onChange={(event) => patch(channel.id, { href: event.target.value })} placeholder="https://... hoặc tel: / mailto:" /></FormField>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 lg:w-48 lg:justify-end">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
                    <input type="checkbox" checked={channel.isActive} onChange={(event) => patch(channel.id, { isActive: event.target.checked })} className="h-4 w-4 accent-[#1F3A8A]" /> Hiển thị
                  </label>
                  <button onClick={() => move(channel.id, -1)} disabled={index === 0} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-30"><ChevronUp size={16} /></button>
                  <button onClick={() => move(channel.id, 1)} disabled={index === draft.contactChannels.length - 1} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-30"><ChevronDown size={16} /></button>
                  <button onClick={() => inputRefs.current[channel.id]?.click()} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-[#1F3A8A]" aria-label="Upload icon">{uploadingId === channel.id ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}</button>
                  <input ref={(node) => { inputRefs.current[channel.id] = node; }} type="file" accept="image/*,.svg" className="hidden" onChange={(event) => uploadIcon(channel, event.target.files?.[0])} />
                  <button onClick={() => setChannels(draft.contactChannels.filter((item) => item.id !== channel.id))} className="grid h-9 w-9 place-items-center rounded-xl text-red-500 hover:bg-red-50" aria-label="Xóa"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
          <button onClick={add} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-5 text-sm font-black text-slate-600 transition hover:border-[#1F3A8A]/30 hover:text-[#1F3A8A]"><Plus size={18} />Thêm kênh liên hệ</button>
        </div>

        <Card className="h-fit p-5 xl:sticky xl:top-24">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Preview website</p>
          <div className="mt-4 rounded-3xl bg-[#0b0d12] p-4">
            <div className="grid grid-cols-3 gap-3">
              {draft.contactChannels.filter((item) => item.isActive).map((channel) => (
                <a key={channel.id} href={channel.href || '#'} target="_blank" rel="noreferrer" className="flex min-w-0 flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                  <img src={channel.icon || '/brand-icons/email.svg'} alt="" className="h-9 w-9 object-contain" />
                  <span className="mt-2 max-w-full truncate text-[10px] font-bold text-white">{channel.name}</span>
                  <span className="mt-1 max-w-full truncate text-[9px] text-white/45">{channel.label}</span>
                </a>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs font-medium leading-5 text-slate-500">Sau khi lưu, thứ tự, trạng thái hiển thị, đường dẫn và icon được dùng chung cho thanh liên hệ nhanh trên frontend.</p>
          <a href="/vi/lien-he" target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-800">Mở trang liên hệ <ExternalLink size={16} /></a>
        </Card>
      </div>
    </div>
  );
}
