'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminData } from '../AdminDataProvider';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFloorPlanPage = /^\/admin\/venues\/[^/]+\/layout/.test(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { loading } = useAdminData();

  return (
    <div className="duyt-admin-app min-h-screen bg-[#F7F8FC] text-slate-950">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ${collapsed ? 'lg:pl-[82px]' : 'lg:pl-[280px]'}`}>
        {!isFloorPlanPage ? <TopNav onMenuClick={() => setMobileOpen(true)} /> : null}
        <main className={isFloorPlanPage ? "min-h-0 min-w-0 flex-1 overflow-hidden" : "min-w-0 flex-1 overflow-x-hidden p-4 md:p-7 lg:p-8"}>
          <div className={isFloorPlanPage ? "h-full min-h-0 w-full" : "mx-auto max-w-[1440px]"}>
            {loading ? <AdminLoading /> : children}
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-16 animate-pulse rounded-2xl bg-white" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-white" />)}
      </div>
      <div className="h-[420px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
