'use client';

import { useMemo, useState } from 'react';
import { Eye, Film, GripVertical, Image as ImageIcon, LayoutGrid, MapPin, Monitor, Save, Settings2, Smartphone, Sparkles, Star, ToggleLeft } from 'lucide-react';
import type { HomepageSectionConfig, HomepageSectionId, SiteSettings } from '@/components/aurelius/siteSettings';
import { useAdminData } from '../AdminDataProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { FormField, inputClass } from '../ui/FormField';
import { PageHeader } from '../ui/PageHeader';
import { cn } from '../utils';

const sectionIcons: Record<HomepageSectionId, React.ElementType> = {
  HERO: ImageIcon,
  FEATURED_VENUES: MapPin,
  REELS_FEED: Film,
  CONCIERGE: Star,
  WHY_DUYT: Sparkles,
  TESTIMONIALS: LayoutGrid,
  FAQ: ToggleLeft,
};

export function HomepagePage() {
  const { settings, venues, saveSettings, saving } = useAdminData();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [selectedId, setSelectedId] = useState<HomepageSectionId>('FEATURED_VENUES');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [dragId, setDragId] = useState<HomepageSectionId | null>(null);


  const sections = useMemo(() => [...draft.homepageSections].sort((a, b) => a.order - b.order), [draft.homepageSections]);
  const selected = sections.find((item) => item.id === selectedId) || sections[0];

  const setSections = (next: HomepageSectionConfig[]) => {
    setDraft((current) => ({ ...current, homepageSections: next.map((item, order) => ({ ...item, order })) }));
  };

  const patchSelected = (patch: Partial<HomepageSectionConfig>) => {
    setSections(sections.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
  };

  const onDrop = (targetId: HomepageSectionId) => {
    if (!dragId || dragId === targetId) return setDragId(null);
    const next = [...sections];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSections(next);
    setDragId(null);
  };

  const toggleVenue = (venueId: string) => {
    const ids = new Set(selected.venueIds || []);
    if (ids.has(venueId)) ids.delete(venueId); else ids.add(venueId);
    patchSelected({ venueIds: Array.from(ids) });
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Quản lý Homepage"
        description="Kéo thả để sắp xếp cấu trúc trang chủ và chỉnh nội dung hiển thị trên website người dùng."
        actions={<><a href="/vi" target="_blank" rel="noreferrer"><Button variant="outline"><Eye size={17} />Preview</Button></a><Button onClick={() => saveSettings(draft)} disabled={saving}><Save size={17} />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button></>}
      />

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <section>
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-slate-800">Cấu trúc trang (kéo thả)</h2>
          <div className="space-y-3">
            {sections.map((section) => {
              const Icon = sectionIcons[section.id];
              return (
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragId(section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => onDrop(section.id)}
                  onClick={() => setSelectedId(section.id)}
                  key={section.id}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition',
                    selected.id === section.id ? 'border-[#1F3A8A]/30 ring-4 ring-[#1F3A8A]/5' : 'border-slate-200 hover:border-slate-300',
                    dragId === section.id && 'opacity-45',
                  )}
                >
                  <GripVertical size={18} className="shrink-0 text-slate-300" />
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E9EDFB] text-[#1F3A8A]"><Icon size={20} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-950">{section.title}</span><span className="mt-1 block truncate text-[11px] font-medium text-slate-500">{section.subtitle}</span></span>
                  <span onClick={(event) => { event.stopPropagation(); setSections(sections.map((item) => item.id === section.id ? { ...item, enabled: !item.enabled } : item)); }} className={cn('relative h-6 w-10 shrink-0 rounded-full transition', section.enabled ? 'bg-emerald-500' : 'bg-slate-200')}><span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition', section.enabled ? 'left-5' : 'left-1')} /></span>
                  <Settings2 size={17} className="shrink-0 text-slate-400" />
                </button>
              );
            })}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 px-4 py-4 text-center text-xs font-bold text-slate-400">Thứ tự được áp dụng ngay trên frontend sau khi lưu</div>
          </div>
        </section>

        <Card className="p-0">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-bold text-slate-400">Chỉnh sửa section</p><h2 className="mt-1 text-xl font-black text-slate-950">{selected.title}</h2></div>
            <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1">
              <button onClick={() => setPreviewMode('desktop')} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black', previewMode === 'desktop' ? 'bg-slate-100 text-slate-950' : 'text-slate-500')}><Monitor size={15} />Desktop</button>
              <button onClick={() => setPreviewMode('mobile')} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black', previewMode === 'mobile' ? 'bg-slate-100 text-slate-950' : 'text-slate-500')}><Smartphone size={15} />Mobile</button>
            </div>
          </div>

          <div className="grid gap-6 p-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5 rounded-3xl bg-slate-50 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Tiêu đề section"><input className={inputClass} value={selected.title} onChange={(event) => patchSelected({ title: event.target.value })} /></FormField>
                <FormField label="Trạng thái"><button type="button" onClick={() => patchSelected({ enabled: !selected.enabled })} className={cn(inputClass, 'flex items-center justify-between text-left')}><span>{selected.enabled ? 'Đang hiển thị' : 'Đang ẩn'}</span><span className={cn('h-3 w-3 rounded-full', selected.enabled ? 'bg-emerald-500' : 'bg-slate-300')} /></button></FormField>
                <FormField label="Mô tả phụ" className="md:col-span-2"><input className={inputClass} value={selected.subtitle} onChange={(event) => patchSelected({ subtitle: event.target.value })} /></FormField>
              </div>

              {selected.id === 'FEATURED_VENUES' ? (
                <div>
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider text-slate-700">Danh sách địa điểm</p><p className="text-xs font-bold text-[#1F3A8A]">Chọn 1–6 mục</p></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {venues.map((venue) => {
                      const checked = (selected.venueIds || []).includes(venue.id);
                      return <button type="button" key={venue.id} onClick={() => toggleVenue(venue.id)} className={cn('flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition', checked ? 'border-[#1F3A8A] ring-2 ring-[#1F3A8A]/10' : 'border-slate-200')}><img src={venue.image || '/about.jpg'} alt="" className="h-12 w-12 rounded-xl object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{venue.name}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{venue.category}</span></span><span className={cn('grid h-5 w-5 place-items-center rounded-md border text-[11px] font-black', checked ? 'border-[#1F3A8A] bg-[#1F3A8A] text-white' : 'border-slate-300')}>{checked ? '✓' : ''}</span></button>;
                    })}
                  </div>
                </div>
              ) : null}

              {selected.id === 'HERO' ? <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-medium leading-5 text-blue-800">Video và poster hero được quản lý tại trang Banners. Tại đây bạn có thể kéo section Hero đến vị trí mong muốn hoặc tắt hoàn toàn.</div> : null}
              {selected.id === 'REELS_FEED' ? <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-xs font-medium leading-5 text-violet-800">Reels được lấy theo trạng thái và thứ tự trong trang Quản lý Reels. Chỉ Reel đang bật mới xuất hiện.</div> : null}
            </div>

            <div className={cn('mx-auto w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl transition-all', previewMode === 'mobile' ? 'max-w-[300px]' : 'max-w-full')}>
              <div className="flex h-9 items-center gap-1 border-b border-slate-100 px-3"><span className="h-2 w-2 rounded-full bg-red-300" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-300" /></div>
              <div className="p-4">
                <div className="relative overflow-hidden rounded-2xl bg-slate-950">
                  <img src={draft.heroPosterUrl || venues[0]?.image || '/about.jpg'} alt="" className="aspect-video w-full object-cover opacity-75" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-[9px] font-bold uppercase tracking-widest text-white/60">{draft.brandName}</p><p className="mt-1 text-sm font-black">{selected.title}</p><p className="mt-1 text-[10px] text-white/70">{selected.subtitle}</p></div>
                </div>
                {selected.id === 'FEATURED_VENUES' ? <div className={cn('mt-3 grid gap-2', previewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-2')}>{venues.filter((venue) => !(selected.venueIds || []).length || (selected.venueIds || []).includes(venue.id)).slice(0, 4).map((venue) => <div key={venue.id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2"><img src={venue.image} alt="" className="h-9 w-9 rounded-lg object-cover" /><span className="truncate text-[10px] font-black">{venue.name}</span></div>)}</div> : null}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
