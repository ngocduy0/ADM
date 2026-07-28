'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  BellOff,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Send,
  Smartphone,
} from 'lucide-react';
import {
  disableAdminPush,
  enableAdminPush,
  readBrowserPushState,
  sendAdminPushTest,
  type BrowserPushState,
} from '@/lib/admin-push-client';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function PushNotificationSettings() {
  const { showToast } = useAdminData();
  const [state, setState] = useState<BrowserPushState | null>(null);
  const [busy, setBusy] = useState<'enable' | 'disable' | 'test' | 'refresh' | null>('refresh');
  const [error, setError] = useState('');

  const refresh = useCallback(async (syncExisting = false) => {
    try {
      const next = await readBrowserPushState(syncExisting);
      setState(next);
      setError('');
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Không kiểm tra được trạng thái Web Push.');
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
  }, [refresh]);

  const enable = async () => {
    setBusy('enable');
    setError('');
    try {
      await enableAdminPush();
      await refresh(true);
      showToast('success', 'Đã bật thông báo booking và liên hệ trên thiết bị này.');
    } catch (enableError) {
      const message = enableError instanceof Error ? enableError.message : 'Không bật được thông báo.';
      setError(message);
      showToast('error', message);
      setBusy(null);
    }
  };

  const disable = async () => {
    setBusy('disable');
    setError('');
    try {
      await disableAdminPush();
      await refresh(false);
      showToast('success', 'Đã tắt thông báo trên thiết bị này.');
    } catch (disableError) {
      const message = disableError instanceof Error ? disableError.message : 'Không tắt được thông báo.';
      setError(message);
      showToast('error', message);
      setBusy(null);
    }
  };

  const sendTest = async () => {
    setBusy('test');
    setError('');
    try {
      await sendAdminPushTest();
      showToast('success', 'Đã gửi thông báo thử. Hãy kiểm tra màn hình khóa hoặc Trung tâm thông báo.');
    } catch (testError) {
      const message = testError instanceof Error ? testError.message : 'Không gửi được thông báo thử.';
      setError(message);
      showToast('error', message);
    } finally {
      setBusy(null);
    }
  };

  const status = getStatus(state);

  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${status.iconClass}`}>
          {busy === 'refresh' ? <Loader2 size={23} className="animate-spin" /> : status.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black">Thông báo đẩy trên iPhone</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Nhận booking và liên hệ mới kể cả khi PWA đang đóng hoặc màn hình đã khóa.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${status.badgeClass}`}>
              {status.label}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PushFact
              title="Thiết bị hiện tại"
              value={state?.isIOS ? (state.standalone ? 'iPhone PWA' : 'Safari iPhone') : 'Trình duyệt'}
              ok={!state?.isIOS || Boolean(state.standalone)}
            />
            <PushFact
              title="Quyền hệ thống"
              value={permissionLabel(state?.permission)}
              ok={state?.permission === 'granted'}
            />
            <PushFact
              title="Thiết bị đã đăng ký"
              value={`${state?.enabledCount || 0} thiết bị`}
              ok={Boolean(state?.subscribed)}
            />
          </div>

          {state?.isIOS && !state.standalone ? (
            <Notice tone="warning">
              Trên iPhone, hãy mở website bằng Safari, chọn “Thêm vào Màn hình chính”, sau đó mở từ icon DuyT rồi bật thông báo.
            </Notice>
          ) : null}

          {state && !state.secure ? (
            <Notice tone="danger">Web Push yêu cầu domain HTTPS. Địa chỉ HTTP nội bộ chỉ dùng để xem giao diện.</Notice>
          ) : null}

          {state && !state.configured ? (
            <Notice tone="danger">
              Deployment đang thiếu VAPID key hoặc SUPABASE_SERVICE_ROLE_KEY. Hãy bổ sung biến môi trường và redeploy.
            </Notice>
          ) : null}

          {state?.permission === 'denied' ? (
            <Notice tone="danger">
              Quyền đã bị từ chối. Mở Cài đặt iPhone → Thông báo → DuyT Admin và bật “Cho phép thông báo”, “Âm thanh”.
            </Notice>
          ) : null}

          {state?.serverError ? <Notice tone="danger">{state.serverError}</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {!state?.subscribed ? (
              <Button
                onClick={enable}
                disabled={Boolean(busy) || !state?.supported || !state?.configured || Boolean(state?.isIOS && !state?.standalone)}
              >
                {busy === 'enable' ? <Loader2 size={17} className="animate-spin" /> : <BellRing size={17} />}
                {busy === 'enable' ? 'Đang bật...' : 'Bật thông báo'}
              </Button>
            ) : (
              <>
                <Button onClick={sendTest} disabled={Boolean(busy)}>
                  {busy === 'test' ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  {busy === 'test' ? 'Đang gửi...' : 'Gửi thông báo thử'}
                </Button>
                <Button variant="outline" onClick={disable} disabled={Boolean(busy)}>
                  {busy === 'disable' ? <Loader2 size={17} className="animate-spin" /> : <BellOff size={17} />}
                  Tắt trên thiết bị này
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => { setBusy('refresh'); void refresh(true); }} disabled={Boolean(busy)}>
              Kiểm tra lại
            </Button>
          </div>

          <p className="mt-4 text-xs font-medium leading-5 text-slate-400">
            Âm thanh do iOS quản lý. Hãy bảo đảm iPhone không ở chế độ im lặng và Focus không chặn DuyT Admin.
          </p>
        </div>
      </div>
    </Card>
  );
}

function getStatus(state: BrowserPushState | null) {
  if (!state) {
    return {
      label: 'Đang kiểm tra',
      badgeClass: 'bg-slate-100 text-slate-600',
      iconClass: 'bg-slate-100 text-slate-500',
      icon: <Smartphone size={23} />,
    };
  }
  if (state.subscribed && state.permission === 'granted') {
    return {
      label: 'Đã bật',
      badgeClass: 'bg-emerald-50 text-emerald-700',
      iconClass: 'bg-emerald-50 text-emerald-600',
      icon: <CheckCircle2 size={23} />,
    };
  }
  if (!state.supported || !state.configured || state.permission === 'denied') {
    return {
      label: 'Cần xử lý',
      badgeClass: 'bg-red-50 text-red-700',
      iconClass: 'bg-red-50 text-red-600',
      icon: <CircleAlert size={23} />,
    };
  }
  return {
    label: 'Chưa bật',
    badgeClass: 'bg-amber-50 text-amber-700',
    iconClass: 'bg-amber-50 text-amber-600',
    icon: <BellRing size={23} />,
  };
}

function permissionLabel(permission: BrowserPushState['permission'] | undefined) {
  if (permission === 'granted') return 'Đã cho phép';
  if (permission === 'denied') return 'Đã từ chối';
  if (permission === 'default') return 'Chưa yêu cầu';
  return 'Không hỗ trợ';
}

function PushFact({ title, value, ok }: { title: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 size={15} className="text-emerald-600" /> : <CircleAlert size={15} className="text-amber-500" />}
        <p className="text-xs font-extrabold text-slate-500">{title}</p>
      </div>
      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function Notice({ children, tone }: { children: ReactNode; tone: 'warning' | 'danger' }) {
  const classes = tone === 'danger'
    ? 'border-red-100 bg-red-50 text-red-700'
    : 'border-amber-100 bg-amber-50 text-amber-800';
  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs font-semibold leading-5 ${classes}`}>{children}</div>;
}
