'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(() => typeof window === 'undefined' ? 'admin@duyt.vn' : localStorage.getItem('duyt_admin_email') || 'admin@duyt.vn');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logo, setLogo] = useState('/duyt-logo.png');

  useEffect(() => {
    fetch('/api/site-settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => { if (json?.settings?.logoUrl) setLogo(String(json.settings.logoUrl)); })
      .catch(() => undefined);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Email hoặc mật khẩu không chính xác.');
      if (remember) localStorage.setItem('duyt_admin_email', email.trim());
      else localStorage.removeItem('duyt_admin_email');
      router.replace('/admin');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  const unavailable = () => setError('Phương thức này chưa được cấu hình. Vui lòng đăng nhập bằng tài khoản quản trị.');

  return (
    <main className="duyt-admin-login relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F4F6FB] px-5 py-10 text-slate-950">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-white/90 blur-3xl" />
      <div className="pointer-events-none absolute -right-52 -top-32 h-[680px] w-[680px] rounded-full bg-[#D9DFF5]/65 blur-3xl" />
      <div className="relative z-10 w-full max-w-[500px]">
        <div className="mb-9 text-center">
          <div className="mx-auto grid h-[70px] w-[70px] place-items-center overflow-hidden rounded-[20px] bg-[#0F55D5] p-3 shadow-[0_15px_35px_rgba(15,85,213,0.28)]"><img src={logo} alt="Logo DuyT Booking" className="h-full w-full object-contain" /></div>
          <h1 className="mt-7 text-[30px] font-black tracking-[-0.04em] text-slate-950">DuyT Booking</h1>
          <h2 className="mt-3 text-[22px] font-extrabold tracking-tight">Chào mừng trở lại</h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500">Đăng nhập để quản lý hệ thống của bạn.</p>
        </div>

        <form onSubmit={submit} className="rounded-[22px] border border-white/80 bg-white p-6 shadow-[0_24px_80px_rgba(51,65,85,0.10)] sm:p-10">
          <label className="block"><span className="mb-2.5 block text-sm font-bold text-slate-700">Email hoặc Tên đăng nhập</span><span className="relative block"><Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@duyt.vn" className="h-[56px] w-full rounded-[14px] border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-[#0F55D5] focus:ring-4 focus:ring-[#0F55D5]/10" /></span></label>
          <label className="mt-6 block"><span className="mb-2.5 block text-sm font-bold text-slate-700">Mật khẩu</span><span className="relative block"><LockKeyhole size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="h-[56px] w-full rounded-[14px] border border-slate-200 bg-white pl-12 pr-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-[#0F55D5] focus:ring-4 focus:ring-[#0F55D5]/10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></span></label>

          <div className="mt-5 flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-[#0F55D5]" />Ghi nhớ đăng nhập</label><button type="button" onClick={() => setError('Vui lòng liên hệ quản trị máy chủ để đặt lại ADMIN_PASSWORD.')} className="text-xs font-extrabold text-[#0F55D5] hover:underline">Quên mật khẩu?</button></div>
          {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-700">{error}</div> : null}
          <button type="submit" disabled={loading} className="mt-7 flex h-[58px] w-full items-center justify-center gap-3 rounded-[14px] bg-[#0F55D5] text-base font-extrabold text-white shadow-[0_12px_28px_rgba(15,85,213,0.25)] transition hover:bg-[#0b47b6] active:scale-[0.99] disabled:opacity-60">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}{!loading ? <ArrowRight size={20} /> : null}</button>

          <div className="my-8 flex items-center gap-4"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs font-semibold text-slate-500">Hoặc đăng nhập với</span><span className="h-px flex-1 bg-slate-200" /></div>
          <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={unavailable} className="flex h-[50px] items-center justify-center gap-3 rounded-[13px] border border-slate-200 bg-white text-sm font-bold text-slate-800 transition hover:bg-slate-50"><Fingerprint size={20} />Sinh trắc học</button><button type="button" onClick={unavailable} className="flex h-[50px] items-center justify-center gap-3 rounded-[13px] border border-slate-200 bg-white text-sm font-bold text-slate-800 transition hover:bg-slate-50"><ShieldCheck size={20} />Mã xác thực</button></div>
        </form>

        <footer className="mt-8 text-center text-xs font-medium text-slate-500"><p>© {new Date().getFullYear()} DuyT Booking Admin Portal. Phiên bản 3.0.0</p><div className="mt-3 flex justify-center gap-7"><Link href="/vi" className="underline underline-offset-4 hover:text-slate-800">Chính sách bảo mật</Link><button type="button" onClick={() => setError('Hỗ trợ kỹ thuật: kiểm tra cấu hình ADMIN_EMAIL và ADMIN_PASSWORD trên máy chủ.')} className="underline underline-offset-4 hover:text-slate-800">Hỗ trợ kỹ thuật</button></div></footer>
      </div>
    </main>
  );
}
