'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    let cancelled = false;
    let reloading = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const register = async () => {
      if (cancelled) return;
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Không thể đăng ký service worker:', error);
        }
      }
    };

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Service worker is useful, but it does not need to compete with the first
    // render, hero media and critical API requests on slower mobile devices.
    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (win.requestIdleCallback) {
      idleId = win.requestIdleCallback(() => void register(), { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(() => void register(), 900);
    }

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      if (idleId != null) win.cancelIdleCallback?.(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
