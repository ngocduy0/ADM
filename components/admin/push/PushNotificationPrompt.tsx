'use client';

import { useEffect, useState } from 'react';
import { BellRing, Loader2, X } from 'lucide-react';
import { enableAdminPush, readBrowserPushState } from '@/lib/admin-push-client';
import { useAdminData } from '../AdminDataProvider';

const DISMISS_KEY = 'duyt-push-prompt-dismissed';

export function PushNotificationPrompt() {
  const { showToast } = useAdminData();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
      const state = await readBrowserPushState(false).catch(() => null);
      if (!active || !state) return;
      const shouldShow = state.supported
        && state.configured
        && state.permission === 'default'
        && !state.subscribed
        && !state.serverError
        && (!state.isIOS || state.standalone);
      setVisible(shouldShow);
    }, 1_200);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      await enableAdminPush();
      setVisible(false);
      showToast('success', 'Đã bật thông báo ngoài màn hình cho DuyT Admin.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không bật được thông báo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-[520px] rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,.2)] md:hidden" aria-label="Bật thông báo đẩy">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white"><BellRing size={21} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">Nhận booking ngay khi app đóng</p>
          <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">Bật thông báo và âm thanh trên iPhone.</p>
        </div>
        <button type="button" onClick={dismiss} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 active:bg-slate-100" aria-label="Đóng lời nhắc"><X size={17} /></button>
      </div>
      <button type="button" onClick={enable} disabled={busy} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-60">
        {busy ? <Loader2 size={17} className="animate-spin" /> : <BellRing size={17} />}
        {busy ? 'Đang bật...' : 'Bật thông báo ngay'}
      </button>
    </aside>
  );
}
