'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react';
import { useAdminData } from '../AdminDataProvider';
import { cn } from '../utils';
import { adminNavigation } from './navigation';

export function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const { settings, logout, unreadCount } = useAdminData();
  const sections = adminNavigation.reduce<Record<string, typeof adminNavigation>>((result, item) => {
    (result[item.section] ||= []).push(item);
    return result;
  }, {});

  return (
    <>
      {mobileOpen ? <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} /> : null}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-slate-200 bg-[#F7F8FC] transition-all duration-300',
        collapsed ? 'w-[82px]' : 'w-[280px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className={cn('relative flex shrink-0 items-center px-5 py-5', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#1F3A8A] shadow-lg shadow-[#1F3A8A]/20">
            <img src={settings.logoUrl || '/duyt-logo.png'} alt="Logo DuyT Booking" className="h-8 w-8 object-contain" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-[#1F3A8A]">DuyT Booking</h1>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Quản trị viên</p>
            </div>
          ) : null}
          <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-200 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={19} /></button>
          <button
            className="absolute -right-3 top-7 hidden h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-[#1F3A8A] lg:grid"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-6">
            {Object.entries(sections).map(([section, items]) => (
              <section key={section}>
                {!collapsed ? <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{section}</p> : null}
                <div className="space-y-1">
                  {items.map((item) => {
                    const active = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const badge = item.href === '/admin/notifications' ? unreadCount : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.name : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-200',
                          active ? 'bg-[#D9DFF5] text-[#1F3A8A]' : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-950',
                          collapsed && 'justify-center px-0',
                        )}
                      >
                        <item.icon size={20} className="shrink-0" />
                        {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.name}</span> : null}
                        {!collapsed && badge > 0 ? <span className="grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">{badge > 99 ? '99+' : badge}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="mt-auto shrink-0 border-t border-slate-200 p-4">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white">
              <img src="/avatar%20DuyT.jpg" alt="Quản trị viên" className="h-full w-full object-cover" />
            </div>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900">Duy T.</p>
                <p className="truncate text-xs font-medium text-slate-500">Admin</p>
              </div>
            ) : null}
            {!collapsed ? <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600" aria-label="Đăng xuất"><LogOut size={18} /></button> : null}
          </div>
        </div>
      </aside>
    </>
  );
}
