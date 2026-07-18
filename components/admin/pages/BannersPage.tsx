'use client';

import { CheckCircle2, ImageIcon, Loader2, Play, Save, Trash2, UploadCloud, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import type { SiteSettings } from '@/components/aurelius/siteSettings';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FormField, inputClass } from '../ui/FormField';
import { PageHeader } from '../ui/PageHeader';

export function BannersPage() {
  const { settings, saveSettings, uploadMedia, saving, showToast } = useAdminData();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [uploading, setUploading] = useState<'video' | 'poster' | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);


  const upload = async (file: File | undefined, type: 'video' | 'poster') => {
    if (!file) return;
    if (type === 'video' && !file.type.startsWith('video/')) return showToast('error', 'Vui lòng chọn file video.');
    if (type === 'poster' && !file.type.startsWith('image/')) return showToast('error', 'Vui lòng chọn file ảnh.');
    setUploading(type);
    try {
      const result = await uploadMedia(file, type === 'video' ? 'homepage/banner' : 'homepage/banner/posters', type === 'video' ? draft.heroVideoPath : draft.heroPosterPath);
      setDraft((current) => type === 'video' ? { ...current, heroVideoUrl: result.url, heroVideoPath: result.path } : { ...current, heroPosterUrl: result.url, heroPosterPath: result.path });
      showToast('success', type === 'video' ? 'Đã upload video banner.' : 'Đã upload poster banner.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Upload thất bại.');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Quản lý Banners" description="Video hero chính của homepage người dùng." actions={<Button onClick={() => saveSettings(draft)} disabled={saving || Boolean(uploading)}><Save size={18} />{saving ? 'Đang lưu...' : 'Lưu banner'}</Button>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D9DFF5] text-[#1F3A8A]"><Video size={23} /></span><div><h2 className="text-lg font-black">Video hero</h2><p className="mt-1 text-sm font-medium text-slate-500">Dùng MP4/WebM tối ưu dưới 80MB khi chạy production để tải nhanh trên mobile.</p></div></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center"><UploadCloud size={32} className="mx-auto text-[#1F3A8A]" /><p className="mt-3 text-sm font-black">Upload video mới</p><p className="mt-1 text-xs font-medium text-slate-500">Hệ thống sẽ lưu trên Supabase Storage.</p><Button variant="outline" className="mt-4" onClick={() => videoInput.current?.click()} disabled={uploading === 'video'}>{uploading === 'video' ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}{uploading === 'video' ? 'Đang tải...' : 'Chọn video'}</Button><input ref={videoInput} type="file" accept="video/*" className="hidden" onChange={(event) => upload(event.target.files?.[0], 'video')} /></div>
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center"><ImageIcon size={32} className="mx-auto text-amber-500" /><p className="mt-3 text-sm font-black">Upload poster</p><p className="mt-1 text-xs font-medium text-slate-500">Ảnh hiển thị trước khi video sẵn sàng.</p><Button variant="outline" className="mt-4" onClick={() => posterInput.current?.click()} disabled={uploading === 'poster'}>{uploading === 'poster' ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}{uploading === 'poster' ? 'Đang tải...' : 'Chọn poster'}</Button><input ref={posterInput} type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0], 'poster')} /></div>
              <FormField label="Video URL" className="md:col-span-2"><input className={inputClass} value={draft.heroVideoUrl || ''} onChange={(event) => setDraft({ ...draft, heroVideoUrl: event.target.value, heroVideoPath: '' })} placeholder="https://cdn.../hero.mp4" /></FormField>
              <FormField label="Poster URL" className="md:col-span-2"><input className={inputClass} value={draft.heroPosterUrl || ''} onChange={(event) => setDraft({ ...draft, heroPosterUrl: event.target.value, heroPosterPath: '' })} placeholder="https://cdn.../hero-poster.jpg" /></FormField>
            </div>
          </Card>
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={20} /></span><div><p className="text-sm font-black">Trạng thái nội dung</p><p className="mt-1 text-xs font-medium text-slate-500">{draft.heroVideoUrl ? 'Video banner đã sẵn sàng.' : 'Chưa có video banner, homepage dùng nội dung dự phòng.'}</p></div></div>{draft.heroVideoUrl ? <Button variant="outline" size="sm" onClick={() => setDraft({ ...draft, heroVideoUrl: '', heroVideoPath: '' })}><Trash2 size={15} />Gỡ video</Button> : null}</Card>
        </div>
        <Card className="h-fit p-3 xl:sticky xl:top-24"><div className="relative aspect-[9/16] max-h-[720px] overflow-hidden rounded-2xl bg-slate-950">
          {draft.heroVideoUrl ? <video src={draft.heroVideoUrl} poster={draft.heroPosterUrl} controls muted playsInline className="h-full w-full object-cover" /> : draft.heroPosterUrl ? <img src={draft.heroPosterUrl} alt="Poster banner" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center text-white/60"><Play size={42} /><p className="mt-3 text-sm font-bold">Chưa có banner</p></div>}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 pt-24 text-white"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">DuyT Booking</p><h3 className="mt-2 text-2xl font-black">Đặt trải nghiệm nightlife riêng của bạn</h3></div>
        </div></Card>
      </div>
    </div>
  );
}
