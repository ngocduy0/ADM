'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminData } from '../AdminDataProvider';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileAdminChrome } from '../mobile/MobileAdminChrome';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFloorPlanPage = /^\/admin\/venues\/[^/]+\/layout/.test(pathname);
  const isDashboardPage = pathname === '/admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { loading } = useAdminData();

  return (
    <div className="duyt-admin-app min-h-screen bg-[#F7F8FC] text-slate-950">
      <div className="hidden md:block">
        <Sidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      <div className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ${collapsed ? 'lg:pl-[82px]' : 'lg:pl-[280px]'}`}>
        {!isFloorPlanPage ? (
          <div className="hidden md:block">
            <TopNav onMenuClick={() => setMobileOpen(true)} />
          </div>
        ) : null}

        {!isDashboardPage ? <MobileAdminChrome /> : null}

        <main className={mainClassName({ isDashboardPage, isFloorPlanPage })}>
          <div className={contentClassName({ isDashboardPage, isFloorPlanPage })}>
            {loading ? <AdminLoading mobileDashboard={isDashboardPage} /> : children}
          </div>
        </main>
      </div>
    </div>
  );
}

function mainClassName({ isDashboardPage, isFloorPlanPage }: { isDashboardPage: boolean; isFloorPlanPage: boolean }) {
  if (isFloorPlanPage) return 'min-h-0 min-w-0 flex-1 overflow-hidden pt-[calc(66px+env(safe-area-inset-top))] pb-[calc(70px+env(safe-area-inset-bottom))] md:pb-0 md:pt-0';
  if (isDashboardPage) return 'min-w-0 flex-1 overflow-x-hidden p-0 md:p-7 lg:p-8';
  return 'duyt-admin-mobile-content min-w-0 flex-1 overflow-x-hidden px-3 pb-[calc(88px+env(safe-area-inset-bottom))] pt-[calc(76px+env(safe-area-inset-top))] md:p-7 lg:p-8';
}

function contentClassName({ isDashboardPage, isFloorPlanPage }: { isDashboardPage: boolean; isFloorPlanPage: boolean }) {
  if (isFloorPlanPage) return 'h-full min-h-0 w-full';
  if (isDashboardPage) return 'w-full md:mx-auto md:max-w-[1440px]';
  return 'mx-auto max-w-[1440px]';
}

function AdminLoading({ mobileDashboard }: { mobileDashboard: boolean }) {
  return (
    <>
      {mobileDashboard ? (
        <div className="min-h-[100dvh] bg-[#F7F8FC] px-4 pb-24 pt-[calc(80px+env(safe-area-inset-top))] md:hidden" aria-busy="true">
          <div className="mx-auto max-w-[520px] space-y-3">
            <div className="h-12 animate-pulse rounded-2xl bg-white" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-28 animate-pulse rounded-2xl bg-blue-100" />
              <div className="h-28 animate-pulse rounded-2xl bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 animate-pulse rounded-2xl bg-white" />
              <div className="h-20 animate-pulse rounded-2xl bg-white" />
            </div>
            <div className="h-48 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      ) : null}
      <div className={`${mobileDashboard ? 'hidden md:block' : ''} space-y-6`} aria-busy="true">
        <div className="h-16 animate-pulse rounded-2xl bg-white" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-white" />)}
        </div>
        <div className="h-[420px] animate-pulse rounded-2xl bg-white" />
      </div>
    </>
  );
}
