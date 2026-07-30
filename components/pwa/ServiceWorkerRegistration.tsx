'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    let reloading = false;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await registration.update().catch(() => undefined);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.warn('Không thể đăng ký service worker:', error);
      }
    };

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    register();

    const onFocus = () => {
      navigator.serviceWorker.getRegistration('/').then((registration) => registration?.update()).catch(() => undefined);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return null;
}
