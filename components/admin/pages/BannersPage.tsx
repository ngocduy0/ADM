'use client';

import { CheckCircle2, ImageIcon, Loader2, Play, Save, Trash2, UploadCloud, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SiteSettings } from '@/components/aurelius/siteSettings';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FormField, inputClass } from '../ui/FormField';
import { PageHeader } from '../ui/PageHeader';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function BannersPage() {
  const { settings, saveSettings, uploadMedia, deleteMedia, refresh, saving, showToast } = useAdminData();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [uploading, setUploading] = useState<'video' | 'poster' | null>(null);
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([]);
  const [legacyCleanupOpen, setLegacyCleanupOpen] = useState(false);
  const [cleaningLegacy, setCleaningLegacy] = useState(false);
  const videoInput = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);
  const sessionUploadedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => () => {
    for (const path of sessionUploadedPaths.current) {
      void fetch('/api/upload-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
        keepalive: true,
      });
    }
  }, []);

  const queueCleanup = (path?: string) => {
    const clean = String(path || '').trim();
    if (!clean) return;
    setCleanupPaths((current) => Array.from(new Set([...current, clean])));
  };

  const upload = async (file: File | undefined, type: 'video' | 'poster') => {
    if (!file) return;
    if (type === 'video' && !file.type.startsWith('video/')) return showToast('error', 'Vui lòng chọn file video.');
    if (type === 'poster' && !file.type.startsWith('image/')) return showToast('error', 'Vui lòng chọn file ảnh.');
    setUploading(type);
    try {
      const result = await uploadMedia(file, type === 'video' ? 'homepage/banner' : 'homepage/banner/posters');
      sessionUploadedPaths.current.add(result.path);
      if (type === 'video') {
        queueCleanup(draft.heroVideoPath);
        setDraft((current) => ({ ...current, heroVideoUrl: result.url, heroVideoPath: result.path }));
      } else {
        queueCleanup(draft.heroPosterPath);
        setDraft((current) => ({ ...current, heroPosterUrl: result.url, heroPosterPath: result.path }));
      }
      showToast('success', type === 'video' ? 'Đã upload video banner lên Cloudinary.' : 'Đã upload poster lên Cloudinary.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Upload thất bại.');
    } finally {
      setUploading(null);
      if (type === 'video' && videoInput.current) videoInput.current.value = '';
      if (type === 'poster' && posterInput.current) posterInput.current.value = '';
    }
  };

  const save = async () => {
    try {
      const saved = await saveSettings(draft);
      const activePaths = new Set([saved.heroVideoPath, saved.heroPosterPath].filter(Boolean));
      const stalePaths = cleanupPaths.filter((path) => !activePaths.has(path));
      if (!stalePaths.length) {
        sessionUploadedPaths.current.clear();
        return;
      }

      const results = await Promise.allSettled(stalePaths.map((path) => deleteMedia(path)));
      const failed = stalePaths.filter((_, index) => results[index]?.status === 'rejected');
      setCleanupPaths(failed);
      sessionUploadedPaths.current = new Set(failed);
      if (failed.length) {
        showToast('error', `Banner đã lưu nhưng còn ${failed.length} file cũ chưa xóa được. Hãy thử lưu lại.`);
      }
    } catch {
      // saveSettings đã hiển thị thông báo và giữ file cũ để website không bị mất banner.
    }
  };

  const setManualUrl = (type: 'video' | 'poster', value: string) => {
    if (type === 'video') {
      if (value === (settings.heroVideoUrl || '') && settings.heroVideoPath) {
        setCleanupPaths((current) => current.filter((path) => path !== settings.heroVideoPath));
        setDraft((current) => ({ ...current, heroVideoUrl: value, heroVideoPath: settings.heroVideoPath }));
        return;
      }
      queueCleanup(draft.heroVideoPath);
      setDraft((current) => ({ ...current, heroVideoUrl: value, heroVideoPath: '' }));
      return;
    }

    if (value === (settings.heroPosterUrl || '') && settings.heroPosterPath) {
      setCleanupPaths((current) => current.filter((path) => path !== settings.heroPosterPath));
      setDraft((current) => ({ ...current, heroPosterUrl: value, heroPosterPath: settings.heroPosterPath }));
      return;
    }
    queueCleanup(draft.heroPosterPath);
    setDraft((current) => ({ ...current, heroPosterUrl: value, heroPosterPath: '' }));
  };

  const clearLegacySupabaseMedia = async () => {
    setCleaningLegacy(true);
    try {
      const response = await fetch('/api/admin-data/clear-supabase-media', { method: 'POST', cache: 'no-store' });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Không thể dọn media Supabase cũ.');
      await refresh();
      setLegacyCleanupOpen(false);
      const data = json.data || {};
      showToast('success', `Đã dọn media Supabase cũ: ${Number(data.deletedVenueImages || 0)} ảnh, ${Number(data.removedLegacyReels || 0)} reels, ${Number(data.deletedStorageFiles || 0)} file.`);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể dọn media Supabase cũ.');
    } finally {
      setCleaningLegacy(false);
    }
  };

  const removeVideo = () => {
    queueCleanup(draft.heroVideoPath);
    setDraft((current) => ({ ...current, heroVideoUrl: '', heroVideoPath: '' }));
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Quản lý Banners"
        description="Video hero chính của homepage người dùng. Ảnh và video mới được lưu trên Cloudinary CDN."
        actions={<Button onClick={save} disabled={saving || Boolean(uploading)}><Save size={18} />{saving ? 'Đang lưu...' : 'Lưu banner'}</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D9DFF5] text-[#1F3A8A]"><Video size={23} /></span>
              <div>
                <h2 className="text-lg font-black">Video hero</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Khuyên dùng MP4 H.264 khoảng 2–8MB để tự phát nhanh trên điện thoại.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
                <UploadCloud size={32} className="mx-auto text-[#1F3A8A]" />
                <p className="mt-3 text-sm font-black">Upload video mới</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Upload trực tiếp lên từ thiết bị.</p>
                <Button variant="outline" className="mt-4" onClick={() => videoInput.current?.click()} disabled={uploading === 'video'}>
                  {uploading === 'video' ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
                  {uploading === 'video' ? 'Đang tải...' : 'Chọn video'}
                </Button>
                <input ref={videoInput} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => upload(event.target.files?.[0], 'video')} />
              </div>
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
                <ImageIcon size={32} className="mx-auto text-amber-500" />
                <p className="mt-3 text-sm font-black">Upload poster</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Poster hiện ngay trước khi video sẵn sàng, giúp mobile không bị màn hình đen.</p>
                <Button variant="outline" className="mt-4" onClick={() => posterInput.current?.click()} disabled={uploading === 'poster'}>
                  {uploading === 'poster' ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
                  {uploading === 'poster' ? 'Đang tải...' : 'Chọn poster'}
                </Button>
                <input ref={posterInput} type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0], 'poster')} />
              </div>
              <FormField label="Video URL" className="md:col-span-2"><input className={inputClass} value={draft.heroVideoUrl || ''} onChange={(event) => setManualUrl('video', event.target.value)} placeholder="https://res.cloudinary.com/.../hero.mp4" /></FormField>
              <FormField label="Poster URL" className="md:col-span-2"><input className={inputClass} value={draft.heroPosterUrl || ''} onChange={(event) => setManualUrl('poster', event.target.value)} placeholder="https://res.cloudinary.com/.../hero-poster.webp" /></FormField>
            </div>
          </Card>
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={20} /></span>
              <div><p className="text-sm font-black">Trạng thái nội dung</p><p className="mt-1 text-xs font-medium text-slate-500">{draft.heroVideoUrl ? 'Video banner đã sẵn sàng.' : 'Chưa có video banner, homepage dùng poster hoặc nội dung dự phòng.'}</p></div>
            </div>
            {draft.heroVideoUrl ? <Button variant="outline" size="sm" onClick={removeVideo}><Trash2 size={15} />Gỡ video</Button> : null}
          </Card>
        </div>
        <Card className="h-fit p-3 xl:sticky xl:top-24">
          <div className="relative aspect-[9/16] max-h-[720px] overflow-hidden rounded-2xl bg-slate-950">
            {draft.heroVideoUrl ? <video src={draft.heroVideoUrl} poster={draft.heroPosterUrl} controls muted playsInline preload="metadata" className="h-full w-full object-cover" /> : draft.heroPosterUrl ? <img src={draft.heroPosterUrl} alt="Poster banner" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center text-white/60"><Play size={42} /><p className="mt-3 text-sm font-bold">Chưa có banner</p></div>}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 pt-24 text-white"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">DuyT Booking</p><h3 className="mt-2 text-2xl font-black">DUYT Booking FULL MAP ĐÀ NẴNG</h3></div>
          </div>
        </Card>
      </div>
      <ConfirmDialog
        open={legacyCleanupOpen}
        title="Xóa media Supabase cũ?"
        description="Ảnh địa điểm, video, banner và reels đang dùng URL Supabase sẽ bị gỡ khỏi dữ liệu và Storage. Media Cloudinary cùng menu PDF vẫn được giữ nguyên. Thao tác này không thể hoàn tác."
        confirmLabel={cleaningLegacy ? 'Đang dọn...' : 'Xóa media Supabase cũ'}
        onClose={() => !cleaningLegacy && setLegacyCleanupOpen(false)}
        onConfirm={clearLegacySupabaseMedia}
      />
    </div>
  );
}
