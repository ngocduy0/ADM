import React, { useMemo, useState } from 'react';
import { Lock, MapPin, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { PreferredTable, Venue, VenueFloorPlanTheme, VenueMapElement, VenueTableZone } from '../types';
import { formatVnd } from '../localize';

interface FloorPlanSelectorProps {
  venue: Venue;
  selectedTableId?: string;
  onSelectTable?: (table: PreferredTable) => void;
  onRequestTable?: (table: PreferredTable) => void;
  compact?: boolean;
  adminPreview?: boolean;
}

const DEFAULT_ZONE_COLORS = ['#D6A85F', '#C92A2A', '#8B5CF6', '#2563EB', '#16A34A', '#F08A24'];
const DEFAULT_TABLE_COLOR = '#D6A85F';

const THEME_PRESETS: Record<NonNullable<VenueFloorPlanTheme['style']>, VenueFloorPlanTheme> = {
  NIGHTCLUB: {
    style: 'NIGHTCLUB',
    ratio: 'PORTRAIT',
    backgroundColor: '#070A12',
    accentColor: '#D6A85F',
    surfaceColor: '#111827',
    gridColor: 'rgba(255,255,255,0.055)',
    texture: 'GRID',
    helperText: 'Chọn khu hoặc chạm vào bàn để xem giá, sức chứa và quy tắc giữ chỗ.',
    showGrid: true,
  },
  BLUEPRINT: {
    style: 'BLUEPRINT',
    ratio: 'LANDSCAPE',
    backgroundColor: '#071432',
    accentColor: '#38D6F0',
    surfaceColor: '#0E3E89',
    gridColor: 'rgba(177,220,255,0.13)',
    texture: 'GRID',
    helperText: 'Layout kỹ thuật dễ nhìn cho ADM Club hoặc sơ đồ có nhiều khu bàn.',
    showGrid: true,
  },
  BEACH: {
    style: 'BEACH',
    ratio: 'LANDSCAPE',
    backgroundColor: '#F3E7C9',
    accentColor: '#B9802C',
    surfaceColor: '#EBD7AB',
    gridColor: 'rgba(111,85,42,0.13)',
    texture: 'WOOD',
    helperText: 'Layout sáng dự phòng cho không gian cần sơ đồ rộng.',
    showGrid: true,
  },
  LOUNGE: {
    style: 'LOUNGE',
    ratio: 'SQUARE',
    backgroundColor: '#15110F',
    accentColor: '#E3B36D',
    surfaceColor: '#211A16',
    gridColor: 'rgba(227,179,109,0.08)',
    texture: 'CARPET',
    helperText: 'Layout riêng tư, phù hợp phòng karaoke và các khu phòng riêng.',
    showGrid: false,
  },
  YACHT: {
    style: 'YACHT',
    ratio: 'LANDSCAPE',
    backgroundColor: '#EDE8DE',
    accentColor: '#8B5E34',
    surfaceColor: '#F8F3E8',
    gridColor: 'rgba(93,67,42,0.14)',
    texture: 'WOOD',
    helperText: 'Layout dự phòng cho không gian sofa, phòng riêng hoặc khu VIP.',
    showGrid: true,
  },
  MINIMAL: {
    style: 'MINIMAL',
    ratio: 'PORTRAIT',
    backgroundColor: '#101217',
    accentColor: '#D6A85F',
    surfaceColor: '#161A22',
    gridColor: 'rgba(255,255,255,0.04)',
    texture: 'NONE',
    helperText: 'Layout tối giản để khách tập trung vào bàn, khu và giá.',
    showGrid: false,
  },
};

function clamp(value: unknown, fallback: number, min = 0, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function getTheme(venue: Venue): VenueFloorPlanTheme {
  const style = venue.floorPlanTheme?.style || (venue.category === 'Karaoke' ? 'LOUNGE' : 'NIGHTCLUB');
  return { ...THEME_PRESETS[style], ...(venue.floorPlanTheme || {}), style };
}

function getAspectClass(theme: VenueFloorPlanTheme) {
  if (theme.ratio === 'LANDSCAPE') return 'aspect-[16/10] max-w-[760px]';
  if (theme.ratio === 'SQUARE') return 'aspect-square max-w-[640px]';
  return 'aspect-[82/130] max-w-[560px]';
}

function getMapBackground(theme: VenueFloorPlanTheme): React.CSSProperties {
  const base = theme.backgroundColor || '#070A12';
  const surface = theme.surfaceColor || '#111827';
  const accent = theme.accentColor || '#D6A85F';
  const texture = theme.texture || 'GRID';
  const grid = theme.showGrid !== false ? `${theme.gridColor || 'rgba(255,255,255,0.055)'}` : 'transparent';

  const textureLayer = texture === 'WOOD'
    ? `repeating-linear-gradient(0deg, rgba(255,255,255,0.075) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(69,41,17,0.08) 0 1px, transparent 1px 32px)`
    : texture === 'CARPET'
      ? `radial-gradient(circle at 30% 20%, ${accent}18, transparent 30%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05), transparent 30%)`
      : texture === 'POOL'
        ? `radial-gradient(ellipse at 50% 30%, #60D8F740, transparent 42%), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`
        : texture === 'GRID'
          ? `linear-gradient(90deg, ${grid} 1px, transparent 1px), linear-gradient(180deg, ${grid} 1px, transparent 1px)`
          : `linear-gradient(180deg, transparent, transparent)`;

  return {
    backgroundColor: base,
    backgroundImage: `${textureLayer}, radial-gradient(circle at 50% 14%, ${accent}20, transparent 34%), linear-gradient(180deg, ${surface}, ${base})`,
    backgroundSize: texture === 'GRID' ? '10% 10%, 10% 10%, auto, auto' : undefined,
  };
}

function getTableZone(table: PreferredTable, zones: VenueTableZone[]) {
  return zones.find((zone) => zone.id === table.zoneId) || zones.find((zone) => zone.name === table.area || zone.label === table.area);
}

function buildZones(venue: Venue): VenueTableZone[] {
  const explicit = Array.isArray(venue.tableZones) ? venue.tableZones.filter((zone) => zone.isActive !== false) : [];
  if (explicit.length) return explicit.sort((a, b) => (a.order || 0) - (b.order || 0));

  const areas = Array.from(new Set((venue.preferredTables || []).map((table) => table.area || 'VIP Area')));
  return areas.map((area, index) => {
    const tables = venue.preferredTables.filter((table) => table.area === area);
    const spendList = tables.map((table) => table.minimumSpend || 0).filter(Boolean);
    const minSpend = spendList.length ? Math.min(...spendList) : tables[0]?.minimumSpend || 0;
    const capacity = Math.max(...tables.map((table) => table.capacity || 0), tables[0]?.capacity || 2);
    return {
      id: `zone-${area.toLowerCase().replace(/[^a-z0-9]+/g, '-') || index}`,
      name: area,
      label: area,
      description: `Khu ${area} có ${tables.length} bàn đang quản lý trong hệ thống.`,
      minimumSpend: minSpend,
      capacity,
      color: DEFAULT_ZONE_COLORS[index % DEFAULT_ZONE_COLORS.length],
      order: index + 1,
      isActive: true,
    };
  });
}

function buildTables(venue: Venue, zones: VenueTableZone[]) {
  return (venue.preferredTables || [])
    .filter((table) => table.status !== 'HIDDEN')
    .map((table, index) => {
      const zone = getTableZone(table, zones);
      const fallbackColumn = index % 5;
      const fallbackRow = Math.floor(index / 5);
      return {
        ...table,
        zoneId: table.zoneId || zone?.id,
        color: table.color || zone?.color || DEFAULT_TABLE_COLOR,
        x: clamp(table.x, 18 + fallbackColumn * 14),
        y: clamp(table.y, 24 + fallbackRow * 9),
        width: clamp(table.width, table.shape === 'ROUND' ? 7 : 10, 3, 45),
        height: clamp(table.height, table.shape === 'ROUND' ? 7 : 5.8, 3, 35),
        rotation: Number(table.rotation) || 0,
        shape: table.shape || 'RECT',
        status: table.status || 'AVAILABLE',
        bookingMode: table.bookingMode || 'REQUEST',
        sortOrder: table.sortOrder || index + 1,
      } as PreferredTable;
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

function defaultElements(venue: Venue): VenueMapElement[] {
  if (venue.category === 'Karaoke') {
    return [
      { id: 'default-ktv-reception', type: 'CUSTOM', label: 'Lễ tân', x: 16, y: 88, width: 22, height: 7, color: '#D6A85F', order: 1 },
      { id: 'default-ktv-corridor', type: 'WALKWAY', label: 'Lối đi chính', x: 50, y: 50, width: 10, height: 76, color: '#D6A85F', order: 2 },
      { id: 'default-ktv-room', type: 'VIP_ROOM', label: 'Phòng riêng', x: 30, y: 34, width: 26, height: 16, color: '#8B5CF6', order: 3 },
      { id: 'default-ktv-suite', type: 'KTV', label: 'Phòng hát VIP', x: 70, y: 34, width: 26, height: 16, color: '#2563EB', order: 4 },
      { id: 'default-ktv-bar', type: 'BAR', label: 'Quầy đồ uống', x: 70, y: 74, width: 24, height: 8, color: '#F08A24', order: 5 },
    ];
  }

  return [
    { id: 'default-dj', type: 'DJ', label: 'DJ', x: 50, y: 7, width: 38, height: 6, color: '#A855F7', order: 1 },
    { id: 'default-stage', type: 'STAGE', label: 'Sân khấu', x: 50, y: 16, width: 28, height: 5, color: '#EC4899', order: 2 },
    { id: 'default-bar', type: 'BAR', label: 'Quầy bar', x: 50, y: 74, width: 34, height: 7, color: '#2563EB', order: 3 },
    { id: 'default-door', type: 'DOOR', label: 'Lối vào', x: 50, y: 94, width: 24, height: 5, color: '#D6A85F', order: 4 },
  ];
}

function buildElements(venue: Venue) {
  const explicit = Array.isArray(venue.floorPlanElements) ? venue.floorPlanElements.filter((item) => item.isActive !== false) : [];
  return (explicit.length ? explicit : defaultElements(venue))
    .map((item, index) => ({
      ...item,
      x: clamp(item.x, 50),
      y: clamp(item.y, 50),
      width: clamp(item.width, 20, 2, 95),
      height: clamp(item.height, 5, 2, 70),
      rotation: Number(item.rotation) || 0,
      color: item.color || '#D6A85F',
      order: Number(item.order) || index + 1,
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function textColorFor(hex = '') {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 170 ? '#111827' : '#FFFFFF';
}

function statusLabel(status?: PreferredTable['status']) {
  if (status === 'RESERVED') return 'Đã giữ';
  if (status === 'INQUIRY') return 'Cần xác nhận';
  if (status === 'HIDDEN') return 'Ẩn';
  return 'Có thể yêu cầu';
}

function modeLabel(mode?: PreferredTable['bookingMode']) {
  if (mode === 'BIDDING') return 'Cần báo giá';
  if (mode === 'LOTTERY') return 'Theo lịch xác nhận';
  if (mode === 'MESSAGE_ONLY') return 'Cần xác nhận';
  return 'Cần xác nhận';
}

function StatusPill({ status }: { status?: PreferredTable['status'] }) {
  const cls = status === 'RESERVED'
    ? 'bg-red-500/15 text-red-200 border-red-400/25'
    : status === 'INQUIRY'
      ? 'bg-amber-400/15 text-amber-100 border-amber-300/25'
      : 'bg-emerald-400/15 text-emerald-100 border-emerald-300/25';
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>{statusLabel(status)}</span>;
}

function MapElement({ element }: { element: VenueMapElement }) {
  const color = element.color || '#D6A85F';
  const isLabel = element.type === 'LABEL';
  const isWalkway = element.type === 'WALKWAY';
  const isPool = element.type === 'POOL';
  const isVerticalRoom = element.type === 'KTV' || element.type === 'VIP_ROOM';
  const style: React.CSSProperties = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    transform: `translate(-50%, -50%) rotate(${Number(element.rotation) || 0}deg)`,
    borderColor: `${color}77`,
    background: isPool
      ? `radial-gradient(circle at 55% 35%, rgba(255,255,255,0.55), transparent 8%), linear-gradient(180deg, ${color}82, #36A9CF)`
      : isWalkway
        ? `${color}12`
        : `linear-gradient(180deg, ${color}2D, rgba(0,0,0,0.22))`,
    color: isLabel ? color : '#FFFFFF',
    borderRadius: isPool ? '999px' : isVerticalRoom ? '16px' : undefined,
    boxShadow: element.type === 'DJ' || element.type === 'STAGE' ? `0 0 32px ${color}3A` : undefined,
  };

  return (
    <div
      className={`absolute flex items-center justify-center border text-center font-black uppercase pointer-events-none ${isWalkway ? 'rounded-sm border-dashed' : 'rounded-xl'} ${isLabel ? 'bg-transparent text-[9px] tracking-[0.18em]' : 'text-[9px] tracking-[0.22em]'}`}
      style={style}
      aria-hidden="true"
    >
      <span className="truncate px-2">{element.label}</span>
    </div>
  );
}

export default function FloorPlanSelector({ venue, selectedTableId, onSelectTable, onRequestTable, compact = false, adminPreview = false }: FloorPlanSelectorProps) {
  const theme = useMemo(() => getTheme(venue), [venue]);
  const zones = useMemo(() => buildZones(venue), [venue]);
  const tables = useMemo(() => buildTables(venue, zones), [venue, zones]);
  const elements = useMemo(() => buildElements(venue), [venue]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');
  const [zoom, setZoom] = useState(1);
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const visibleTables = selectedZoneId === 'ALL' ? tables : tables.filter((table) => (table.zoneId || getTableZone(table, zones)?.id) === selectedZoneId);
  const selectedZone = selectedZoneId === 'ALL' ? null : zones.find((zone) => zone.id === selectedZoneId);
  const handleZoneSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);

    if (zoneId === 'ALL') return;

    const zoneTables = tables.filter((table) => (table.zoneId || getTableZone(table, zones)?.id) === zoneId);
    const currentStillVisible = zoneTables.some((table) => table.id === selectedTableId);
    if (!currentStillVisible && zoneTables[0]) onSelectTable?.(zoneTables[0]);
  };
  const aspectClass = getAspectClass(theme);
  const isLightTheme = ['BEACH', 'YACHT'].includes(theme.style);

  return (
    <div className={`rounded-[28px] border border-gold/10 bg-[#080A0F] text-on-surface shadow-2xl shadow-black/30 ${compact ? 'p-3 space-y-3' : 'p-4 space-y-5'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Sơ đồ bàn</p>
          <h3 className={`${compact ? 'text-lg' : 'text-xl'} mt-1 font-serif text-white`}>Chọn khu trước, sau đó chọn bàn</h3>
          {!compact && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/55">{theme.helperText || 'Mỗi địa điểm có sơ đồ riêng. Chọn bàn hoặc phòng để xem minimum spend, sức chứa và trạng thái yêu cầu.'}</p>}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => handleZoneSelect('ALL')}
          className={`min-w-[150px] rounded-2xl border p-3 text-left transition ${selectedZoneId === 'ALL' ? 'border-gold bg-gold/15' : 'border-white/10 bg-white/[0.035] hover:border-gold/40'}`}
        >
          <p className="text-xs font-bold text-white">Tất cả khu</p>
          <p className="mt-1 text-[11px] text-white/50">{tables.length} bàn · toàn bộ layout</p>
        </button>
        {zones.map((zone) => {
          const count = tables.filter((table) => (table.zoneId || getTableZone(table, zones)?.id) === zone.id).length;
          return (
            <button
              type="button"
              key={zone.id}
              onClick={() => handleZoneSelect(zone.id)}
              className={`min-w-[170px] rounded-2xl border p-3 text-left transition ${selectedZoneId === zone.id ? 'border-gold bg-gold/15' : 'border-white/10 bg-white/[0.035] hover:border-gold/40'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-white">{zone.label || zone.name}</p>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
              </div>
              <p className="mt-1 text-[11px] text-white/50">Từ {formatVnd(zone.minimumSpend)} · {count} bàn</p>
            </button>
          );
        })}
      </div>

      <div className={`grid gap-5 ${compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]'}`}>
        <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#10131A] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold text-white/55">Zoom để xem rõ nhiều bàn.</p>
            <div className="flex gap-1">
              <button type="button" onClick={() => setZoom((value) => Math.max(0.8, value - 0.12))} className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-white"><ZoomOut className="h-4 w-4" /></button>
              <button type="button" onClick={() => setZoom((value) => Math.min(1.6, value + 0.12))} className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-white"><ZoomIn className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="overflow-auto rounded-[20px] border border-white/10 bg-black/35 p-3">
            <div className={`relative mx-auto w-full overflow-hidden rounded-[22px] border border-white/10 shadow-2xl shadow-black/25 ${aspectClass}`} style={{ ...getMapBackground(theme), transform: `scale(${zoom})`, transformOrigin: 'top center', marginBottom: zoom > 1 ? `${(zoom - 1) * 220}px` : undefined }}>
              {theme.showGrid !== false && <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px), linear-gradient(180deg, ${theme.gridColor} 1px, transparent 1px)`, backgroundSize: '10% 10%' }} />}
              <div className="absolute inset-[2.5%] rounded-[18px] border border-white/10 bg-white/[0.025]" />
              {elements.map((element) => <MapElement key={element.id} element={element} />)}

              {visibleTables.map((table) => {
                const isSelected = table.id === selectedTableId;
                const disabled = table.status === 'RESERVED' && !adminPreview;
                const fill = table.color || DEFAULT_TABLE_COLOR;
                const label = table.name.length > 10 ? table.name.slice(0, 10) : table.name;
                const borderColor = isSelected ? '#F7D991' : isLightTheme ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)';
                const commonStyle: React.CSSProperties = {
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  width: `${table.width}%`,
                  height: `${table.height}%`,
                  transform: `translate(-50%, -50%) rotate(${Number(table.rotation) || 0}deg)`,
                  background: `linear-gradient(180deg, ${fill}, rgba(0,0,0,0.42))`,
                  color: textColorFor(fill),
                  borderColor,
                  boxShadow: isSelected ? '0 0 0 2px rgba(214,168,95,0.9), 0 0 30px rgba(214,168,95,0.55)' : '0 8px 18px rgba(0,0,0,0.38)',
                  opacity: disabled ? 0.38 : 1,
                };

                return (
                  <button
                    type="button"
                    key={table.id}
                    disabled={disabled}
                    onClick={() => onSelectTable?.(table)}
                    className={`absolute z-10 flex items-center justify-center border text-[10px] font-black uppercase tracking-tight transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold ${table.shape === 'ROUND' ? 'rounded-full' : table.shape === 'SOFA' ? 'rounded-2xl' : table.shape === 'BAR' ? 'rounded-md' : 'rounded-lg'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    style={commonStyle}
                    title={`${table.name} · ${formatVnd(table.minimumSpend)} · max ${table.capacity}`}
                  >
                    {table.status === 'RESERVED' ? <Lock className="h-3 w-3" /> : label}
                    {table.badge && table.badge !== 'NONE' && <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-[8px] text-black">{table.badge[0]}</span>}
                  </button>
                );
              })}

            </div>
          </div>
        </div>

        {!compact && (
          <aside className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
            {selectedTable ? (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${selectedTable.color || getTableZone(selectedTable, zones)?.color || DEFAULT_TABLE_COLOR}, rgba(0,0,0,0.65))` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-80">{selectedTable.area}</p>
                  <h4 className="mt-1 text-3xl font-black tracking-tight">{selectedTable.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Chi tiêu tối thiểu</p>
                    <p className="mt-1 font-bold text-gold">{formatVnd(selectedTable.minimumSpend)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Sức chứa</p>
                    <p className="mt-1 font-bold text-white">Tối đa {selectedTable.capacity}</p>
                  </div>
                </div>
                {!adminPreview && <button type="button" onClick={() => onRequestTable?.(selectedTable)} className="w-full rounded-2xl bg-gold px-5 py-3 text-sm font-black uppercase tracking-widest text-black transition hover:bg-gold-light">Gửi yêu cầu concierge</button>}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center">
                {selectedZone ? <MapPin className="mb-4 h-9 w-9 text-gold" /> : <Sparkles className="mb-4 h-9 w-9 text-gold" />}
                <h4 className="text-lg font-bold text-white">{selectedZone ? selectedZone.label || selectedZone.name : 'Chọn một bàn trên sơ đồ'}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{selectedZone ? selectedZone.description : 'Bấm vào từng khu, bàn hoặc phòng để xem minimum spend, sức chứa và trạng thái yêu cầu.'}</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
