'use client';

import { ArrowLeft, AtSign, CheckCircle2, Film, ImageIcon, Loader2, Save, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { HomepageReel } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FormField, inputClass, textareaClass } from '../ui/FormField';
import { PageHeader } from '../ui/PageHeader';
import { slugId } from '../utils';

const MAX_REELS = 10;
const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/duytadm/';

export function ReelEditorPage({ reelId, initialVenueId }: { reelId?: string; initialVenueId?: string }) {
  const { venues, saveVenueReels, uploadMedia, deleteMedia, saving, showToast } = useAdminData();
  const videoInput = useRef<HTMLInputElement>(null);
  const existing = (() => {
    for (const venue of venues) {
      const reel = (venue.reels || []).find((item) => item.id === reelId);
      if (reel) return { venue, reel };
    }
    return null;
  })();

  const [draft, setDraft] = useState<HomepageReel>(() => existing
    ? { ...existing.reel, venueId: existing.venue.id }
    : {
        id: slugId('reel'),
        venueId: initialVenueId || venues[0]?.id || '',
        title: '',
        tag: 'Featured',
        caption: '',
        instagramUrl: '',
        videoUrl: '',
        videoPath: '',
        posterUrl: '',
        posterPath: '',
        isActive: true,
        order: venues.flatMap((venue) => venue.reels || []).length,
        placement: 'HOME_FEED',
      });
  const [uploading, setUploading] = useState(false);
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([]);
  const sessionUploadedPaths = useRef<Set<string>>(new Set());

  const selectedVenue = venues.find((venue) => venue.id === draft.venueId);

  const uploadVideo = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast('error', 'Vui lòng chọn file video MP4, WebM hoặc MOV.');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMedia(file, 'reels');
      sessionUploadedPaths.current.add(result.path);

      const stale = [draft.videoPath, draft.posterPath].filter(Boolean) as string[];
      if (stale.length) {
        setCleanupPaths((current) => Array.from(new Set([...current, ...stale])));
      }

      setDraft((current) => ({
        ...current,
        videoUrl: result.url,
        videoPath: result.path,
        // Cloudinary tự lấy frame tại giây 0.6 làm poster. Đây là URL biến đổi,
        // không tạo thêm một file ảnh phải upload hoặc quản lý riêng.
        posterUrl: result.posterUrl || current.posterUrl || selectedVenue?.image || '',
        posterPath: '',
      }));
      showToast('success', 'Đã upload video Reel và tự tạo poster từ video.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Upload video thất bại.');
    } finally {
      setUploading(false);
      if (videoInput.current) videoInput.current.value = '';
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const venue = venues.find((item) => item.id === draft.venueId);
    if (!venue) return showToast('error', 'Vui lòng chọn địa điểm.');
    if (draft.title.trim().length < 2) return showToast('error', 'Vui lòng nhập tiêu đề Reel.');
    if (!draft.videoUrl) return showToast('error', 'Vui lòng upload video Reel trước khi lưu.');

    const totalReels = venues.flatMap((item) => item.reels || []).length;
    if (!existing && totalReels >= MAX_REELS) {
      return showToast('error', `Hệ thống chỉ cho phép tối đa ${MAX_REELS} reels. Vui lòng xóa bớt trước khi thêm mới.`);
    }

    const normalizedDraft: HomepageReel = {
      ...draft,
      venueId: venue.id,
      title: draft.title.trim(),
      tag: draft.tag.trim() || 'Featured',
      caption: draft.caption.trim(),
      // Để trống hợp lệ; public UI sẽ chuyển tới Instagram @duytadm.
      instagramUrl: String(draft.instagramUrl || '').trim(),
      posterUrl: draft.posterUrl || selectedVenue?.image || '',
    };

    try {
      const existsInVenue = (venue.reels || []).some((item) => item.id === normalizedDraft.id);
      const reels = existsInVenue
        ? (venue.reels || []).map((item) => item.id === normalizedDraft.id ? normalizedDraft : item)
        : [...(venue.reels || []), normalizedDraft];

      await saveVenueReels(venue.id, reels);

      const activePaths = new Set([normalizedDraft.videoPath].filter(Boolean));
      const stalePaths = cleanupPaths.filter((path) => !activePaths.has(path));
      const results = await Promise.allSettled(stalePaths.map((path) => deleteMedia(path)));
      const failedPaths = stalePaths.filter((_, index) => results[index]?.status === 'rejected');
      if (failedPaths.length) {
        showToast('error', `Reel đã lưu nhưng còn ${failedPaths.length} file cũ chưa xóa được.`);
      }

      sessionUploadedPaths.current = new Set(failedPaths);
      window.location.href = '/admin/reels';
    } catch {
      // Provider đã phục hồi dữ liệu và hiển thị thông báo lỗi.
    }
  };

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

  const cancelEditor = async () => {
    await Promise.allSettled(Array.from(sessionUploadedPaths.current).map((path) => deleteMedia(path)));
    sessionUploadedPaths.current.clear();
    window.location.href = '/admin/reels';
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={existing ? 'Chỉnh sửa Reel' : 'Tạo Reel mới'}
        description="Chỉ cần chọn một video. Poster được Cloudinary tạo tự động từ video."
        actions={<Button variant="secondary" onClick={() => void cancelEditor()}><ArrowLeft size={18} />Quay lại</Button>}
      />

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="grid gap-5 md:grid-cols-2">
            <FormField label="Địa điểm" required>
              <select
                className={inputClass}
                value={draft.venueId}
                disabled={Boolean(existing)}
                onChange={(event) => setDraft({ ...draft, venueId: event.target.value })}
              >
                {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
              </select>
              {existing ? <p className="mt-2 text-[11px] font-medium text-slate-400">Địa điểm được khóa khi chỉnh sửa.</p> : null}
            </FormField>
            <FormField label="Vị trí hiển thị">
              <select className={inputClass} value={draft.placement || 'HOME_FEED'} onChange={(event) => setDraft({ ...draft, placement: event.target.value as HomepageReel['placement'] })}>
                <option value="HOME_FEED">Homepage Feed</option>
                <option value="HOME_HOST">Homepage Host</option>
              </select>
            </FormField>
            <FormField label="Tiêu đề" required className="md:col-span-2">
              <input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Một đêm đáng nhớ tại ADM Club" />
            </FormField>
            <FormField label="Tag">
              <input className={inputClass} value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} placeholder="Featured" />
            </FormField>
            <FormField label="Thứ tự">
              <input type="number" min={0} className={inputClass} value={draft.order} onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })} />
            </FormField>
            <FormField label="Caption" className="md:col-span-2">
              <textarea className={textareaClass} value={draft.caption} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} />
            </FormField>
            <FormField label="Instagram permalink — không bắt buộc" className="md:col-span-2">
              <div className="relative">
                <AtSign size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-500" />
                <input
                  type="url"
                  className={`${inputClass} pl-10`}
                  value={draft.instagramUrl || ''}
                  onChange={(event) => setDraft({ ...draft, instagramUrl: event.target.value })}
                  placeholder={DEFAULT_INSTAGRAM_URL}
                />
              </div>
              <p className="mt-2 text-[11px] font-medium leading-5 text-slate-400">Để trống thì khi người dùng bấm Reel sẽ mở Instagram <strong>@duytadm</strong>.</p>
            </FormField>
            <label className="md:col-span-2 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} className="h-4 w-4 rounded accent-[#1F3A8A]" />
              Hiển thị Reel ngay sau khi lưu
            </label>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1F3A8A]"><Film size={21} /></span>
              <div>
                <h2 className="text-lg font-black">Video Reel</h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Upload video dọc 9:16. Poster sẽ tự lấy từ frame đầu của video, không cần upload ảnh riêng.</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
              <UploadCloud size={32} className="mx-auto text-[#1F3A8A]" />
              <p className="mt-3 text-sm font-black">MP4 / WebM / MOV · tối đa 80MB</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Nên dùng video 720p, 9:16 và dưới 8MB để tải nhanh trên điện thoại.</p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => videoInput.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
                {uploading ? 'Đang tải lên Cloudinary...' : draft.videoUrl ? 'Thay video' : 'Chọn video'}
              </Button>
              <input ref={videoInput} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" className="hidden" onChange={(event) => void uploadVideo(event.target.files?.[0])} />
            </div>

            {draft.videoUrl ? (
              <div className="mt-5 grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm"><CheckCircle2 size={20} /></span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-emerald-900">Video đã sẵn sàng</p>
                  <p className="mt-1 truncate text-xs font-medium text-emerald-700/70">{draft.videoUrl}</p>
                </div>
              </div>
            ) : null}

            {draft.posterUrl ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-violet-600 shadow-sm"><ImageIcon size={19} /></span>
                <div><p className="text-sm font-black text-slate-800">Poster tự động</p><p className="mt-0.5 text-xs font-medium text-slate-500">Được lấy từ video và tối ưu.</p></div>
              </div>
            ) : null}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={saving || uploading}>
              <Save size={18} />{saving ? 'Đang lưu...' : 'Lưu Reel'}
            </Button>
          </div>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden p-3">
            <div className="relative mx-auto aspect-[9/16] max-h-[690px] overflow-hidden rounded-2xl bg-slate-950">
              {draft.videoUrl ? (
                <video src={draft.videoUrl} poster={draft.posterUrl || selectedVenue?.image} controls muted playsInline preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <img src={draft.posterUrl || selectedVenue?.image || '/about.jpg'} alt="Reel preview" className="h-full w-full object-cover" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="mb-3 flex items-center gap-2"><CheckCircle2 size={16} /><span className="text-[10px] font-black uppercase tracking-wider">{selectedVenue?.name || 'Chọn địa điểm'}</span></div>
                <h3 className="text-xl font-black">{draft.title || 'Tiêu đề Reel'}</h3>
                <p className="mt-2 text-xs font-medium leading-5 text-white/70">{draft.caption || 'Caption sẽ hiển thị tại đây.'}</p>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
