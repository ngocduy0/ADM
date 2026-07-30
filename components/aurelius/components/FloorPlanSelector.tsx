import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, MapPin, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { PreferredTable, Venue, VenueFloorPlanTheme, VenueMapElement, VenueTableZone } from '../types';
import { formatVnd } from '../localize';
import { Locale, useI18n } from '../i18n';

interface FloorPlanSelectorProps {
  venue: Venue;
  selectedTableId?: string;
  onSelectTable?: (table: PreferredTable) => void;
  onRequestTable?: (table: PreferredTable) => void;
  compact?: boolean;
  adminPreview?: boolean;
  disabledTableIds?: string[];
}

const DEFAULT_ZONE_COLORS = ['#D6A85F', '#C92A2A', '#8B5CF6', '#2563EB', '#16A34A', '#F08A24'];
const DEFAULT_TABLE_COLOR = '#D6A85F';

const FLOOR_PLAN_COPY: Record<Locale, {
  map: string; choose: string; all: string; tables: string; layout: string; zoom: string; min: string; capacity: string; upTo: string; from: string; booked: string; request: string; select: string; selectHelp: string; helper: string; unavailable: string; area: string; managed: string;
}> = {
  vi: { map: 'Sơ đồ bàn', choose: 'Chọn khu trước, sau đó chọn bàn', all: 'Tất cả khu', tables: 'bàn', layout: 'toàn bộ layout', zoom: 'Zoom để xem rõ nhiều bàn.', min: 'Chi tiêu tối thiểu', capacity: 'Sức chứa', upTo: 'Tối đa', from: 'Từ', booked: 'Bàn đã có lịch', request: 'Gửi yêu cầu concierge', select: 'Chọn một bàn trên sơ đồ', selectHelp: 'Bấm vào từng khu, bàn hoặc phòng để xem mức chi tiêu tối thiểu, sức chứa và trạng thái.', helper: 'Bàn đã có lịch vẫn hiển thị với biểu tượng khóa và không thể chọn.', unavailable: 'Không khả dụng', area: 'Khu', managed: 'đang được quản lý trong hệ thống' },
  en: { map: 'Floor plan', choose: 'Choose an area, then a table', all: 'All areas', tables: 'tables', layout: 'full layout', zoom: 'Zoom in to inspect the layout.', min: 'Minimum spend', capacity: 'Capacity', upTo: 'Up to', from: 'From', booked: 'Table already booked', request: 'Send concierge request', select: 'Select a table on the floor plan', selectHelp: 'Tap an area, table, or room to view minimum spend, capacity, and availability.', helper: 'Booked tables remain visible with a lock and cannot be selected.', unavailable: 'Unavailable', area: 'Area', managed: 'managed in the system' },
  ko: { map: '좌석 배치도', choose: '구역을 선택한 뒤 테이블을 고르세요', all: '전체 구역', tables: '테이블', layout: '전체 배치', zoom: '확대하여 배치도를 자세히 확인하세요.', min: '최소 이용 금액', capacity: '수용 인원', upTo: '최대', from: '최소', booked: '이미 예약된 테이블', request: '컨시어지 요청 보내기', select: '배치도에서 테이블을 선택하세요', selectHelp: '구역, 테이블 또는 룸을 눌러 최소 이용 금액, 수용 인원, 이용 가능 여부를 확인하세요.', helper: '예약된 테이블은 잠금 상태로 표시되며 선택할 수 없습니다.', unavailable: '이용 불가', area: '구역', managed: '시스템에서 관리 중' },
  zh: { map: '桌位图', choose: '先选择区域，再选择桌位', all: '全部区域', tables: '桌', layout: '完整布局', zoom: '放大查看详细布局。', min: '最低消费', capacity: '容量', upTo: '最多', from: '起', booked: '桌位已被预订', request: '发送礼宾请求', select: '请在桌位图中选择桌位', selectHelp: '点击区域、桌位或包厢，查看最低消费、容量和可用状态。', helper: '已预订桌位会保留显示并带锁，无法选择。', unavailable: '不可用', area: '区域', managed: '由系统管理' },
  th: { map: 'ผังโต๊ะ', choose: 'เลือกโซน แล้วเลือกโต๊ะ', all: 'ทุกโซน', tables: 'โต๊ะ', layout: 'ผังทั้งหมด', zoom: 'ซูมเพื่อดูรายละเอียดผัง', min: 'ขั้นต่ำ', capacity: 'ความจุ', upTo: 'สูงสุด', from: 'เริ่ม', booked: 'โต๊ะมีการจองแล้ว', request: 'ส่งคำขอคอนเซียร์จ', select: 'เลือกโต๊ะบนผัง', selectHelp: 'แตะโซน โต๊ะ หรือห้องเพื่อดูขั้นต่ำ ความจุ และสถานะว่าง', helper: 'โต๊ะที่มีการจองยังแสดงพร้อมสัญลักษณ์ล็อกและไม่สามารถเลือกได้', unavailable: 'ไม่พร้อมใช้งาน', area: 'โซน', managed: 'จัดการในระบบ' },
  ja: { map: 'テーブルマップ', choose: 'エリアを選び、次にテーブルを選択', all: 'すべてのエリア', tables: 'テーブル', layout: '全体レイアウト', zoom: '拡大してレイアウトを確認してください。', min: 'ミニマムスペンド', capacity: '定員', upTo: '最大', from: '最低', booked: '予約済みテーブル', request: 'コンシェルジュへ依頼', select: 'マップからテーブルを選択', selectHelp: 'エリア、テーブル、またはルームを選択して、ミニマムスペンド、定員、空き状況を確認してください。', helper: '予約済みテーブルはロック表示され、選択できません。', unavailable: '利用不可', area: 'エリア', managed: 'システムで管理中' },
  hi: { map: 'टेबल मैप', choose: 'पहले area, फिर table चुनें', all: 'सभी areas', tables: 'tables', layout: 'पूरा layout', zoom: 'Layout को साफ़ देखने के लिए zoom करें।', min: 'Minimum spend', capacity: 'Capacity', upTo: 'अधिकतम', from: 'से', booked: 'Table पहले से booked है', request: 'Concierge request भेजें', select: 'Floor plan पर table चुनें', selectHelp: 'Minimum spend, capacity और availability देखने के लिए area, table या room पर tap करें।', helper: 'Booked tables lock के साथ दिखाई देती हैं और select नहीं की जा सकतीं।', unavailable: 'Unavailable', area: 'Area', managed: 'system में managed' },
};

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
    backgroundColor: '#050507',
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

function buildZones(venue: Venue, locale: Locale): VenueTableZone[] {
  const copy = FLOOR_PLAN_COPY[locale] || FLOOR_PLAN_COPY.en;
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
      description: `${copy.area} ${area} · ${tables.length} ${copy.tables} ${copy.managed}.`,
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

function defaultElements(venue: Venue, locale: Locale): VenueMapElement[] {
  const labels = {
    reception: locale === 'vi' ? 'Lễ tân' : locale === 'ko' ? '리셉션' : locale === 'zh' ? '接待处' : locale === 'th' ? 'แผนกต้อนรับ' : locale === 'ja' ? '受付' : locale === 'hi' ? 'Reception' : 'Reception',
    walkway: locale === 'vi' ? 'Lối đi chính' : locale === 'ko' ? '메인 통로' : locale === 'zh' ? '主通道' : locale === 'th' ? 'ทางเดินหลัก' : locale === 'ja' ? 'メイン通路' : locale === 'hi' ? 'Main walkway' : 'Main walkway',
    privateRoom: locale === 'vi' ? 'Phòng riêng' : locale === 'ko' ? '프라이빗 룸' : locale === 'zh' ? '私人包厢' : locale === 'th' ? 'ห้องส่วนตัว' : locale === 'ja' ? '個室' : locale === 'hi' ? 'Private room' : 'Private room',
    vipRoom: locale === 'vi' ? 'Phòng hát VIP' : locale === 'ko' ? 'VIP 노래방 룸' : locale === 'zh' ? 'VIP 卡拉OK包厢' : locale === 'th' ? 'ห้องคาราโอเกะ VIP' : locale === 'ja' ? 'VIPカラオケルーム' : locale === 'hi' ? 'VIP karaoke room' : 'VIP karaoke room',
    drinksBar: locale === 'vi' ? 'Quầy đồ uống' : locale === 'ko' ? '드링크 바' : locale === 'zh' ? '饮品吧' : locale === 'th' ? 'บาร์เครื่องดื่ม' : locale === 'ja' ? 'ドリンクバー' : locale === 'hi' ? 'Drinks bar' : 'Drinks bar',
    stage: locale === 'vi' ? 'Sân khấu' : locale === 'ko' ? '무대' : locale === 'zh' ? '舞台' : locale === 'th' ? 'เวที' : locale === 'ja' ? 'ステージ' : locale === 'hi' ? 'Stage' : 'Stage',
    bar: locale === 'vi' ? 'Quầy bar' : locale === 'ko' ? '바' : locale === 'zh' ? '吧台' : locale === 'th' ? 'บาร์' : locale === 'ja' ? 'バー' : locale === 'hi' ? 'Bar' : 'Bar',
    entrance: locale === 'vi' ? 'Lối vào' : locale === 'ko' ? '입구' : locale === 'zh' ? '入口' : locale === 'th' ? 'ทางเข้า' : locale === 'ja' ? '入口' : locale === 'hi' ? 'Entrance' : 'Entrance',
  };

  if (venue.category === 'Karaoke') {
    return [
      { id: 'default-ktv-reception', type: 'CUSTOM', label: labels.reception, x: 16, y: 88, width: 22, height: 7, color: '#D6A85F', order: 1 },
      { id: 'default-ktv-corridor', type: 'WALKWAY', label: labels.walkway, x: 50, y: 50, width: 10, height: 76, color: '#D6A85F', order: 2 },
      { id: 'default-ktv-room', type: 'VIP_ROOM', label: labels.privateRoom, x: 30, y: 34, width: 26, height: 16, color: '#8B5CF6', order: 3 },
      { id: 'default-ktv-suite', type: 'KTV', label: labels.vipRoom, x: 70, y: 34, width: 26, height: 16, color: '#2563EB', order: 4 },
      { id: 'default-ktv-bar', type: 'BAR', label: labels.drinksBar, x: 70, y: 74, width: 24, height: 8, color: '#F08A24', order: 5 },
    ];
  }

  return [
    { id: 'default-dj', type: 'DJ', label: 'DJ', x: 50, y: 7, width: 38, height: 6, color: '#A855F7', order: 1 },
    { id: 'default-stage', type: 'STAGE', label: labels.stage, x: 50, y: 16, width: 28, height: 5, color: '#EC4899', order: 2 },
    { id: 'default-bar', type: 'BAR', label: labels.bar, x: 50, y: 74, width: 34, height: 7, color: '#2563EB', order: 3 },
    { id: 'default-door', type: 'DOOR', label: labels.entrance, x: 50, y: 94, width: 24, height: 5, color: '#D6A85F', order: 4 },
  ];
}

function buildElements(venue: Venue, locale: Locale) {
  const explicit = Array.isArray(venue.floorPlanElements) ? venue.floorPlanElements.filter((item) => item.isActive !== false) : [];
  return (explicit.length ? explicit : defaultElements(venue, locale))
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

export default function FloorPlanSelector({ venue, selectedTableId, onSelectTable, onRequestTable, compact = false, adminPreview = false, disabledTableIds = [] }: FloorPlanSelectorProps) {
  const { locale } = useI18n();
  const copy = FLOOR_PLAN_COPY[locale] || FLOOR_PLAN_COPY.en;
  const en = locale !== 'vi';
  const theme = useMemo(() => getTheme(venue), [venue]);
  const zones = useMemo(() => buildZones(venue, locale), [locale, venue]);
  const allTables = useMemo(() => buildTables(venue, zones), [venue, zones]);
  const disabledTableSet = useMemo(() => new Set(disabledTableIds), [disabledTableIds]);
  const tables = allTables;
  const isTableDisabled = useCallback(
    (table: PreferredTable) =>
      !adminPreview &&
      (table.status === 'RESERVED' || disabledTableSet.has(table.id)),
    [adminPreview, disabledTableSet],
  );
  const visibleZones = useMemo(
    () => zones.filter((zone) => tables.some((table) => (table.zoneId || getTableZone(table, zones)?.id) === zone.id)),
    [tables, zones],
  );
  const elements = useMemo(() => buildElements(venue, locale), [locale, venue]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');
  const [zoom, setZoom] = useState(1);
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const visibleTables = selectedZoneId === 'ALL' ? tables : tables.filter((table) => (table.zoneId || getTableZone(table, zones)?.id) === selectedZoneId);
  const selectedZone = selectedZoneId === 'ALL' ? null : zones.find((zone) => zone.id === selectedZoneId);
  const helperText = en
    ? venue.floorPlanTheme?.helperText || copy.helper
    : theme.helperText || copy.helper;

  useEffect(() => {
    if (selectedZoneId === 'ALL') return;
    if (!visibleZones.some((zone) => zone.id === selectedZoneId)) setSelectedZoneId('ALL');
  }, [selectedZoneId, visibleZones]);

  useEffect(() => {
    const current = tables.find((table) => table.id === selectedTableId);
    if (current && !isTableDisabled(current)) return;
    const next = tables.find((table) => !isTableDisabled(table));
    if (next) onSelectTable?.(next);
  }, [isTableDisabled, onSelectTable, selectedTableId, tables]);

  const handleZoneSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);

    if (zoneId === 'ALL') return;

    const zoneTables = tables.filter((table) => (table.zoneId || getTableZone(table, zones)?.id) === zoneId);
    const currentStillVisible = zoneTables.some((table) => table.id === selectedTableId);
    const nextAvailable = zoneTables.find((table) => !isTableDisabled(table));
    if (!currentStillVisible && nextAvailable) onSelectTable?.(nextAvailable);
  };
  const aspectClass = getAspectClass(theme);
  const isLightTheme = ['BEACH', 'YACHT'].includes(theme.style);

  return (
    <div className={`rounded-[28px] border border-gold/10 bg-[#050507] text-on-surface shadow-2xl shadow-black/30 ${compact ? 'p-3 space-y-3' : 'p-4 space-y-5'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">{copy.map}</p>
          <h3 className={`${compact ? 'text-lg' : 'text-xl'} mt-1 font-serif text-white`}>{copy.choose}</h3>
          {!compact && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/55">{helperText}</p>}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => handleZoneSelect('ALL')}
          className={`min-w-[150px] rounded-2xl border p-3 text-left transition ${selectedZoneId === 'ALL' ? 'border-gold bg-gold/15' : 'border-white/10 bg-white/[0.035] hover:border-gold/40'}`}
        >
          <p className="text-xs font-bold text-white">{copy.all}</p>
          <p className="mt-1 text-[11px] text-white/50">{tables.length} {copy.tables} · {copy.layout}</p>
        </button>
        {visibleZones.map((zone) => {
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
              <p className="mt-1 text-[11px] text-white/50">{copy.from} {formatVnd(zone.minimumSpend, locale)} · {count} {copy.tables}</p>
            </button>
          );
        })}
      </div>

      <div className={`grid gap-5 ${compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]'}`}>
        <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#09090D] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold text-white/55">{copy.zoom}</p>
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
                const disabled = isTableDisabled(table);
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
                    title={`${table.name} · ${formatVnd(table.minimumSpend, locale)} · ${copy.upTo} ${table.capacity}${disabled ? ` · ${copy.unavailable}` : ''}`}
                  >
                    <span className={disabled ? 'opacity-70' : ''}>{label}</span>
                    {disabled ? <Lock className="absolute right-1 top-1 h-2.5 w-2.5" /> : null}
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.min}</p>
                    <p className="mt-1 font-bold text-gold">{formatVnd(selectedTable.minimumSpend, locale)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.capacity}</p>
                    <p className="mt-1 font-bold text-white">{copy.upTo} {selectedTable.capacity}</p>
                  </div>
                </div>
                {!adminPreview && <button type="button" disabled={isTableDisabled(selectedTable)} onClick={() => onRequestTable?.(selectedTable)} className="w-full rounded-2xl bg-gold px-5 py-3 text-sm font-black uppercase tracking-widest text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-45">{isTableDisabled(selectedTable) ? copy.booked : copy.request}</button>}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center">
                {selectedZone ? <MapPin className="mb-4 h-9 w-9 text-gold" /> : <Sparkles className="mb-4 h-9 w-9 text-gold" />}
                <h4 className="text-lg font-bold text-white">{selectedZone ? selectedZone.label || selectedZone.name : copy.select}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{selectedZone ? selectedZone.description : copy.selectHelp}</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
