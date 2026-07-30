"use client";

import {
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SiteSettings } from "@/components/aurelius/siteSettings";
import { useAdminData } from "../AdminDataProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { FormField, inputClass } from "../ui/FormField";
import { PageHeader } from "../ui/PageHeader";
import { PushNotificationSettings } from "../push/PushNotificationSettings";

export function SettingsPage() {
  const { settings, saveSettings, uploadMedia, deleteMedia, saving, showToast } =
    useAdminData();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([]);
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

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return showToast(
        "error",
        "Logo phải là file ảnh PNG, JPG, SVG hoặc WebP.",
      );
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file, "brand/logo");
      sessionUploadedPaths.current.add(uploaded.path);
      queueCleanup(draft.logoPath);
      setDraft((current) => ({
        ...current,
        logoUrl: uploaded.url,
        logoPath: uploaded.path,
      }));
      showToast(
        "success",
        "Đã upload logo mới. Nhấn Lưu thay đổi để áp dụng toàn hệ thống.",
      );
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Upload logo thất bại.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const save = async () => {
    try {
      const saved = await saveSettings(draft);
      const activePath = String(saved.logoPath || '').trim();
      const stalePaths = cleanupPaths.filter((path) => path !== activePath);
      const results = await Promise.allSettled(stalePaths.map((path) => deleteMedia(path)));
      const failed = stalePaths.filter((_, index) => results[index]?.status === 'rejected');
      setCleanupPaths(failed);
      sessionUploadedPaths.current = new Set(failed);
      if (failed.length) {
        showToast('error', `Logo đã lưu nhưng còn ${failed.length} file cũ chưa xóa được.`);
      }
    } catch {
      // saveSettings đã khôi phục cài đặt cũ và hiển thị lỗi.
    }
  };

  const setManualLogoUrl = (value: string) => {
    if (value === (settings.logoUrl || '') && settings.logoPath) {
      setCleanupPaths((current) => current.filter((path) => path !== settings.logoPath));
      setDraft((current) => ({ ...current, logoUrl: value, logoPath: settings.logoPath }));
      return;
    }
    queueCleanup(draft.logoPath);
    setDraft((current) => ({ ...current, logoUrl: value, logoPath: '' }));
  };

  const useDefaultLogo = () => {
    queueCleanup(draft.logoPath);
    setDraft((current) => ({ ...current, logoUrl: '', logoPath: '' }));
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Cài đặt"
        description="Cấu hình nhận diện riêng cho DuyT Booking và trang quản trị."
        actions={
          <Button
            onClick={() => void save()}
            disabled={saving || uploading}
          >
            <Save size={18} />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D9DFF5] text-[#1F3A8A]">
                <ImagePlus size={23} />
              </span>
              <div>
                <h2 className="text-lg font-black">Logo toàn hệ thống</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
              <div className="flex min-h-48 items-center justify-center rounded-3xl bg-slate-950 p-6">
                <img
                  src={draft.logoUrl || "/duyt-logo.png"}
                  alt="Logo DuyT Booking"
                  className="max-h-28 max-w-full object-contain"
                />
              </div>
              <div className="space-y-4">
                <FormField label="Logo URL">
                  <input
                    className={inputClass}
                    value={draft.logoUrl || ""}
                    onChange={(event) => setManualLogoUrl(event.target.value)}
                    placeholder="https://cdn.../logo.png"
                  />
                </FormField>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <UploadCloud size={17} />
                    )}
                    {uploading ? "Đang tải..." : "Upload logo"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={useDefaultLogo}
                  >
                    <RotateCcw size={17} />
                    Dùng logo mặc định
                  </Button>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(event) => uploadLogo(event.target.files?.[0])}
                />
                <p className="text-xs font-medium leading-5 text-slate-400">
                  Khuyến nghị PNG/WebP nền trong suốt, chiều rộng tối thiểu
                  512px.
                </p>
              </div>
            </div>
          </Card>
          <PushNotificationSettings />
        </div>
        <div className="space-y-6">
          <Card>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Preview sidebar
            </p>
            <div className="mt-4 rounded-3xl bg-[#F7F8FC] p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[#000000] p-2">
                  <img
                    src={draft.logoUrl || "/duyt-logo.png"}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1F3A8A]">
                    DuyT Booking
                  </h3>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Quản trị viên
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-[#D9DFF5] px-4 py-3 text-sm font-black text-[#1F3A8A]">
                Tổng quan
              </div>
              <div className="mt-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-500">
                Đặt chỗ
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
