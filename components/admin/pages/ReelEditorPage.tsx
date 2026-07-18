'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Film, AtSign, Loader2, Save, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import type { HomepageReel } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FormField, inputClass, textareaClass } from '../ui/FormField';
import { PageHeader } from '../ui/PageHeader';
import { slugId } from '../utils';

export function ReelEditorPage({ reelId, initialVenueId }: { reelId?: string; initialVenueId?: string }) {
  const { venues, reservations, customers, saveVenue, replaceData, uploadMedia, saving, showToast } = useAdminData();
  const videoInput = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);
  const existing = (() => {
    for (const venue of venues) {
      const reel = (venue.reels || []).find((item) => item.id === reelId);
      if (reel) return { venue, reel };
    }
    return null;
  })();
  const [draft, setDraft] = useState<HomepageReel>(() => existing
    ? { ...existing.reel, venueId: existing.venue.id }
    : { id: slugId('reel'), venueId: initialVenueId || venues[0]?.id || '', title: '', tag: 'Featured', caption: '', instagramUrl: '', videoUrl: '', posterUrl: '', isActive: true, order: venues.flatMap((venue) => venue.reels || []).length, placement: 'HOME_FEED' });
  const [uploading, setUploading] = useState<'video' | 'poster' | null>(null);

  const selectedVenue = venues.find((venue) => venue.id === draft.venueId);

  const upload = async (file: File | undefined, type: 'video' | 'poster') => {
    if (!file) return;
    if (type === 'video' && !file.type.startsWith('video/')) return showToast('error', 'Vui lòng chọn file video.');
    if (type === 'poster' && !file.type.startsWith('image/')) return showToast('error', 'Vui lòng chọn file ảnh poster.');
    setUploading(type);
    try {
      const result = await uploadMedia(file, type === 'video' ? 'reels' : 'reels/posters');
      setDraft((current) => ({ ...current, [type === 'video' ? 'videoUrl' : 'posterUrl']: result.url }));
      showToast('success', type === 'video' ? 'Đã upload video Reel.' : 'Đã upload poster.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Upload thất bại.');
    } finally {
      setUploading(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const venue = venues.find((item) => item.id === draft.venueId);
    if (!venue) return showToast('error', 'Vui lòng chọn địa điểm.');
    if (draft.title.trim().length < 2) return showToast('error', 'Vui lòng nhập tiêu đề Reel.');
    if (!draft.videoUrl && !draft.instagramUrl) return showToast('error', 'Cần có video URL/upload hoặc liên kết Instagram.');

    try {
      let nextVenues = venues;
      if (existing && existing.venue.id !== venue.id) {
        nextVenues = venues.map((item) => {
          if (item.id === existing.venue.id) return { ...item, reels: (item.reels || []).filter((reel) => reel.id !== draft.id) };
          if (item.id === venue.id) return { ...item, reels: [...(item.reels || []).filter((reel) => reel.id !== draft.id), { ...draft, venueId: venue.id }] };
          return item;
        });
        await replaceData({ venues: nextVenues, reservations, customers });
      } else {
        const latestVenue = nextVenues.find((item) => item.id === venue.id) || venue;
        const existsInVenue = (latestVenue.reels || []).some((item) => item.id === draft.id);
        const reels = existsInVenue
          ? (latestVenue.reels || []).map((item) => item.id === draft.id ? { ...draft, venueId: venue.id } : item)
          : [...(latestVenue.reels || []), { ...draft, venueId: venue.id }];
        await saveVenue({ ...latestVenue, reels });
      }
      window.location.href = '/admin/reels';
    } catch {
      // Provider already restored the previous state and displayed an error.
    }
  };

  return (
    <div className="pb-10">
      <PageHeader title={existing ? 'Chỉnh sửa Reel' : 'Tạo Reel mới'} description="Nội dung được gắn trực tiếp với địa điểm đã có trong hệ thống." actions={<Link href="/admin/reels"><Button variant="secondary"><ArrowLeft size={18} />Quay lại</Button></Link>} />
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="grid gap-5 md:grid-cols-2">
            <FormField label="Địa điểm" required><select className={inputClass} value={draft.venueId} onChange={(event) => setDraft({ ...draft, venueId: event.target.value })}>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select></FormField>
            <FormField label="Vị trí hiển thị"><select className={inputClass} value={draft.placement || 'HOME_FEED'} onChange={(event) => setDraft({ ...draft, placement: event.target.value as HomepageReel['placement'] })}><option value="HOME_FEED">Homepage Feed</option><option value="HOME_HOST">Homepage Host</option></select></FormField>
            <FormField label="Tiêu đề" required className="md:col-span-2"><input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Một đêm đáng nhớ tại ADM Club" /></FormField>
            <FormField label="Tag"><input className={inputClass} value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} placeholder="Featured" /></FormField>
            <FormField label="Thứ tự"><input type="number" min={0} className={inputClass} value={draft.order} onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })} /></FormField>
            <FormField label="Caption" className="md:col-span-2"><textarea className={textareaClass} value={draft.caption} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} /></FormField>
            <FormField label="Instagram permalink" className="md:col-span-2"><div className="relative"><AtSign size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-500" /><input className={`${inputClass} pl-10`} value={draft.instagramUrl || ''} onChange={(event) => setDraft({ ...draft, instagramUrl: event.target.value })} placeholder="https://www.instagram.com/reel/..." /></div></FormField>
            <label className="md:col-span-2 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} className="h-4 w-4 rounded accent-[#1F3A8A]" />Hiển thị Reel ngay sau khi lưu</label>
          </Card>

          <Card>
            <h2 className="text-lg font-black">Video & poster</h2><p className="mt-1 text-sm font-medium text-slate-500">Upload trực tiếp lên Supabase Storage hoặc nhập URL CDN bên dưới.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5"><div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-[#1F3A8A]"><Film size={22} /></div><h3 className="font-black">Video Reel</h3><p className="mt-1 text-xs font-medium text-slate-500">MP4/WebM/MOV. Dùng video dọc 9:16.</p><Button variant="outline" className="mt-4 w-full" onClick={() => videoInput.current?.click()} disabled={uploading === 'video'}>{uploading === 'video' ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}{uploading === 'video' ? 'Đang tải...' : 'Chọn video'}</Button><input ref={videoInput} type="file" accept="video/*" className="hidden" onChange={(event) => upload(event.target.files?.[0], 'video')} /></div>
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5"><div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600"><UploadCloud size={22} /></div><h3 className="font-black">Ảnh poster</h3><p className="mt-1 text-xs font-medium text-slate-500">JPG/PNG/WebP, tỷ lệ dọc.</p><Button variant="outline" className="mt-4 w-full" onClick={() => posterInput.current?.click()} disabled={uploading === 'poster'}>{uploading === 'poster' ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}{uploading === 'poster' ? 'Đang tải...' : 'Chọn poster'}</Button><input ref={posterInput} type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0], 'poster')} /></div>
              <FormField label="Video URL" className="md:col-span-2"><input className={inputClass} value={draft.videoUrl || ''} onChange={(event) => setDraft({ ...draft, videoUrl: event.target.value })} placeholder="https://.../reel.mp4" /></FormField>
              <FormField label="Poster URL" className="md:col-span-2"><input className={inputClass} value={draft.posterUrl || ''} onChange={(event) => setDraft({ ...draft, posterUrl: event.target.value })} placeholder="https://.../poster.jpg" /></FormField>
            </div>
          </Card>
          <div className="flex justify-end"><Button type="submit" size="lg" disabled={saving || Boolean(uploading)}><Save size={18} />{saving ? 'Đang lưu...' : 'Lưu Reel'}</Button></div>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden p-3"><div className="relative mx-auto aspect-[9/16] max-h-[690px] overflow-hidden rounded-2xl bg-slate-950">
            {draft.videoUrl && /\.(mp4|webm|mov)(\?|$)/i.test(draft.videoUrl) ? <video src={draft.videoUrl} poster={draft.posterUrl || selectedVenue?.image} controls muted playsInline className="h-full w-full object-cover" /> : <img src={draft.posterUrl || selectedVenue?.image || '/about.jpg'} alt="Reel preview" className="h-full w-full object-cover" />}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" /><div className="absolute inset-x-0 bottom-0 p-5 text-white"><div className="mb-3 flex items-center gap-2"><CheckCircle2 size={16} /><span className="text-[10px] font-black uppercase tracking-wider">{selectedVenue?.name || 'Chọn địa điểm'}</span></div><h3 className="text-xl font-black">{draft.title || 'Tiêu đề Reel'}</h3><p className="mt-2 text-xs font-medium leading-5 text-white/70">{draft.caption || 'Caption sẽ hiển thị tại đây.'}</p></div>
          </div></Card>
        </div>
      </form>
    </div>
  );
}
