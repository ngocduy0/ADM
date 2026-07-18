'use client';

import { CheckCircle2, ImagePlus, Loader2, RotateCcw, Save, ShieldCheck, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import type { SiteSettings } from '@/components/aurelius/siteSettings';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FormField, inputClass } from '../ui/FormField';
import { PageHeader } from '../ui/PageHeader';

export function SettingsPage() {
  const { settings, saveSettings, uploadMedia, saving, showToast } = useAdminData();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('error', 'Logo phải là file ảnh PNG, JPG, SVG hoặc WebP.');
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file, 'brand/logo', draft.logoPath);
      setDraft((current) => ({ ...current, logoUrl: uploaded.url, logoPath: uploaded.path }));
      showToast('success', 'Đã upload logo mới. Nhấn Lưu thay đổi để áp dụng toàn hệ thống.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Upload logo thất bại.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Cài đặt" description="Cấu hình nhận diện riêng cho DuyT Booking và trang quản trị." actions={<Button onClick={() => saveSettings(draft)} disabled={saving || uploading}><Save size={18} />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D9DFF5] text-[#1F3A8A]"><ImagePlus size={23} /></span><div><h2 className="text-lg font-black">Logo toàn hệ thống</h2><p className="mt-1 text-sm font-medium leading-6 text-slate-500">Logo này được áp dụng cho trang đăng nhập admin, sidebar, header và footer của website người dùng. Phần admin và frontend người dùng vẫn giữ layout độc lập.</p></div></div>
            <div className="mt-6 grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
              <div className="flex min-h-48 items-center justify-center rounded-3xl bg-slate-950 p-6"><img src={draft.logoUrl || '/duyt-logo.png'} alt="Logo DuyT Booking" className="max-h-28 max-w-full object-contain" /></div>
              <div className="space-y-4"><FormField label="Logo URL"><input className={inputClass} value={draft.logoUrl || ''} onChange={(event) => setDraft({ ...draft, logoUrl: event.target.value, logoPath: '' })} placeholder="https://cdn.../logo.png" /></FormField><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}{uploading ? 'Đang tải...' : 'Upload logo'}</Button><Button variant="secondary" onClick={() => setDraft({ ...draft, logoUrl: '', logoPath: '' })}><RotateCcw size={17} />Dùng logo mặc định</Button></div><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => uploadLogo(event.target.files?.[0])} /><p className="text-xs font-medium leading-5 text-slate-400">Khuyến nghị PNG/WebP nền trong suốt, chiều rộng tối thiểu 512px. Không đưa file logo vào base64/localStorage.</p></div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><ShieldCheck size={23} /></span><div><h2 className="text-lg font-black">Bảo mật quản trị</h2><p className="mt-1 text-sm font-medium text-slate-500">Phiên admin sử dụng cookie HTTP-only, được kiểm tra ở route layout và API cần quyền.</p></div></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><Status title="Phiên đăng nhập" text="Cookie ký HMAC, tự hết hạn" /><Status title="Upload media" text="Yêu cầu phiên admin hợp lệ" /><Status title="Dữ liệu" text="Đồng bộ Supabase + cache local" /><Status title="Realtime" text="Supabase Realtime + polling dự phòng" /></div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Preview sidebar</p><div className="mt-4 rounded-3xl bg-[#F7F8FC] p-5"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[#1F3A8A] p-2"><img src={draft.logoUrl || '/duyt-logo.png'} alt="Logo" className="h-full w-full object-contain" /></div><div><h3 className="text-lg font-black text-[#1F3A8A]">DuyT Booking</h3><p className="mt-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Quản trị viên</p></div></div><div className="mt-5 rounded-xl bg-[#D9DFF5] px-4 py-3 text-sm font-black text-[#1F3A8A]">Tổng quan</div><div className="mt-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-500">Đặt chỗ</div></div></Card>
          <Card className="bg-[#1F3A8A] text-white"><CheckCircle2 size={24} /><h3 className="mt-4 text-lg font-black">Tên hệ thống đã chuẩn hóa</h3><p className="mt-2 text-sm font-medium leading-6 text-white/70">Toàn bộ phần admin mới dùng thương hiệu “DuyT Booking”; không dùng lại “DuyT Concierge” trong shell và trang đăng nhập.</p></Card>
        </div>
      </div>
    </div>
  );
}
function Status({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" /><p className="text-sm font-black">{title}</p></div><p className="mt-2 text-xs font-medium text-slate-500">{text}</p></div>; }
