import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Grid3X3,
  Layers3,
  Move,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  PreferredTable,
  TableBookingMode,
  TableShape,
  TableStatus,
  Venue,
  VenueFloorPlanTheme,
  VenueMapElement,
  VenueMapElementType,
  VenueTableZone,
} from "../types";
import { formatVnd } from "../localize";

interface TableMapManagerModalProps {
  venueName: string;
  venueCategory: Venue["category"];
  zones: VenueTableZone[];
  tables: PreferredTable[];
  elements: VenueMapElement[];
  theme?: VenueFloorPlanTheme;
  baseMinimumSpend?: number;
  baseCapacity?: number;
  onChangeZones: (zones: VenueTableZone[]) => void;
  onChangeTables: (tables: PreferredTable[]) => void;
  onChangeElements: (elements: VenueMapElement[]) => void;
  onChangeTheme?: (theme: VenueFloorPlanTheme) => void;
  onClose: () => void;
  embedded?: boolean;
  onSave?: () => void;
  saving?: boolean;
}

const DEFAULT_ZONE_COLORS = [
  "#C92A2A",
  "#F08A24",
  "#8B5CF6",
  "#2563EB",
  "#16A34A",
  "#D6A85F",
  "#111827",
];
const TABLE_STATUSES: TableStatus[] = [
  "AVAILABLE",
  "INQUIRY",
  "RESERVED",
  "HIDDEN",
];
const BOOKING_MODES: TableBookingMode[] = [
  "REQUEST",
  "BIDDING",
  "LOTTERY",
  "MESSAGE_ONLY",
];
const TABLE_SHAPES: TableShape[] = ["RECT", "ROUND", "SOFA", "BAR"];
const ELEMENT_TYPES: VenueMapElementType[] = [
  "DJ",
  "STAGE",
  "BAR",
  "DOOR",
  "WALKWAY",
  "LABEL",
  "POOL",
  "KTV",
  "SCREEN",
  "VIP_ROOM",
  "CUSTOM",
];

const THEME_PRESETS: Record<VenueFloorPlanTheme["style"], VenueFloorPlanTheme> =
  {
    NIGHTCLUB: {
      style: "NIGHTCLUB",
      ratio: "PORTRAIT",
      backgroundColor: "#070A12",
      accentColor: "#D6A85F",
      surfaceColor: "#111827",
      gridColor: "rgba(255,255,255,0.055)",
      texture: "GRID",
      helperText:
        "Layout tối sang trọng cho ADM Club, DJ, sân khấu và sofa VIP.",
      showGrid: true,
    },
    BLUEPRINT: {
      style: "BLUEPRINT",
      ratio: "LANDSCAPE",
      backgroundColor: "#071432",
      accentColor: "#38D6F0",
      surfaceColor: "#0E3E89",
      gridColor: "rgba(177,220,255,0.13)",
      texture: "GRID",
      helperText: "Blueprint hiện đại, phù hợp sơ đồ nhiều khu bàn hoặc phòng.",
      showGrid: true,
    },
    BEACH: {
      style: "BEACH",
      ratio: "LANDSCAPE",
      backgroundColor: "#F3E7C9",
      accentColor: "#B9802C",
      surfaceColor: "#EBD7AB",
      gridColor: "rgba(111,85,42,0.13)",
      texture: "WOOD",
      helperText:
        "Layout sáng dự phòng cho không gian rộng, nhiều khu phục vụ.",
      showGrid: true,
    },
    LOUNGE: {
      style: "LOUNGE",
      ratio: "SQUARE",
      backgroundColor: "#15110F",
      accentColor: "#E3B36D",
      surfaceColor: "#211A16",
      gridColor: "rgba(227,179,109,0.08)",
      texture: "CARPET",
      helperText: "Layout phòng riêng, ấm và dễ nhìn cho khách chọn.",
      showGrid: false,
    },
    YACHT: {
      style: "YACHT",
      ratio: "LANDSCAPE",
      backgroundColor: "#EDE8DE",
      accentColor: "#8B5E34",
      surfaceColor: "#F8F3E8",
      gridColor: "rgba(93,67,42,0.14)",
      texture: "WOOD",
      helperText: "Layout không gian VIP với sofa, lối đi và điểm phục vụ.",
      showGrid: true,
    },
    MINIMAL: {
      style: "MINIMAL",
      ratio: "PORTRAIT",
      backgroundColor: "#101217",
      accentColor: "#D6A85F",
      surfaceColor: "#161A22",
      gridColor: "rgba(255,255,255,0.04)",
      texture: "NONE",
      helperText: "Layout tối giản, dễ hiểu cho khách.",
      showGrid: false,
    },
  };

function clampNumber(value: unknown, fallback: number, min = 0, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function safeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function textColorFor(hex = "") {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#FFFFFF";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 170 ? "#111827" : "#FFFFFF";
}

function normalizeTheme(
  theme: VenueFloorPlanTheme | undefined,
  category: Venue["category"],
): VenueFloorPlanTheme {
  const style =
    theme?.style || (category === "Karaoke" ? "LOUNGE" : "NIGHTCLUB");
  return { ...THEME_PRESETS[style], ...(theme || {}), style };
}

function aspectClass(theme: VenueFloorPlanTheme) {
  if (theme.ratio === "LANDSCAPE") return "aspect-[16/10] max-w-[760px]";
  if (theme.ratio === "SQUARE") return "aspect-square max-w-[640px]";
  return "aspect-[82/130] max-w-[560px]";
}

function mapBackground(theme: VenueFloorPlanTheme): React.CSSProperties {
  const base = theme.backgroundColor || "#070A12";
  const surface = theme.surfaceColor || "#111827";
  const accent = theme.accentColor || "#D6A85F";
  const grid = theme.gridColor || "rgba(255,255,255,0.055)";
  const textureLayer =
    theme.texture === "WOOD"
      ? `repeating-linear-gradient(0deg, rgba(255,255,255,0.075) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(69,41,17,0.08) 0 1px, transparent 1px 32px)`
      : theme.texture === "CARPET"
        ? `radial-gradient(circle at 30% 20%, ${accent}18, transparent 30%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05), transparent 30%)`
        : theme.texture === "POOL"
          ? `radial-gradient(ellipse at 50% 30%, #60D8F740, transparent 42%)`
          : theme.texture === "GRID"
            ? `linear-gradient(90deg, ${grid} 1px, transparent 1px), linear-gradient(180deg, ${grid} 1px, transparent 1px)`
            : `linear-gradient(180deg, transparent, transparent)`;
  return {
    backgroundColor: base,
    backgroundImage: `${textureLayer}, radial-gradient(circle at 50% 14%, ${accent}20, transparent 34%), linear-gradient(180deg, ${surface}, ${base})`,
    backgroundSize:
      theme.texture === "GRID" ? "10% 10%, 10% 10%, auto, auto" : undefined,
  };
}

function normalizeZones(
  zones: VenueTableZone[],
  baseMinimumSpend = 3000000,
  baseCapacity = 4,
) {
  const source = zones.length
    ? zones
    : [
        {
          id: "zone-main",
          name: "Main VIP",
          label: "Main VIP",
          description: "Khu bàn chính của địa điểm.",
          minimumSpend: baseMinimumSpend,
          capacity: baseCapacity,
          color: "#D6A85F",
          order: 1,
          isActive: true,
        },
      ];

  return source.map((zone, index) => ({
    id: zone.id || safeId("zone"),
    name: zone.name || `Zone ${index + 1}`,
    label: zone.label || zone.name || `Zone ${index + 1}`,
    description: zone.description || "",
    minimumSpend: Math.max(
      0,
      Number(zone.minimumSpend) || baseMinimumSpend || 0,
    ),
    capacity: Math.max(1, Number(zone.capacity) || baseCapacity || 1),
    color:
      zone.color || DEFAULT_ZONE_COLORS[index % DEFAULT_ZONE_COLORS.length],
    order: Number(zone.order) || index + 1,
    isActive: zone.isActive !== false,
  }));
}

function normalizeTables(
  tables: PreferredTable[],
  zones: VenueTableZone[],
  baseMinimumSpend = 3000000,
  baseCapacity = 4,
) {
  const fallbackZone = zones[0];
  return tables.map((table, index) => {
    const zone = zones.find((item) => item.id === table.zoneId) || fallbackZone;
    return {
      ...table,
      id: table.id || safeId("table"),
      name: table.name || `T${index + 1}`,
      area: table.area || zone?.name || "VIP Area",
      zoneId: table.zoneId || zone?.id,
      minimumSpend: Math.max(
        0,
        Number(table.minimumSpend) ||
          zone?.minimumSpend ||
          baseMinimumSpend ||
          0,
      ),
      capacity: Math.max(
        1,
        Number(table.capacity) || zone?.capacity || baseCapacity || 1,
      ),
      description:
        table.description ||
        "Concierge sẽ kiểm tra tình trạng bàn trực tiếp với địa điểm.",
      status: table.status || "AVAILABLE",
      shape: table.shape || "RECT",
      bookingMode: table.bookingMode || "REQUEST",
      x: clampNumber(table.x, 18 + (index % 5) * 12),
      y: clampNumber(table.y, 22 + Math.floor(index / 5) * 8),
      width: clampNumber(table.width, table.shape === "ROUND" ? 7 : 9, 3, 45),
      height: clampNumber(table.height, table.shape === "ROUND" ? 7 : 5, 3, 35),
      rotation: Number(table.rotation) || 0,
      color: table.color || zone?.color || "#D6A85F",
      sortOrder: Number(table.sortOrder) || index + 1,
      badge: table.badge || "NONE",
    } as PreferredTable;
  });
}

function normalizeElements(
  elements: VenueMapElement[],
  category: Venue["category"],
) {
  const source = elements.length ? elements : templateElements(category);
  return source.map((element, index) => ({
    id: element.id || safeId("element"),
    type: element.type || "CUSTOM",
    label: element.label || element.type || `Element ${index + 1}`,
    x: clampNumber(element.x, 50),
    y: clampNumber(element.y, 50),
    width: clampNumber(element.width, 20, 2, 95),
    height: clampNumber(element.height, 5, 2, 70),
    rotation: Number(element.rotation) || 0,
    color: element.color || "#D6A85F",
    order: Number(element.order) || index + 1,
    isActive: element.isActive !== false,
  }));
}

function templateElements(category: Venue["category"]): VenueMapElement[] {
  if (category === "Karaoke") return karaokeTemplate();
  return nightclubTemplate();
}

function nightclubTemplate(): VenueMapElement[] {
  return [
    {
      id: safeId("element"),
      type: "DJ",
      label: "DJ",
      x: 50,
      y: 8,
      width: 38,
      height: 6,
      color: "#A855F7",
      order: 1,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "STAGE",
      label: "Sân khấu",
      x: 50,
      y: 18,
      width: 30,
      height: 6,
      color: "#EC4899",
      order: 2,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "BAR",
      label: "Quầy bar",
      x: 50,
      y: 74,
      width: 34,
      height: 7,
      color: "#2563EB",
      order: 3,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "DOOR",
      label: "Lối vào",
      x: 50,
      y: 94,
      width: 24,
      height: 5,
      color: "#D6A85F",
      order: 4,
      isActive: true,
    },
  ];
}

function serviceAreaTemplate(): VenueMapElement[] {
  return [
    {
      id: safeId("element"),
      type: "LABEL",
      label: "Khu sofa",
      x: 50,
      y: 8,
      width: 52,
      height: 5,
      color: "#8B5E34",
      order: 1,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "WALKWAY",
      label: "Lối đi",
      x: 50,
      y: 42,
      width: 24,
      height: 48,
      color: "#38D6F0",
      order: 2,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "STAGE",
      label: "Điểm phục vụ",
      x: 50,
      y: 74,
      width: 22,
      height: 7,
      color: "#A78BFA",
      order: 3,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "BAR",
      label: "Quầy bar",
      x: 50,
      y: 84,
      width: 22,
      height: 9,
      color: "#8B5E34",
      order: 4,
      isActive: true,
    },
  ];
}

function loungeTemplate(): VenueMapElement[] {
  return [
    {
      id: safeId("element"),
      type: "LABEL",
      label: "Khu riêng",
      x: 50,
      y: 10,
      width: 48,
      height: 5,
      color: "#D6A85F",
      order: 1,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "BAR",
      label: "Quầy bar",
      x: 82,
      y: 50,
      width: 10,
      height: 44,
      color: "#8B5E34",
      order: 2,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "VIP_ROOM",
      label: "Phòng riêng",
      x: 24,
      y: 42,
      width: 24,
      height: 20,
      color: "#7C3AED",
      order: 3,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "DOOR",
      label: "Lối vào",
      x: 50,
      y: 92,
      width: 26,
      height: 5,
      color: "#D6A85F",
      order: 4,
      isActive: true,
    },
  ];
}

function karaokeTemplate(): VenueMapElement[] {
  return [
    {
      id: safeId("element"),
      type: "CUSTOM",
      label: "Lễ tân",
      x: 16,
      y: 88,
      width: 22,
      height: 7,
      color: "#D6A85F",
      order: 1,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "WALKWAY",
      label: "Lối đi chính",
      x: 50,
      y: 50,
      width: 10,
      height: 76,
      color: "#D6A85F",
      order: 2,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "VIP_ROOM",
      label: "Phòng riêng",
      x: 30,
      y: 34,
      width: 26,
      height: 16,
      color: "#8B5CF6",
      order: 3,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "KTV",
      label: "Phòng hát VIP",
      x: 70,
      y: 34,
      width: 26,
      height: 16,
      color: "#2563EB",
      order: 4,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "BAR",
      label: "Quầy đồ uống",
      x: 70,
      y: 74,
      width: 24,
      height: 8,
      color: "#F08A24",
      order: 5,
      isActive: true,
    },
  ];
}

function vipAreaTemplate(): VenueMapElement[] {
  return [
    {
      id: safeId("element"),
      type: "LABEL",
      label: "Khu VIP",
      x: 50,
      y: 12,
      width: 52,
      height: 5,
      color: "#8B5E34",
      order: 1,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "CUSTOM",
      label: "Sofa trung tâm",
      x: 50,
      y: 45,
      width: 42,
      height: 18,
      color: "#D6A85F",
      order: 2,
      isActive: true,
    },
    {
      id: safeId("element"),
      type: "BAR",
      label: "Quầy bar",
      x: 50,
      y: 77,
      width: 24,
      height: 8,
      color: "#8B5E34",
      order: 3,
      isActive: true,
    },
  ];
}

function zoneLabel(zone?: VenueTableZone) {
  return zone?.label || zone?.name || "Chưa có khu";
}

export default function TableMapManagerModal({
  venueName,
  venueCategory,
  zones,
  tables,
  elements,
  theme,
  baseMinimumSpend = 3000000,
  baseCapacity = 4,
  onChangeZones,
  onChangeTables,
  onChangeElements,
  onChangeTheme,
  onClose,
  embedded = false,
  onSave,
  saving = false,
}: TableMapManagerModalProps) {
  const cleanTheme = useMemo(
    () => normalizeTheme(theme, venueCategory),
    [theme, venueCategory],
  );
  const cleanZones = useMemo(
    () => normalizeZones(zones, baseMinimumSpend, baseCapacity),
    [zones, baseMinimumSpend, baseCapacity],
  );
  const cleanTables = useMemo(
    () => normalizeTables(tables, cleanZones, baseMinimumSpend, baseCapacity),
    [tables, cleanZones, baseMinimumSpend, baseCapacity],
  );
  const cleanElements = useMemo(
    () => normalizeElements(elements, venueCategory),
    [elements, venueCategory],
  );
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<"style" | "tables" | "zones" | "layout">(
    "tables",
  );
  const [selectedKind, setSelectedKind] = useState<"table" | "element">(
    "table",
  );
  const [selectedTableId, setSelectedTableId] = useState(
    cleanTables[0]?.id || "",
  );
  const [selectedElementId, setSelectedElementId] = useState(
    cleanElements[0]?.id || "",
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string>("ALL");
  const [zoom, setZoom] = useState(1);

  const selectedTable =
    cleanTables.find((table) => table.id === selectedTableId) || cleanTables[0];
  const selectedElement =
    cleanElements.find((element) => element.id === selectedElementId) ||
    cleanElements[0];
  const visibleTables =
    selectedZoneId === "ALL"
      ? cleanTables
      : cleanTables.filter((table) => table.zoneId === selectedZoneId);

  const commitZones = (next: VenueTableZone[]) =>
    onChangeZones(next.map((zone, index) => ({ ...zone, order: index + 1 })));
  const commitTables = (next: PreferredTable[]) =>
    onChangeTables(
      next.map((table, index) => ({ ...table, sortOrder: index + 1 })),
    );
  const commitElements = (next: VenueMapElement[]) =>
    onChangeElements(
      next.map((element, index) => ({ ...element, order: index + 1 })),
    );
  const commitTheme = (next: VenueFloorPlanTheme) => onChangeTheme?.(next);

  const updateTheme = (patch: Partial<VenueFloorPlanTheme>) =>
    commitTheme({ ...cleanTheme, ...patch });

  const updateZone = (zoneId: string, patch: Partial<VenueTableZone>) => {
    commitZones(
      cleanZones.map((zone) =>
        zone.id === zoneId ? { ...zone, ...patch } : zone,
      ),
    );
  };

  const addZone = () => {
    const index = cleanZones.length + 1;
    const zone: VenueTableZone = {
      id: safeId("zone"),
      name: `Zone ${index}`,
      label: `Khu ${index}`,
      description: "Mô tả khu vực mới.",
      minimumSpend: baseMinimumSpend,
      capacity: baseCapacity,
      color: DEFAULT_ZONE_COLORS[index % DEFAULT_ZONE_COLORS.length],
      order: index,
      isActive: true,
    };
    commitZones([...cleanZones, zone]);
    setSelectedZoneId(zone.id);
    setTab("zones");
  };

  const deleteZone = (zoneId: string) => {
    const nextZones = cleanZones.filter((zone) => zone.id !== zoneId);
    const fallbackZone = nextZones[0];
    commitZones(nextZones);
    commitTables(
      cleanTables.map((table) =>
        table.zoneId === zoneId
          ? {
              ...table,
              zoneId: fallbackZone?.id,
              area: fallbackZone?.name || table.area,
              color: fallbackZone?.color || table.color,
            }
          : table,
      ),
    );
    if (selectedZoneId === zoneId) setSelectedZoneId("ALL");
  };

  const addTable = () => {
    const zone =
      selectedZoneId !== "ALL"
        ? cleanZones.find((item) => item.id === selectedZoneId) || cleanZones[0]
        : cleanZones[0];
    const index = cleanTables.length + 1;
    const table: PreferredTable = {
      id: safeId("table"),
      name: `T${index}`,
      area: zone?.name || "VIP Area",
      zoneId: zone?.id,
      minimumSpend: zone?.minimumSpend || baseMinimumSpend,
      capacity: zone?.capacity || baseCapacity,
      description:
        "DuyT sẽ kiểm tra trước khi xác nhận.",
      status: "AVAILABLE",
      shape: "RECT",
      bookingMode: "REQUEST",
      x: 20 + (index % 4) * 14,
      y: 26 + Math.floor(index / 4) * 8,
      width: 8,
      height: 5,
      rotation: 0,
      color: zone?.color || "#D6A85F",
      badge: "NONE",
      sortOrder: index,
    };
    commitTables([...cleanTables, table]);
    setSelectedTableId(table.id);
    setSelectedKind("table");
    setTab("tables");
  };

  const duplicateTable = () => {
    if (!selectedTable) return;
    const table: PreferredTable = {
      ...selectedTable,
      id: safeId("table"),
      name: `${selectedTable.name} copy`,
      x: clampNumber(Number(selectedTable.x) + 5, 50),
      y: clampNumber(Number(selectedTable.y) + 5, 50),
      sortOrder: cleanTables.length + 1,
    };
    commitTables([...cleanTables, table]);
    setSelectedTableId(table.id);
  };

  const updateTable = (tableId: string, patch: Partial<PreferredTable>) => {
    commitTables(
      cleanTables.map((table) => {
        if (table.id !== tableId) return table;
        const zone = patch.zoneId
          ? cleanZones.find((item) => item.id === patch.zoneId)
          : undefined;
        return {
          ...table,
          ...patch,
          area: zone ? zone.name : (patch.area ?? table.area),
          color:
            zone && !patch.color ? zone.color : (patch.color ?? table.color),
          minimumSpend:
            zone && !patch.minimumSpend
              ? zone.minimumSpend
              : (patch.minimumSpend ?? table.minimumSpend),
          capacity:
            zone && !patch.capacity
              ? zone.capacity
              : (patch.capacity ?? table.capacity),
        };
      }),
    );
  };

  const deleteTable = (tableId: string) => {
    const next = cleanTables.filter((table) => table.id !== tableId);
    commitTables(next);
    if (selectedTableId === tableId) setSelectedTableId(next[0]?.id || "");
  };

  const addElement = (type: VenueMapElementType = "CUSTOM") => {
    const element: VenueMapElement = {
      id: safeId("element"),
      type,
      label: type === "CUSTOM" ? "New element" : type.replace("_", " "),
      x: 50,
      y: 50,
      width:
        type === "WALKWAY"
          ? 16
          : type === "POOL"
            ? 24
            : type === "KTV" || type === "VIP_ROOM"
              ? 20
              : 28,
      height:
        type === "WALKWAY"
          ? 42
          : type === "POOL"
            ? 36
            : type === "KTV" || type === "VIP_ROOM"
              ? 14
              : 6,
      rotation: 0,
      color:
        type === "DJ"
          ? "#A855F7"
          : type === "STAGE"
            ? "#EC4899"
            : type === "POOL"
              ? "#38D6F0"
              : type === "BAR"
                ? "#2563EB"
                : "#D6A85F",
      order: cleanElements.length + 1,
      isActive: true,
    };
    commitElements([...cleanElements, element]);
    setSelectedElementId(element.id);
    setSelectedKind("element");
    setTab("layout");
  };

  const updateElement = (
    elementId: string,
    patch: Partial<VenueMapElement>,
  ) => {
    commitElements(
      cleanElements.map((element) =>
        element.id === elementId ? { ...element, ...patch } : element,
      ),
    );
  };

  const deleteElement = (elementId: string) => {
    const next = cleanElements.filter((element) => element.id !== elementId);
    commitElements(next);
    if (selectedElementId === elementId)
      setSelectedElementId(next[0]?.id || "");
  };

  const applyTemplate = (style: VenueFloorPlanTheme["style"]) => {
    const preset = THEME_PRESETS[style];
    commitTheme(preset);
    if (style === "BEACH") commitElements(serviceAreaTemplate());
    else if (style === "LOUNGE") commitElements(loungeTemplate());
    else if (style === "YACHT") commitElements(vipAreaTemplate());
    else commitElements(nightclubTemplate());
    setTab("style");
  };

  const handlePointerDown = (
    event: React.PointerEvent,
    kind: "table" | "element",
    id: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const container = mapRef.current;
    if (!container) return;

    setSelectedKind(kind);
    if (kind === "table") {
      setSelectedTableId(id);
      setTab("tables");
    } else {
      setSelectedElementId(id);
      setTab("layout");
    }

    const move = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = clampNumber(
        ((moveEvent.clientX - rect.left) / rect.width) * 100,
        50,
      );
      const y = clampNumber(
        ((moveEvent.clientY - rect.top) / rect.height) * 100,
        50,
      );
      if (kind === "table") updateTable(id, { x, y });
      if (kind === "element") updateElement(id, { x, y });
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className={embedded ? "h-full min-h-0 bg-[#F5F5F7]" : "fixed inset-0 z-[100] bg-black/55 p-3 backdrop-blur-md md:p-6"}>
      <div className={embedded ? "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#F5F5F7]" : "mx-auto flex h-full max-w-[1520px] flex-col overflow-hidden rounded-[30px] bg-[#F5F5F7] shadow-2xl"}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5EA] bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-black text-[#1D1D1F]">
              {venueName || "Venue"} · Layout riêng cho từng venue
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addZone}
              className="rounded-2xl border border-[#E5E5EA] bg-white px-4 py-2 text-xs font-black text-[#1D1D1F] hover:bg-[#FAFAFA]"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Khu
            </button>
            <button
              type="button"
              onClick={addTable}
              className="rounded-2xl bg-[#7765dc] px-4 py-2 text-xs font-black text-white"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Bàn
            </button>
            <button
              type="button"
              onClick={() => addElement("CUSTOM")}
              className="rounded-2xl bg-[#1D1D1F] px-4 py-2 text-xs font-black text-white"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Vật thể
            </button>
            {onSave ? (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#1F3A8A] px-4 text-xs font-black text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu sơ đồ"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#E5E5EA] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]"
              aria-label={embedded ? "Quay lại" : "Đóng"}
            >
              {embedded ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <div className={embedded ? "grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[300px_minmax(0,1fr)_340px]" : "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[330px_minmax(0,1fr)_380px]"}>
          <aside className="min-h-0 overflow-y-auto rounded-[24px] border border-[#E5E5EA] bg-white p-4">
            <div className="mb-4 grid grid-cols-4 rounded-2xl bg-[#F5F5F7] p-1 text-xs font-black">
              {(["style", "tables", "zones", "layout"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`rounded-xl px-2 py-2 ${tab === item ? "bg-white shadow-sm text-[#1D1D1F]" : "text-[#86868B]"}`}
                >
                  {item === "style"
                    ? "Style"
                    : item === "tables"
                      ? "Bàn"
                      : item === "zones"
                        ? "Khu"
                        : "Vật thể"}
                </button>
              ))}
            </div>

            {tab !== "style" && (
              <div className="mb-4 rounded-2xl border border-[#E5E5EA] bg-[#FBFBFD] p-3">
                <p className="text-xs font-black text-[#1D1D1F]">
                  Lọc theo khu
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedZoneId("ALL")}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-bold ${selectedZoneId === "ALL" ? "border-[#D6A85F] bg-[#7765dc]/10" : "border-[#E5E5EA] bg-white"}`}
                  >
                    Tất cả bàn · {cleanTables.length}
                  </button>
                  {cleanZones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`rounded-xl border px-3 py-2 text-left ${selectedZoneId === zone.id ? "border-[#D6A85F] bg-[#7765dc]/10" : "border-[#E5E5EA] bg-white"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-[#1D1D1F]">
                          {zone.label}
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: zone.color }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#86868B]">
                        {formatVnd(zone.minimumSpend)} ·{" "}
                        {
                          cleanTables.filter(
                            (table) => table.zoneId === zone.id,
                          ).length
                        }{" "}
                        bàn
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "style" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#E5E5EA] bg-[#FBFBFD] p-3">
                  <p className="text-xs font-black text-[#1D1D1F]">
                    <Palette className="mr-1 inline h-4 w-4" />
                    Template layout
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {Object.keys(THEME_PRESETS).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() =>
                          applyTemplate(style as VenueFloorPlanTheme["style"])
                        }
                        className={`rounded-xl border px-3 py-2 text-left text-[10px] font-black ${cleanTheme.style === style ? "border-[#D6A85F] bg-[#7765dc]/10 text-[#1D1D1F]" : "border-[#E5E5EA] bg-white text-[#1D1D1F]"}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#E5E5EA] bg-[#FBFBFD] p-3">
                  <p className="mb-3 text-xs font-black text-[#1D1D1F]">
                    <Grid3X3 className="mr-1 inline h-4 w-4" />
                    Background & canvas
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <AdminField label="Tỷ lệ">
                      <select
                        value={cleanTheme.ratio}
                        onChange={(e) =>
                          updateTheme({
                            ratio: e.target
                              .value as VenueFloorPlanTheme["ratio"],
                          })
                        }
                        className={adminInputClass}
                      >
                        <option value="PORTRAIT">Dọc</option>
                        <option value="LANDSCAPE">Ngang</option>
                        <option value="SQUARE">Vuông</option>
                      </select>
                    </AdminField>
                    <AdminField label="Texture">
                      <select
                        value={cleanTheme.texture || "GRID"}
                        onChange={(e) =>
                          updateTheme({
                            texture: e.target
                              .value as VenueFloorPlanTheme["texture"],
                          })
                        }
                        className={adminInputClass}
                      >
                        <option value="GRID">Grid</option>
                        <option value="WOOD">Wood</option>
                        <option value="POOL">Pool</option>
                        <option value="CARPET">Carpet</option>
                        <option value="NONE">None</option>
                      </select>
                    </AdminField>
                    <AdminField label="Nền">
                      <input
                        type="color"
                        value={cleanTheme.backgroundColor}
                        onChange={(e) =>
                          updateTheme({ backgroundColor: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-[#E5E5EA] bg-white p-1"
                      />
                    </AdminField>
                    <AdminField label="Surface">
                      <input
                        type="color"
                        value={cleanTheme.surfaceColor}
                        onChange={(e) =>
                          updateTheme({ surfaceColor: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-[#E5E5EA] bg-white p-1"
                      />
                    </AdminField>
                    <AdminField label="Accent">
                      <input
                        type="color"
                        value={cleanTheme.accentColor}
                        onChange={(e) =>
                          updateTheme({ accentColor: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-[#E5E5EA] bg-white p-1"
                      />
                    </AdminField>
                    <AdminField label="Hiện grid">
                      <select
                        value={cleanTheme.showGrid === false ? "false" : "true"}
                        onChange={(e) =>
                          updateTheme({ showGrid: e.target.value === "true" })
                        }
                        className={adminInputClass}
                      >
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    </AdminField>
                  </div>
                  <AdminField label="Dòng hướng dẫn">
                    <textarea
                      value={cleanTheme.helperText || ""}
                      onChange={(e) =>
                        updateTheme({ helperText: e.target.value })
                      }
                      rows={3}
                      className={`${adminInputClass} mt-2 resize-none`}
                    />
                  </AdminField>
                </div>
              </div>
            )}

            {tab === "tables" && (
              <div className="space-y-2">
                {visibleTables.map((table) => {
                  const zone = cleanZones.find(
                    (item) => item.id === table.zoneId,
                  );
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => {
                        setSelectedKind("table");
                        setSelectedTableId(table.id);
                      }}
                      className={`w-full rounded-2xl border p-3 text-left transition ${selectedKind === "table" && selectedTableId === table.id ? "border-[#D6A85F] bg-[#7765dc]/10" : "border-[#E5E5EA] bg-[#FBFBFD] hover:bg-white"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-[#1D1D1F]">
                          {table.name}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-black"
                          style={{
                            backgroundColor: table.color,
                            color: textColorFor(table.color),
                          }}
                        >
                          {table.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#86868B]">
                        {zoneLabel(zone)} · {formatVnd(table.minimumSpend)} ·
                        max {table.capacity}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === "zones" && (
              <div className="space-y-3">
                {cleanZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="rounded-2xl border border-[#E5E5EA] bg-[#FBFBFD] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-black text-[#1D1D1F]">
                        {zone.label}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteZone(zone.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      value={zone.name}
                      onChange={(e) =>
                        updateZone(zone.id, { name: e.target.value })
                      }
                      className="mb-2 w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-xs font-bold"
                      placeholder="Tên khu"
                    />
                    <input
                      value={zone.label}
                      onChange={(e) =>
                        updateZone(zone.id, { label: e.target.value })
                      }
                      className="mb-2 w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-xs font-bold"
                      placeholder="Tên hiển thị"
                    />
                    <div className="mb-2 grid grid-cols-[1fr_70px] gap-2">
                      <input
                        type="number"
                        value={zone.minimumSpend}
                        onChange={(e) =>
                          updateZone(zone.id, {
                            minimumSpend: Number(e.target.value),
                          })
                        }
                        className="rounded-xl border border-[#E5E5EA] px-3 py-2 text-xs font-bold"
                      />
                      <input
                        type="color"
                        value={zone.color}
                        onChange={(e) =>
                          updateZone(zone.id, { color: e.target.value })
                        }
                        className="h-9 rounded-xl border border-[#E5E5EA] bg-white p-1"
                      />
                    </div>
                    <textarea
                      value={zone.description}
                      onChange={(e) =>
                        updateZone(zone.id, { description: e.target.value })
                      }
                      rows={2}
                      className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-xs"
                      placeholder="Mô tả khu"
                    />
                  </div>
                ))}
              </div>
            )}

            {tab === "layout" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#E5E5EA] bg-[#FBFBFD] p-3">
                  <p className="text-xs font-black text-[#1D1D1F]">
                    Thêm vật thể layout
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {ELEMENT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addElement(type)}
                        className="rounded-xl border border-[#E5E5EA] bg-white px-2 py-2 text-[10px] font-black text-[#1D1D1F]"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => applyTemplate(cleanTheme.style)}
                    className="mt-3 w-full rounded-xl bg-[#1D1D1F] px-3 py-2 text-xs font-black text-white"
                  >
                    <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
                    Reset layout theo style hiện tại
                  </button>
                </div>
                {cleanElements.map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    onClick={() => {
                      setSelectedKind("element");
                      setSelectedElementId(element.id);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left ${selectedKind === "element" && selectedElementId === element.id ? "border-[#D6A85F] bg-[#7765dc]/10" : "border-[#E5E5EA] bg-[#FBFBFD]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#1D1D1F]">
                        {element.label}
                      </span>
                      <span className="text-[10px] font-bold text-[#86868B]">
                        {element.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <main className="min-h-0 overflow-y-auto rounded-[24px] border border-[#E5E5EA] bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#000000]">
                  Preview kéo thả
                </p>
                <h3 className="text-lg font-black text-[#1D1D1F]">
                  Kéo bàn / vật thể để đặt vị trí
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((v) => Math.max(0.8, v - 0.1))}
                  className="rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] px-3 py-1.5 text-xs font-black"
                >
                  -
                </button>
                <span className="rounded-full border border-[#E5E5EA] bg-[#F5F5F7] px-3 py-1.5 text-[11px] font-bold text-[#86868B]">
                  <Move className="mr-1 inline h-3.5 w-3.5" />
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((v) => Math.min(1.6, v + 0.1))}
                  className="rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] px-3 py-1.5 text-xs font-black"
                >
                  +
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded-[26px] border border-[#20242E] bg-[#080A0F] p-4">
              <div
                ref={mapRef}
                className={`relative mx-auto w-full overflow-hidden rounded-[26px] border border-[#20242E] shadow-2xl shadow-black/20 ${aspectClass(cleanTheme)}`}
                style={{
                  ...mapBackground(cleanTheme),
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                  marginBottom: zoom > 1 ? `${(zoom - 1) * 240}px` : undefined,
                }}
              >
                {cleanTheme.showGrid !== false && (
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${cleanTheme.gridColor} 1px, transparent 1px), linear-gradient(180deg, ${cleanTheme.gridColor} 1px, transparent 1px)`,
                      backgroundSize: "10% 10%",
                    }}
                  />
                )}
                <div className="absolute inset-[2.5%] rounded-[18px] border border-white/10 bg-zinc-700/[0.025]" />
                {cleanElements
                  .filter((element) => element.isActive !== false)
                  .map((element) => {
                    const color = element.color || "#D6A85F";
                    const style: React.CSSProperties = {
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      width: `${element.width}%`,
                      height: `${element.height}%`,
                      transform: `translate(-50%, -50%) rotate(${Number(element.rotation) || 0}deg)`,
                      borderColor:
                        selectedKind === "element" &&
                        selectedElementId === element.id
                          ? "#F7D991"
                          : `${color}66`,
                      background:
                        element.type === "POOL"
                          ? `linear-gradient(180deg, ${color}88, #1BAFD2)`
                          : element.type === "WALKWAY"
                            ? `${color}12`
                            : `linear-gradient(180deg, ${color}2A, rgba(0,0,0,0.25))`,
                      color: element.type === "LABEL" ? color : "#FFFFFF",
                      borderRadius:
                        element.type === "POOL" ? "999px" : undefined,
                      boxShadow:
                        selectedKind === "element" &&
                        selectedElementId === element.id
                          ? "0 0 0 2px rgba(214,168,95,0.9), 0 0 24px rgba(214,168,95,0.45)"
                          : undefined,
                    };
                    return (
                      <button
                        key={element.id}
                        type="button"
                        onPointerDown={(event) =>
                          handlePointerDown(event, "element", element.id)
                        }
                        className="absolute z-[2] flex cursor-grab items-center justify-center rounded-xl border text-center text-[9px] font-black uppercase tracking-[0.16em] active:cursor-grabbing"
                        style={style}
                      >
                        <span className="truncate px-2">{element.label}</span>
                      </button>
                    );
                  })}
                {visibleTables.map((table) => {
                  const fill = table.color || "#D6A85F";
                  const isSelected =
                    selectedKind === "table" && selectedTableId === table.id;
                  const style: React.CSSProperties = {
                    left: `${table.x}%`,
                    top: `${table.y}%`,
                    width: `${table.width}%`,
                    height: `${table.height}%`,
                    transform: `translate(-50%, -50%) rotate(${Number(table.rotation) || 0}deg)`,
                    background: `linear-gradient(180deg, ${fill}, rgba(0,0,0,0.5))`,
                    color: textColorFor(fill),
                    borderColor: isSelected
                      ? "#F7D991"
                      : "rgba(255,255,255,0.35)",
                    boxShadow: isSelected
                      ? "0 0 0 2px rgba(214,168,95,0.95), 0 0 28px rgba(214,168,95,0.55)"
                      : "0 8px 18px rgba(0,0,0,0.4)",
                    opacity: table.status === "HIDDEN" ? 0.3 : 1,
                  };
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onPointerDown={(event) =>
                        handlePointerDown(event, "table", table.id)
                      }
                      className={`absolute z-10 flex cursor-grab items-center justify-center border text-[10px] font-black uppercase active:cursor-grabbing ${table.shape === "ROUND" ? "rounded-full" : table.shape === "SOFA" ? "rounded-2xl" : table.shape === "BAR" ? "rounded-md" : "rounded-lg"}`}
                      style={style}
                    >
                      {table.name}
                      {table.badge && table.badge !== "NONE" && (
                        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#7765dc] text-[8px] text-black">
                          {table.badge[0]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </main>

          <aside className="min-h-0 overflow-y-auto rounded-[24px] border border-[#E5E5EA] bg-white p-4">
            {selectedKind === "table" && selectedTable ? (
              <div className="space-y-4">
                <div
                  className="rounded-3xl p-4 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTable.color}, rgba(0,0,0,0.72))`,
                  }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-75">
                    Đang chỉnh bàn
                  </p>
                  <h3 className="mt-1 text-3xl font-black">
                    {selectedTable.name}
                  </h3>
                  <p className="mt-2 text-xs opacity-80">
                    {zoneLabel(
                      cleanZones.find(
                        (zone) => zone.id === selectedTable.zoneId,
                      ),
                    )}{" "}
                    · {formatVnd(selectedTable.minimumSpend)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <AdminField label="Tên bàn">
                    <input
                      value={selectedTable.name}
                      onChange={(e) =>
                        updateTable(selectedTable.id, { name: e.target.value })
                      }
                      className={adminInputClass}
                    />
                  </AdminField>
                  <AdminField label="Khu">
                    <select
                      value={selectedTable.zoneId || ""}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          zoneId: e.target.value,
                        })
                      }
                      className={adminInputClass}
                    >
                      {cleanZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Giá tối thiểu">
                    <input
                      type="number"
                      value={selectedTable.minimumSpend}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          minimumSpend: Number(e.target.value),
                        })
                      }
                      className={adminInputClass}
                    />
                  </AdminField>
                  <AdminField label="Sức chứa">
                    <input
                      type="number"
                      min={1}
                      value={selectedTable.capacity}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          capacity: Number(e.target.value),
                        })
                      }
                      className={adminInputClass}
                    />
                  </AdminField>
                  <AdminField label="Trạng thái">
                    <select
                      value={selectedTable.status || "AVAILABLE"}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          status: e.target.value as TableStatus,
                        })
                      }
                      className={adminInputClass}
                    >
                      {TABLE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Booking">
                    <select
                      value={selectedTable.bookingMode || "REQUEST"}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          bookingMode: e.target.value as TableBookingMode,
                        })
                      }
                      className={adminInputClass}
                    >
                      {BOOKING_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Hình dạng">
                    <select
                      value={selectedTable.shape || "RECT"}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          shape: e.target.value as TableShape,
                        })
                      }
                      className={adminInputClass}
                    >
                      {TABLE_SHAPES.map((shape) => (
                        <option key={shape} value={shape}>
                          {shape}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Màu">
                    <input
                      type="color"
                      value={selectedTable.color || "#D6A85F"}
                      onChange={(e) =>
                        updateTable(selectedTable.id, { color: e.target.value })
                      }
                      className="h-10 w-full rounded-xl border border-[#E5E5EA] bg-white p-1"
                    />
                  </AdminField>
                  <RangeField
                    label="X"
                    value={Number(selectedTable.x) || 0}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateTable(selectedTable.id, { x: value })
                    }
                  />
                  <RangeField
                    label="Y"
                    value={Number(selectedTable.y) || 0}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateTable(selectedTable.id, { y: value })
                    }
                  />
                  <RangeField
                    label="Rộng"
                    value={Number(selectedTable.width) || 8}
                    min={3}
                    max={45}
                    onChange={(value) =>
                      updateTable(selectedTable.id, { width: value })
                    }
                  />
                  <RangeField
                    label="Cao"
                    value={Number(selectedTable.height) || 5}
                    min={3}
                    max={35}
                    onChange={(value) =>
                      updateTable(selectedTable.id, { height: value })
                    }
                  />
                  <RangeField
                    label="Xoay"
                    value={Number(selectedTable.rotation) || 0}
                    min={-180}
                    max={180}
                    onChange={(value) =>
                      updateTable(selectedTable.id, { rotation: value })
                    }
                  />
                  <AdminField label="Badge">
                    <select
                      value={selectedTable.badge || "NONE"}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          badge: e.target.value as PreferredTable["badge"],
                        })
                      }
                      className={adminInputClass}
                    >
                      <option value="NONE">NONE</option>
                      <option value="BIDDING">BIDDING</option>
                      <option value="LADY">LADY</option>
                      <option value="VIP">VIP</option>
                      <option value="SVIP">SVIP</option>
                    </select>
                  </AdminField>
                </div>
                <AdminField label="Mô tả / quy tắc booking">
                  <textarea
                    value={selectedTable.description}
                    onChange={(e) =>
                      updateTable(selectedTable.id, {
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    className={`${adminInputClass} resize-none`}
                  />
                </AdminField>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={duplicateTable}
                    className="rounded-2xl border border-[#E5E5EA] px-4 py-3 text-xs font-black text-[#1D1D1F]"
                  >
                    <Copy className="mr-1 inline h-3.5 w-3.5" />
                    Nhân bản
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTable(selectedTable.id)}
                    className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                  >
                    <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                    Xóa bàn
                  </button>
                </div>
              </div>
            ) : selectedElement ? (
              <div className="space-y-4">
                <div className="rounded-3xl bg-[#1D1D1F] p-4 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#000000]">
                    Đang chỉnh vật thể
                  </p>
                  <h3 className="mt-1 text-2xl font-black">
                    {selectedElement.label}
                  </h3>
                  <p className="mt-2 text-xs text-white/60">
                    Có thể kéo, đổi kích cỡ, xoay ngang/dọc và đổi màu.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <AdminField label="Nhãn">
                    <input
                      value={selectedElement.label}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          label: e.target.value,
                        })
                      }
                      className={adminInputClass}
                    />
                  </AdminField>
                  <AdminField label="Loại">
                    <select
                      value={selectedElement.type}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          type: e.target.value as VenueMapElementType,
                        })
                      }
                      className={adminInputClass}
                    >
                      {ELEMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Màu">
                    <input
                      type="color"
                      value={selectedElement.color || "#D6A85F"}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          color: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-[#E5E5EA] bg-white p-1"
                    />
                  </AdminField>
                  <AdminField label="Hiện">
                    <select
                      value={
                        selectedElement.isActive === false ? "false" : "true"
                      }
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          isActive: e.target.value === "true",
                        })
                      }
                      className={adminInputClass}
                    >
                      <option value="true">Hiện</option>
                      <option value="false">Ẩn</option>
                    </select>
                  </AdminField>
                  <RangeField
                    label="X"
                    value={Number(selectedElement.x) || 0}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateElement(selectedElement.id, { x: value })
                    }
                  />
                  <RangeField
                    label="Y"
                    value={Number(selectedElement.y) || 0}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateElement(selectedElement.id, { y: value })
                    }
                  />
                  <RangeField
                    label="Rộng"
                    value={Number(selectedElement.width) || 10}
                    min={2}
                    max={95}
                    onChange={(value) =>
                      updateElement(selectedElement.id, { width: value })
                    }
                  />
                  <RangeField
                    label="Cao"
                    value={Number(selectedElement.height) || 5}
                    min={2}
                    max={70}
                    onChange={(value) =>
                      updateElement(selectedElement.id, { height: value })
                    }
                  />
                  <RangeField
                    label="Xoay"
                    value={Number(selectedElement.rotation) || 0}
                    min={-180}
                    max={180}
                    onChange={(value) =>
                      updateElement(selectedElement.id, { rotation: value })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => deleteElement(selectedElement.id)}
                  className="w-full rounded-2xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                >
                  <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                  Xóa vật thể
                </button>
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#D1D1D6] p-6 text-center text-[#86868B]">
                <Layers3 className="mb-4 h-10 w-10" />
                <p className="text-sm font-bold">
                  Chọn một bàn hoặc vật thể để chỉnh.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

const adminInputClass =
  "w-full rounded-xl border border-[#E5E5EA] bg-white px-3 py-2.5 text-xs font-bold text-[#1D1D1F] outline-none focus:border-[#D6A85F]";

function AdminField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-[#86868B]">
        {label}
      </span>
      {children}
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-[#86868B]">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#7166b1]"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${adminInputClass} mt-1`}
      />
    </label>
  );
}
