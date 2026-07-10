'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Upload, Video, X } from 'lucide-react';
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromServer,
  loadSiteSettingsLocal,
  saveSiteSettingsLocal,
  saveSiteSettingsToServer,
  SiteSettings,
} from '../siteSettings';

const MAX_BANNER_VIDEO_BYTES = 750 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.86) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Không thể tạo poster từ video.'));
    }, type, quality);
  });
}

async function extractPosterFromVideo(file: File, targetWidth = 1920, targetHeight = 1080) {
  if (!file.type.startsWith('video/')) return null;

  const localUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Không đọc được metadata của video.'));
      video.src = localUrl;
      video.load();
    });

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const seekTime = Math.min(Math.max(duration * 0.12, 0.25), 3);

    await new Promise<void>((resolve, reject) => {
      const fallback = window.setTimeout(() => resolve(), 2200);
      video.onseeked = () => {
        window.clearTimeout(fallback);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(fallback);
        reject(new Error('Không lấy được frame từ video.'));
      };
      try {
        video.currentTime = seekTime;
      } catch {
        window.clearTimeout(fallback);
        resolve();
      }
    });

    const sourceWidth = video.videoWidth || targetWidth;
    const sourceHeight = video.videoHeight || targetHeight;
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = sourceWidth / sourceHeight;

    let sx = 0;
    let sy = 0;
    let sw = sourceWidth;
    let sh = sourceHeight;

    if (sourceRatio > targetRatio) {
      sw = Math.round(sourceHeight * targetRatio);
      sx = Math.round((sourceWidth - sw) / 2);
    } else if (sourceRatio < targetRatio) {
      sh = Math.round(sourceWidth / targetRatio);
      sy = Math.round((sourceHeight - sh) / 2);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) return null;

    context.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.86);
    const safeName = file.name.replace(/\.[^/.]+$/, '') || 'homepage-banner';

    return new File([blob], `${safeName}-poster.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(localUrl);
  }
}

async function uploadAdminMedia(file: File, folder: 'homepage/banner' | 'homepage/banner/posters', oldPath?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  if (oldPath) formData.append('oldPath', oldPath);

  const response = await fetch('/api/upload-media', {
    method: 'POST',
    body: formData,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.ok || !json?.url) {
    throw new Error(json?.error || 'Upload thất bại. Kiểm tra Supabase Storage bucket và service role key.');
  }

  return {
    url: String(json.url),
    path: String(json.path || ''),
  };
}

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function BannerVideoManager({ embedded = false }: { embedded?: boolean } = {}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      setLoading(true);
      try {
        const data = await loadSiteSettingsFromServer();
        if (mounted) setSettings(data);
      } catch {
        if (mounted) setSettings(loadSiteSettingsLocal());
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const uploadBanner = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setMessage(null);

    if (!file.type.startsWith('video/')) {
      setMessage({ kind: 'error', text: 'Vui lòng chọn file video .mp4/.webm/.mov.' });
      return;
    }

    if (file.size > MAX_BANNER_VIDEO_BYTES) {
      setMessage({ kind: 'error', text: `Video quá nặng (${formatMb(file.size)}). Tối đa hiện tại là 750MB. Video 4K quá lớn nên đưa qua Cloudflare R2/Cloudinary sẽ an toàn hơn Supabase.` });
      return;
    }

    setSaving(true);

    try {
      const posterFile = await extractPosterFromVideo(file);
      const uploadedVideo = await uploadAdminMedia(file, 'homepage/banner', settings.heroVideoPath);

      let posterUrl = settings.heroPosterUrl || '';
      let posterPath = settings.heroPosterPath || '';

      if (posterFile) {
        const uploadedPoster = await uploadAdminMedia(posterFile, 'homepage/banner/posters', settings.heroPosterPath);
        posterUrl = uploadedPoster.url;
        posterPath = uploadedPoster.path;
      }

      const nextSettings: SiteSettings = {
        ...settings,
        heroVideoUrl: uploadedVideo.url,
        heroVideoPath: uploadedVideo.path,
        heroPosterUrl: posterUrl,
        heroPosterPath: posterPath,
        updatedAt: new Date().toISOString(),
      };

      saveSiteSettingsLocal(nextSettings);
      const saved = await saveSiteSettingsToServer(nextSettings);
      setSettings(saved);
      setMessage({ kind: 'success', text: 'Đã cập nhật video banner homepage. '});
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Không cập nhật được video banner.' });
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clearBanner = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const empty: SiteSettings = {
        ...settings,
        heroVideoUrl: '',
        heroVideoPath: '',
        heroPosterUrl: '',
        heroPosterPath: '',
        updatedAt: new Date().toISOString(),
      };
      saveSiteSettingsLocal(empty);
      const saved = await saveSiteSettingsToServer(empty);
      setSettings(saved);
      setMessage({ kind: 'success', text: 'Đã tắt video banner. Homepage sẽ dùng ảnh mặc định.' });
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Không tắt được video banner.' });
    } finally {
      setSaving(false);
    }
  };


  if (embedded) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-[#E8E8ED] bg-white shadow-sm">
        <div className="border-b border-[#E8E8ED] px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#37177b]">Cài đặt homepage</p>
          <h2 className="text-xl font-bold text-[#1D1D1F]">Video banner trang chủ</h2>
          <p className="mt-1 text-sm text-[#86868B]">Upload video từ máy..</p>
        </div>
        <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
          <div className="bg-[#090B0F] p-5">
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-black">
              {settings.heroVideoUrl ? (
                <video src={settings.heroVideoUrl} poster={settings.heroPosterUrl || undefined} controls muted playsInline preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-sm font-semibold text-white/55">
                  Chưa có video banner. Homepage đang dùng ảnh mặc định.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 p-6 text-[#1D1D1F]">
            <div className="rounded-3xl border border-[#E8E8ED] bg-[#F5F5F7] p-4 text-sm leading-relaxed text-[#515154]">
              <p className="font-bold text-[#1D1D1F]">Khuyến nghị Banner Video</p>
            </div>

            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(event) => uploadBanner(event.target.files)} />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={saving || loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D1D1F] px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {saving ? 'Đang upload...' : 'Upload video banner'}
            </button>

            <button
              type="button"
              onClick={clearBanner}
              disabled={saving || loading || !settings.heroVideoUrl}
              className="w-full rounded-2xl border border-[#E8E8ED] bg-white px-5 py-3 text-sm font-bold text-[#1D1D1F] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tắt video banner
            </button>

            {settings.updatedAt && (
              <p className="text-xs text-[#86868B]">Cập nhật lần cuối: {new Date(settings.updatedAt).toLocaleString('vi-VN')}</p>
            )}

            {message && (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${message.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : message.kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                <div className="flex gap-2">
                  {message.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-black/25 transition hover:-translate-y-0.5 hover:bg-black"
      >
        <Video className="h-4 w-4 text-[#D6A85F]" />
        Banner homepage
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-md">
          <div className="w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E8ED] px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2c0684]">DuyT Danang-Concierge</p>
                <h2 className="text-2xl font-bold text-[#1D1D1F]">Cập nhật video banner homepage</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-[#86868B] transition hover:bg-[#F5F5F7] hover:text-[#1D1D1F]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
              <div className="bg-[#090B0F] p-5">
                <div className="relative aspect-video overflow-hidden rounded-3xl bg-black">
                  {settings.heroVideoUrl ? (
                    <video src={settings.heroVideoUrl} poster={settings.heroPosterUrl || undefined} controls muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-8 text-center text-sm font-semibold text-white/55">
                      Chưa có video banner. Homepage đang dùng ảnh mặc định.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-6 text-[#1D1D1F]">
                <div className="rounded-3xl border border-[#E8E8ED] bg-[#F5F5F7] p-4 text-sm leading-relaxed text-[#515154]">
                  <p className="font-bold text-[#1D1D1F]">Khuyến nghị production</p>
                  <p className="mt-2">Video banner nên là MP4/WebM, 16:9, 4K nếu thật sự cần. Hệ thống chỉ lưu URL/path, không lưu base64 vào database.</p>
                  <p className="mt-2">Khi upload video mới, file banner cũ trong Supabase Storage sẽ được dọn tự động để tránh đầy bộ nhớ.</p>
                </div>

                <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(event) => uploadBanner(event.target.files)} />

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={saving || loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D1D1F] px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {saving ? 'Đang upload...' : 'Upload video banner 4K'}
                </button>

                <button
                  type="button"
                  onClick={clearBanner}
                  disabled={saving || loading || !settings.heroVideoUrl}
                  className="w-full rounded-2xl border border-[#E8E8ED] bg-white px-5 py-3 text-sm font-bold text-[#1D1D1F] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tắt video banner
                </button>

                {settings.updatedAt && (
                  <p className="text-xs text-[#86868B]">Cập nhật lần cuối: {new Date(settings.updatedAt).toLocaleString('vi-VN')}</p>
                )}

                {message && (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${message.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : message.kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                    <div className="flex gap-2">
                      {message.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                      <span>{message.text}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
