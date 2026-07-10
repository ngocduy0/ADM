"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  Edit3,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Plus,
  Printer,
  Search,
  Settings,
  Star,
  Trash2,
  Upload,
  Users,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Video,
  X,
  CalendarDays,
  Clock,
  ImageIcon,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import {
  ConciergeDataPayload,
  INITIAL_CUSTOMERS,
  INITIAL_RESERVATIONS,
  INITIAL_VENUES,
} from "../data";
import {
  BookingStatus,
  Customer,
  HomepageReel,
  PreferredTable,
  ReservationRequest,
  Venue,
  VenueFloorPlanTheme,
  VenueMapElement,
  VenueTableZone,
  VipStatus,
} from "../types";
import { I18nProvider, isLocale, Locale, useI18n } from "../i18n";
import { formatVnd, localizeVenue } from "../localize";
import LanguageSelector from "./LanguageSelector";
import TableMapManagerModal from "./TableMapManagerModal";
import BannerVideoManager from "./BannerVideoManager";
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromServer,
  loadSiteSettingsLocal,
  saveSiteSettingsLocal,
  saveSiteSettingsToServer,
  SiteSettings,
} from "../siteSettings";

type TabId =
  | "dashboard"
  | "bookings"
  | "guests"
  | "venues"
  | "reels"
  | "payments"
  | "reviews"
  | "messages"
  | "analytics"
  | "files"
  | "settings";
type ModalType = null | "booking" | "venue" | "customer";
type ToastKind = "success" | "error" | "info";

type AdminNotification = {
  id: string;
  reservationId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  tableColor?: string;
};

type VenueReelDraft = {
  id: string;
  venueId: string;
  title: string;
  tag: string;
  caption: string;
  instagramUrl: string;
  videoUrl: string;
  posterUrl: string;
  isActive: boolean;
  order: number;
  placement: HomepageReel["placement"];
};

type BookingDraft = {
  id?: string;
  fullName: string;
  phoneNumber: string;
  venueId: string;
  guestCount: number;
  date: string;
  arrivalTime: string;
  preferredTableId: string;
  notes: string;
  status: BookingStatus;
  source: ReservationRequest["source"];
};

type VenueDraft = {
  id?: string;
  name: string;
  category: Venue["category"];
  location: string;
  shortDescription: string;
  longDescription: string;
  imageUrls: string[];
  videoUrl: string;
  menuUrl: string;
  menuPdfUrl: string;
  openingOpen: string;
  openingClose: string;
  openingLabel: string;
  viewCount: number;
  rating: number;
  reviewsCount: number;
  minimumSpend: number;
  capacity: number;
  floorPlanTheme: VenueFloorPlanTheme;
  floorPlanElements: VenueMapElement[];
  tableZones: VenueTableZone[];
  preferredTables: PreferredTable[];
};

type CustomerDraft = {
  id?: string;
  fullName: string;
  phoneNumber: string;
  vipStatus: VipStatus;
  notes: string;
};

interface LuxuryDashboardProps {
  coreVenues?: Venue[];
  coreReservations?: ReservationRequest[];
  coreCustomers?: Customer[];
  onUpdateReservations?: (reservations: ReservationRequest[]) => void;
  onUpdateCustomers?: (customers: Customer[]) => void;
  onUpdateVenues?: (venues: Venue[]) => void;
  onReplaceData?: (payload: ConciergeDataPayload) => void;
  onExit?: () => void;
}

const statusConfig: Record<
  BookingStatus,
  { labelKey: string; className: string }
> = {
  [BookingStatus.NEW]: {
    labelKey: "newStatus",
    className: "bg-amber-100 text-amber-700",
  },
  [BookingStatus.CONTACTED]: {
    labelKey: "contacted",
    className: "bg-blue-100 text-blue-700",
  },
  [BookingStatus.CONFIRMED]: {
    labelKey: "confirmed",
    className: "bg-emerald-100 text-emerald-700",
  },
  [BookingStatus.COMPLETED]: {
    labelKey: "completed",
    className: "bg-neutral-200 text-neutral-700",
  },
  [BookingStatus.CANCELLED]: {
    labelKey: "cancelled",
    className: "bg-red-100 text-red-700",
  },
  [BookingStatus.NO_SHOW]: {
    labelKey: "noShow",
    className: "bg-zinc-200 text-zinc-700",
  },
};

const venueCategories: Venue["category"][] = ["Nightclub", "Karaoke"];
const bookingSources: ReservationRequest["source"][] = [
  "WhatsApp",
  "Telegram",
  "Zalo",
  "Instagram",
  "Web Form",
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1400&auto=format&fit=crop";
const MAX_INLINE_IMAGE_BYTES = 780_000;
const MAX_REEL_VIDEO_BYTES = 250 * 1024 * 1024;
const DEFAULT_ZONE_COLORS = [
  "#0066ff",
  "#C92A2A",
  "#8B5CF6",
  "#2563EB",
  "#16A34A",
  "#F08A24",
];
const NOTIFICATION_STORAGE_KEY = "duyt_admin_notification_history";

function safeText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function safeImageSrc(value?: string | null) {
  const clean = safeText(value);
  return clean || FALLBACK_IMAGE;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.86,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không thể chuẩn bị file ảnh."));
      },
      type,
      quality,
    );
  });
}

async function resizeImageForUpload(
  file: File,
  maxWidth = 1600,
  maxHeight = 1100,
  quality = 0.86,
) {
  if (!file.type.startsWith("image/")) return file;

  const bitmapUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Không đọc được ảnh."));
      img.src = bitmapUrl;
    });

    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    const safeName = file.name.replace(/\.[^/.]+$/, "") || "image";

    return new File([blob], `${safeName}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

async function extractPosterFromVideo(
  file: File,
  targetWidth = 1080,
  targetHeight = 1920,
) {
  if (!file.type.startsWith("video/")) return null;

  const localUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
        reject(new Error("Không đọc được thông tin video."));
      video.src = localUrl;
      video.load();
    });

    const duration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : 1;
    const seekTime = Math.min(Math.max(duration * 0.08, 0.12), 2.5);

    await new Promise<void>((resolve, reject) => {
      const fallback = window.setTimeout(() => resolve(), 1800);
      video.onseeked = () => {
        window.clearTimeout(fallback);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(fallback);
        reject(new Error("Could not capture a video frame."));
      };
      try {
        video.currentTime = seekTime;
      } catch {
        window.clearTimeout(fallback);
        resolve();
      }
    });

    const sourceWidth = video.videoWidth || targetWidth;
    const sourceHeight = video.videoHeight || targetHeight;
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = sourceWidth / sourceHeight;

    let sx = 0;
    let sy = 0;
    let sw = sourceWidth;
    let sh = sourceHeight;

    if (sourceRatio > targetRatio) {
      sw = Math.round(sourceHeight * targetRatio);
      sx = Math.round((sourceWidth - sw) / 2);
    } else if (sourceRatio < targetRatio) {
      sh = Math.round(sourceWidth / targetRatio);
      sy = Math.round((sourceHeight - sh) / 2);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.86);
    const safeName = file.name.replace(/\.[^/.]+$/, "") || "reel-poster";
    return new File([blob], `${safeName}-poster.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(localUrl);
  }
}

async function uploadMediaFile(
  file: File,
  folder: "venues" | "venues/menus" | "reels" | "reels/posters" | "brand/logo",
) {
  const formData = new FormData();

  formData.append("file", file, file.name);
  formData.append("folder", folder);

  const response = await fetch("/api/upload-media", {
    method: "POST",
    body: formData,
    cache: "no-store",
    credentials: "same-origin",
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.ok || !json?.url) {
    throw new Error(
      json?.error ||
        "Upload thất bại. Vui lòng kiểm tra Supabase Storage bucket và service role key.",
    );
  }

  return String(json.url);
}

function isStorageQuotaError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function emptyBookingDraft(venueId = ""): BookingDraft {
  return {
    fullName: "",
    phoneNumber: "",
    venueId,
    guestCount: 2,
    date: new Date().toISOString().slice(0, 10),
    arrivalTime: "21:00",
    preferredTableId: "",
    notes: "",
    status: BookingStatus.CONFIRMED,
    source: "Web Form",
  };
}

function defaultFloorPlanTheme(
  category: Venue["category"] = "Nightclub",
): VenueFloorPlanTheme {
  if (category === "Karaoke") {
    return {
      style: "LOUNGE",
      ratio: "SQUARE",
      backgroundColor: "#101217",
      accentColor: "#0066ff",
      surfaceColor: "#161A22",
      gridColor: "rgba(214,168,95,0.08)",
      texture: "CARPET",
      helperText:
        "Layout Karaoke Lasvegas 1 với phòng riêng, lối đi, khu lễ tân và không gian VIP.",
      showGrid: false,
    };
  }

  return {
    style: "NIGHTCLUB",
    ratio: "PORTRAIT",
    backgroundColor: "#070A12",
    accentColor: "#0066ff",
    surfaceColor: "#111827",
    gridColor: "rgba(255,255,255,0.055)",
    texture: "GRID",
    helperText: "Layout ADM Club với DJ, sân khấu, quầy bar và khu bàn VIP.",
    showGrid: true,
  };
}

function sanitizeFloorPlanTheme(
  theme: VenueFloorPlanTheme | undefined,
  category: Venue["category"] = "Nightclub",
): VenueFloorPlanTheme {
  const fallback = defaultFloorPlanTheme(category);
  const raw = theme || fallback;
  return {
    ...fallback,
    ...raw,
    style: raw.style || fallback.style,
    ratio: raw.ratio || fallback.ratio,
    backgroundColor: safeText(raw.backgroundColor) || fallback.backgroundColor,
    accentColor: safeText(raw.accentColor) || fallback.accentColor,
    surfaceColor: safeText(raw.surfaceColor) || fallback.surfaceColor,
    gridColor: safeText(raw.gridColor) || fallback.gridColor,
    texture: raw.texture || fallback.texture || "GRID",
    helperText: safeText(raw.helperText) || fallback.helperText,
    showGrid: raw.showGrid !== false,
  };
}

function defaultTableZones(): VenueTableZone[] {
  return [
    {
      id: "zone-stage-front",
      name: "Stage Front",
      label: "Gần DJ / Sân khấu",
      description:
        "Khu nổi bật, phù hợp nhóm muốn không khí mạnh và vị trí trung tâm.",
      minimumSpend: 12000000,
      capacity: 10,
      color: "#C92A2A",
      order: 1,
      isActive: true,
    },
    {
      id: "zone-main-floor",
      name: "Main Floor",
      label: "Khu trung tâm",
      description: "Khu trung tâm, gần ánh sáng và sân khấu.",
      minimumSpend: 8000000,
      capacity: 6,
      color: "#F08A24",
      order: 2,
      isActive: true,
    },
    {
      id: "zone-vip-sofa",
      name: "VIP Sofa",
      label: "Sofa VIP",
      description: "Khu sofa riêng tư hơn cho nhóm VIP.",
      minimumSpend: 6000000,
      capacity: 8,
      color: "#8B5CF6",
      order: 3,
      isActive: true,
    },
    {
      id: "zone-bar-side",
      name: "Bar Side",
      label: "Gần quầy bar",
      description: "Khu gần bar, thuận tiện gọi đồ và di chuyển.",
      minimumSpend: 4500000,
      capacity: 4,
      color: "#2563EB",
      order: 4,
      isActive: true,
    },
  ];
}

function defaultPreferredTables(): PreferredTable[] {
  return [
    {
      id: `table-boss888-${Date.now()}`,
      name: "BOSS888",
      area: "Stage Front",
      zoneId: "zone-stage-front",
      minimumSpend: 15000000,
      capacity: 10,
      description: "Bàn nổi bật gần DJ, cần concierge xác nhận trực tiếp.",
      status: "INQUIRY",
      shape: "RECT",
      bookingMode: "BIDDING",
      x: 34,
      y: 18,
      width: 18,
      height: 6,
      color: "#C92A2A",
      badge: "BIDDING",
      sortOrder: 1,
    },
    {
      id: `table-v1-${Date.now()}`,
      name: "V1",
      area: "Main Floor",
      zoneId: "zone-main-floor",
      minimumSpend: 8000000,
      capacity: 4,
      description: "Bàn trung tâm sàn diễn.",
      status: "AVAILABLE",
      shape: "RECT",
      bookingMode: "REQUEST",
      x: 38,
      y: 32,
      width: 8,
      height: 5,
      color: "#F7F1E3",
      badge: "NONE",
      sortOrder: 2,
    },
    {
      id: `table-vv19-${Date.now()}`,
      name: "VV19",
      area: "VIP Sofa",
      zoneId: "zone-vip-sofa",
      minimumSpend: 6000000,
      capacity: 6,
      description: "Sofa VIP riêng tư bên phải.",
      status: "AVAILABLE",
      shape: "RECT",
      bookingMode: "REQUEST",
      x: 66,
      y: 42,
      width: 8,
      height: 7,
      color: "#8B5CF6",
      badge: "VIP",
      sortOrder: 3,
    },
    {
      id: `table-bar301-${Date.now()}`,
      name: "301",
      area: "Bar Side",
      zoneId: "zone-bar-side",
      minimumSpend: 4500000,
      capacity: 4,
      description: "Khu gần bar.",
      status: "AVAILABLE",
      shape: "BAR",
      bookingMode: "REQUEST",
      x: 30,
      y: 8,
      width: 7,
      height: 5,
      color: "#2563EB",
      badge: "NONE",
      sortOrder: 4,
    },
  ];
}

function defaultFloorPlanElements(
  category: Venue["category"] = "Nightclub",
): VenueMapElement[] {
  if (category === "Karaoke") {
    return [
      {
        id: `element-reception-${Date.now()}`,
        type: "CUSTOM",
        label: "Lễ tân",
        x: 18,
        y: 88,
        width: 22,
        height: 7,
        color: "#0066ff",
        order: 1,
        isActive: true,
      },
      {
        id: `element-walkway-${Date.now()}`,
        type: "WALKWAY",
        label: "Lối đi chính",
        x: 50,
        y: 50,
        width: 10,
        height: 76,
        color: "#0066ff",
        order: 2,
        isActive: true,
      },
      {
        id: `element-room-${Date.now()}`,
        type: "VIP_ROOM",
        label: "Phòng VIP",
        x: 30,
        y: 34,
        width: 26,
        height: 16,
        color: "#8B5CF6",
        order: 3,
        isActive: true,
      },
      {
        id: `element-screen-${Date.now()}`,
        type: "CUSTOM",
        label: "Màn hình",
        x: 70,
        y: 34,
        width: 26,
        height: 8,
        color: "#2563EB",
        order: 4,
        isActive: true,
      },
    ];
  }

  return [
    {
      id: `element-dj-${Date.now()}`,
      type: "DJ",
      label: "DJ",
      x: 50,
      y: 9,
      width: 38,
      height: 6,
      color: "#A855F7",
      order: 1,
      isActive: true,
    },
    {
      id: `element-stage-${Date.now()}`,
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
      id: `element-bar-${Date.now()}`,
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
      id: `element-door-${Date.now()}`,
      type: "DOOR",
      label: "Lối vào",
      x: 50,
      y: 94,
      width: 24,
      height: 5,
      color: "#0066ff",
      order: 4,
      isActive: true,
    },
  ];
}

function sanitizeFloorPlanElements(
  elements: VenueMapElement[] | undefined,
  category: Venue["category"] = "Nightclub",
): VenueMapElement[] {
  const source =
    elements && elements.length ? elements : defaultFloorPlanElements(category);
  return source.map((element, index) => ({
    id: safeText(element.id) || `element-${Date.now()}-${index}`,
    type: element.type || "CUSTOM",
    label: safeText(element.label) || element.type || `Element ${index + 1}`,
    x: Math.max(0, Math.min(100, Number(element.x) || 50)),
    y: Math.max(0, Math.min(100, Number(element.y) || 50)),
    width: Math.max(2, Math.min(95, Number(element.width) || 20)),
    height: Math.max(2, Math.min(60, Number(element.height) || 5)),
    rotation: Number(element.rotation) || 0,
    color: safeText(element.color) || "#0066ff",
    order: Number(element.order) || index + 1,
    isActive: element.isActive !== false,
  }));
}

function sanitizeZones(zones: VenueTableZone[]): VenueTableZone[] {
  const fallback = defaultTableZones();
  const source = zones.length ? zones : fallback;
  return source.map((zone, index) => ({
    id: safeText(zone.id) || `zone-${index + 1}`,
    name: safeText(zone.name) || `Zone ${index + 1}`,
    label: safeText(zone.label) || safeText(zone.name) || `Zone ${index + 1}`,
    description: safeText(zone.description),
    minimumSpend: Math.max(0, Number(zone.minimumSpend) || 0),
    capacity: Math.max(1, Number(zone.capacity) || 1),
    color: safeText(zone.color) || "#0066ff",
    order: Number(zone.order) || index + 1,
    isActive: zone.isActive !== false,
  }));
}

function sanitizeTables(
  tables: PreferredTable[],
  zones: VenueTableZone[],
): PreferredTable[] {
  const source = tables.length ? tables : defaultPreferredTables();
  const fallbackZone = zones[0];
  return source.map((table, index) => {
    const zone =
      zones.find((item) => item.id === table.zoneId) ||
      zones.find((item) => item.name === table.area) ||
      fallbackZone;
    return {
      id: safeText(table.id) || `table-${Date.now()}-${index}`,
      name: safeText(table.name) || `Table ${index + 1}`,
      area: safeText(table.area) || zone?.name || "VIP Area",
      zoneId: safeText(table.zoneId) || zone?.id,
      minimumSpend: Math.max(
        0,
        Number(table.minimumSpend) || zone?.minimumSpend || 0,
      ),
      capacity: Math.max(1, Number(table.capacity) || zone?.capacity || 2),
      description: safeText(table.description),
      status: table.status || "AVAILABLE",
      shape: table.shape || "RECT",
      bookingMode: table.bookingMode || "REQUEST",
      x: Math.max(0, Math.min(100, Number(table.x) || 20 + (index % 5) * 12)),
      y: Math.max(
        0,
        Math.min(100, Number(table.y) || 22 + Math.floor(index / 5) * 8),
      ),
      width: Math.max(3, Math.min(35, Number(table.width) || 8)),
      height: Math.max(3, Math.min(25, Number(table.height) || 5)),
      rotation: Number(table.rotation) || 0,
      color: safeText(table.color) || zone?.color || "#0066ff",
      sortOrder: Number(table.sortOrder) || index + 1,
      badge: table.badge || "NONE",
    };
  });
}

function emptyVenueDraft(): VenueDraft {
  return {
    name: "",
    category: "Nightclub",
    location: "Da Nang",
    shortDescription: "",
    longDescription: "",
    imageUrls: [FALLBACK_IMAGE],
    videoUrl: "",
    menuUrl: "",
    menuPdfUrl: "",
    openingOpen: "18:00",
    openingClose: "02:00",
    openingLabel: "18:00 - 02:00",
    viewCount: 0,
    rating: 4.8,
    reviewsCount: 0,
    minimumSpend: 3000000,
    capacity: 4,
    floorPlanTheme: defaultFloorPlanTheme("Nightclub"),
    floorPlanElements: defaultFloorPlanElements("Nightclub"),
    tableZones: defaultTableZones(),
    preferredTables: defaultPreferredTables(),
  };
}

function emptyReelDraft(
  venueId = "",
  venueName = "DuyT Reel",
  posterUrl = "",
  order = 1,
): VenueReelDraft {
  const safeTag = (venueName || "DuyT").split(" ")[0] || "DuyT";
  return {
    id: `reel-${Date.now()}`,
    venueId,
    title: venueName ? `${venueName} Reel` : "DuyT Reel",
    tag: safeTag,
    caption: "",
    instagramUrl: "",
    videoUrl: "",
    posterUrl,
    isActive: true,
    order,
    placement: "HOME_FEED",
  };
}

function cleanVenueReel(
  reel: Partial<VenueReelDraft>,
  fallbackVenue?: Venue,
  fallbackOrder = 1,
): VenueReelDraft {
  const venueId = safeText(reel.venueId) || fallbackVenue?.id || "";
  const venueName = fallbackVenue?.name || "DuyT Reel";
  return {
    id: safeText(reel.id) || `reel-${Date.now()}`,
    venueId,
    title: safeText(reel.title) || `${venueName} Reel`,
    tag: safeText(reel.tag) || venueName.split(" ")[0] || "DuyT",
    caption: safeText(reel.caption),
    instagramUrl:
      normalizeInstagramPermalink(safeText(reel.instagramUrl)) || "",
    videoUrl: safeText(reel.videoUrl),
    posterUrl: safeText(reel.posterUrl) || fallbackVenue?.image || "",
    isActive: reel.isActive !== false,
    order: Number(reel.order) || fallbackOrder,
    placement: reel.placement || "HOME_FEED",
  };
}

function getVenueReels(venue: Venue) {
  const rawReels = Array.isArray(venue.reels) ? venue.reels : [];
  return rawReels.map((reel, index) =>
    cleanVenueReel(
      { ...reel, venueId: reel.venueId || venue.id },
      venue,
      index + 1,
    ),
  );
}

function getAllVenueReels(venues: Venue[]) {
  return venues
    .flatMap((venue) =>
      getVenueReels(venue).map((reel) => ({
        ...reel,
        venueName: venue.name,
        venueImage: venue.image,
      })),
    )
    .sort((a, b) => (Number(a.order) || 9999) - (Number(b.order) || 9999))
    .map((reel, index) => ({ ...reel, order: index + 1 }));
}

function emptyCustomerDraft(): CustomerDraft {
  return {
    fullName: "",
    phoneNumber: "",
    vipStatus: VipStatus.VIP,
    notes: "",
  };
}

function slugId(prefix: string, value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36);
  return `${prefix}-${normalized || Date.now()}`;
}

function getLocalDateInputValue(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value?: string | Date | null) {
  if (!value) return "";
  if (value instanceof Date) return getLocalDateInputValue(value);

  const clean = safeText(value);
  if (!clean) return "";

  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const vnMatch = clean.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (vnMatch) {
    const [, day, month, year] = vnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) return getLocalDateInputValue(parsed);

  return clean;
}

function dateKeyToLocalDate(dateKey: string) {
  const clean = normalizeDateKey(dateKey);
  if (!clean) return new Date();
  const [year, month, day] = clean.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function safeDateTimeMs(value?: string | Date | null) {
  if (!value) return 0;

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  const clean = safeText(value);
  if (!clean) return 0;

  const parsed = new Date(clean);
  const timestamp = parsed.getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

const ADMIN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const CREATED_AT_WITHOUT_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?$/;
const HAS_EXPLICIT_TIMEZONE_PATTERN = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

function safeCreatedDateTimeMs(value?: string | Date | null) {
  if (!value) return 0;

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  const clean = safeText(value);
  if (!clean) return 0;

  const normalizedDateTime = clean.replace(" ", "T");
  const normalized =
    CREATED_AT_WITHOUT_TIMEZONE_PATTERN.test(normalizedDateTime) &&
    !HAS_EXPLICIT_TIMEZONE_PATTERN.test(normalizedDateTime)
      ? `${normalizedDateTime}Z`
      : normalizedDateTime;

  const timestamp = new Date(normalized).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatAdminDateTime(
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
) {
  const timestamp = safeCreatedDateTimeMs(value);
  if (!timestamp) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: ADMIN_TIME_ZONE,
    ...(options || {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  }).format(new Date(timestamp));
}

function timestampFromId(value?: string | null) {
  const clean = safeText(value);
  const match = clean.match(/(\d{12,})$/);
  if (!match) return 0;

  const timestamp = Number(match[1]);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
}

function getBookingArrivalTimeMs(booking: ReservationRequest) {
  const dateKey = normalizeDateKey(booking.date);
  const time = /^\d{2}:\d{2}$/.test(safeText(booking.arrivalTime))
    ? booking.arrivalTime
    : "00:00";

  return safeDateTimeMs(`${dateKey}T${time}:00`);
}

function getBookingCreatedTimeMs(booking: ReservationRequest) {
  return (
    safeCreatedDateTimeMs(booking.createdAt) ||
    timestampFromId(booking.id) ||
    getBookingArrivalTimeMs(booking) ||
    Date.now()
  );
}

function getBookingCreatedIso(booking: ReservationRequest) {
  return new Date(getBookingCreatedTimeMs(booking)).toISOString();
}

function getBookingCreatedDateKey(booking: ReservationRequest) {
  return getLocalDateInputValue(new Date(getBookingCreatedTimeMs(booking)));
}

function getNotificationSortTime(notice: AdminNotification) {
  return (
    safeCreatedDateTimeMs(notice.createdAt) ||
    timestampFromId(notice.reservationId) ||
    timestampFromId(notice.id) ||
    0
  );
}

function sortReservationsByCreatedAtDesc(
  reservations: ReservationRequest[],
) {
  return [...reservations].sort((a, b) => {
    const createdDiff = getBookingCreatedTimeMs(b) - getBookingCreatedTimeMs(a);
    if (createdDiff !== 0) return createdDiff;

    return getBookingArrivalTimeMs(b) - getBookingArrivalTimeMs(a);
  });
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeOptionsForOpeningHours(open = "18:00", close = "02:00") {
  const start = minutesFromTime(open);
  let end = minutesFromTime(close);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return ["18:00"];
  if (end <= start) end += 24 * 60;
  const options: string[] = [];
  for (let value = start; value <= end; value += 30) {
    const normalized = value % (24 * 60);
    const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
    const minutes = String(normalized % 60).padStart(2, "0");
    options.push(`${hours}:${minutes}`);
  }
  return options;
}

function isTimeWithinOpeningHours(
  time: string,
  open = "18:00",
  close = "02:00",
) {
  return timeOptionsForOpeningHours(open, close).includes(time);
}

function isValidArrivalWindow(
  date: string,
  time: string,
  open = "00:00",
  close = "23:30",
) {
  if (!date || !time || !/^\d{2}:\d{2}$/.test(time)) return false;
  const [hours, minutes] = time.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  )
    return false;
  if (!isTimeWithinOpeningHours(time, open, close)) return false;
  const selected = new Date(`${date}T${time}:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = getLocalDateInputValue();
  if (date < today) return false;
  if (date === today && selected.getTime() < Date.now() + 30 * 60 * 1000)
    return false;
  return true;
}

function normalizeInstagramPermalink(rawUrl: string) {
  const value = safeText(rawUrl);
  if (!value) return "";

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (!host.includes("instagram.com")) return value;

    const parts = url.pathname.split("/").filter(Boolean);
    const type = parts[0]?.toLowerCase();
    const shortcode = parts[1];

    if (shortcode && ["p", "reel", "tv"].includes(type)) {
      return `https://www.instagram.com/${type}/${shortcode}/`;
    }

    return "";
  } catch {
    return value;
  }
}

function getInstagramEmbedUrl(rawUrl: string) {
  const value = safeText(rawUrl);
  if (!value) return "";

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (!host.includes("instagram.com")) return "";

    const parts = url.pathname.split("/").filter(Boolean);
    const type = parts[0];
    const shortcode = parts[1];

    if (!shortcode || !["p", "reel", "tv"].includes(type)) return "";

    return `https://www.instagram.com/${type}/${shortcode}/embed`;
  } catch {
    return "";
  }
}

function isDirectVideoUrl(rawUrl: string) {
  const value = safeText(rawUrl).toLowerCase();
  return (
    value.startsWith("blob:") ||
    value.startsWith("data:video") ||
    /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(value)
  );
}

function VenueVideoPreview({
  videoUrl,
  compact = false,
}: {
  videoUrl: string;
  compact?: boolean;
}) {
  const cleanUrl = videoUrl.trim();
  const instagramEmbedUrl = getInstagramEmbedUrl(cleanUrl);
  const heightClass = compact ? "h-[150px]" : "h-[300px]";

  if (!cleanUrl) {
    return (
      <div
        className={`${heightClass} flex items-center justify-center rounded-2xl border border-dashed border-[#0066ff]/35 bg-black/5 px-4 text-center text-xs font-semibold text-[#64748b]`}
      >
        Paste Instagram Reel/Post URL or upload a direct 9:16 video file.
      </div>
    );
  }

  if (isDirectVideoUrl(cleanUrl)) {
    return (
      <div
        className={`${heightClass} overflow-hidden rounded-2xl bg-black shadow-inner`}
      >
        <video
          src={cleanUrl}
          controls
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (instagramEmbedUrl) {
    return (
      <div
        className={`${heightClass} flex items-center justify-center overflow-hidden rounded-2xl bg-black shadow-inner`}
      >
        <div
          className="h-full overflow-hidden rounded-xl bg-black"
          style={{ aspectRatio: "9 / 16" }}
        >
          <iframe
            title="Instagram venue reel preview"
            src={instagramEmbedUrl}
            className="h-full w-full border-0 bg-black"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${heightClass} flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-center text-xs font-semibold text-amber-800`}
    >
      Use an Instagram /reel, /p URL, or upload a direct .mp4/.webm video file.
    </div>
  );
}

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((item) => item.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const CSV_HEADER = [
  "type",
  "id",
  "name",
  "phone",
  "venueId",
  "venueName",
  "status",
  "date",
  "time",
  "guestCount",
  "category",
  "location",
  "notes",
  "description",
  "image",
  "rating",
  "instagramUrl",
  "videoUrl",
  "posterUrl",
  "order",
  "placement",
  "isActive",
  "zoneId",
  "area",
  "capacity",
  "minimumSpend",
  "x",
  "y",
  "width",
  "height",
  "color",
  "shape",
  "bookingMode",
  "badge",
];

function buildCsv(payload: ConciergeDataPayload) {
  const rows: string[][] = [CSV_HEADER];

  payload.venues.forEach((venue) =>
    rows.push([
      "VENUE",
      venue.id,
      venue.name,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      venue.category,
      venue.location,
      "",
      venue.shortDescription,
      venue.image,
      String(venue.rating),
      "",
      venue.videoUrl || "",
      "",
      "",
      "",
      "",
    ]),
  );
  payload.customers.forEach((customer) =>
    rows.push([
      "CUSTOMER",
      customer.id,
      customer.fullName,
      customer.phoneNumber,
      "",
      "",
      String(customer.vipStatus),
      "",
      "",
      "",
      "",
      "",
      customer.notes,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  payload.reservations.forEach((booking) =>
    rows.push([
      "BOOKING",
      booking.id,
      booking.fullName,
      booking.phoneNumber,
      booking.venueId,
      booking.venueName,
      booking.status,
      booking.date,
      booking.arrivalTime,
      String(booking.guestCount),
      "",
      "",
      booking.notes,
      booking.preferredTableName,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  payload.venues.forEach((venue) => {
    (venue.reels || []).forEach((reel) =>
      rows.push([
        "REEL",
        reel.id,
        reel.title,
        "",
        reel.venueId || venue.id,
        venue.name,
        reel.isActive === false ? "INACTIVE" : "ACTIVE",
        "",
        "",
        "",
        "",
        "",
        reel.caption || "",
        reel.tag || "",
        "",
        "",
        reel.instagramUrl || "",
        reel.videoUrl || "",
        reel.posterUrl || "",
        String(reel.order || 1),
        reel.placement || "HOME_FEED",
        reel.isActive === false ? "FALSE" : "TRUE",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]),
    );
    (venue.tableZones || []).forEach((zone) =>
      rows.push([
        "TABLE_ZONE",
        zone.id,
        zone.name,
        "",
        venue.id,
        venue.name,
        zone.isActive === false ? "INACTIVE" : "ACTIVE",
        "",
        "",
        "",
        "",
        "",
        zone.description || "",
        zone.label || zone.name,
        "",
        "",
        "",
        "",
        "",
        String(zone.order || 1),
        "",
        zone.isActive === false ? "FALSE" : "TRUE",
        "",
        "",
        String(zone.capacity || 1),
        String(zone.minimumSpend || 0),
        "",
        "",
        "",
        "",
        zone.color || "#0066ff",
        "",
        "",
        "",
      ]),
    );
    (venue.preferredTables || []).forEach((table) =>
      rows.push([
        "TABLE",
        table.id,
        table.name,
        "",
        venue.id,
        venue.name,
        table.status || "AVAILABLE",
        "",
        "",
        "",
        "",
        "",
        table.description || "",
        table.area || "",
        "",
        "",
        "",
        "",
        "",
        String(table.sortOrder || 1),
        "",
        "",
        table.zoneId || "",
        table.area || "",
        String(table.capacity || 1),
        String(table.minimumSpend || 0),
        String(table.x || ""),
        String(table.y || ""),
        String(table.width || ""),
        String(table.height || ""),
        table.color || "",
        table.shape || "RECT",
        table.bookingMode || "REQUEST",
        table.badge || "NONE",
      ]),
    );
  });

  return `\ufeffsep=,\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

function getImportTemplateRows() {
  return [
    CSV_HEADER,
    [
      "VENUE",
      "venue-new-club",
      "Tên địa điểm mới",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Nightclub",
      "Hải Châu, Đà Nẵng",
      "",
      "Mô tả ngắn hiển thị trên web",
      "https://example.com/main-image.jpg",
      "4.8",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "TABLE_ZONE",
      "zone-dj-front",
      "DJ Front",
      "",
      "venue-new-club",
      "Tên địa điểm mới",
      "ACTIVE",
      "",
      "",
      "",
      "",
      "",
      "Khu gần DJ và sân khấu",
      "DJ / Stage Front",
      "",
      "",
      "",
      "",
      "",
      "1",
      "",
      "TRUE",
      "",
      "",
      "10",
      "15000000",
      "",
      "",
      "",
      "",
      "#C92A2A",
      "",
      "",
      "",
    ],
    [
      "TABLE",
      "table-boss888",
      "BOSS888",
      "",
      "venue-new-club",
      "Tên địa điểm mới",
      "INQUIRY",
      "",
      "",
      "",
      "",
      "",
      "Bàn gần DJ, cần concierge xác nhận trực tiếp",
      "DJ Front",
      "",
      "",
      "",
      "",
      "",
      "1",
      "",
      "",
      "zone-dj-front",
      "DJ Front",
      "10",
      "15000000",
      "34",
      "18",
      "18",
      "6",
      "#C92A2A",
      "RECT",
      "BIDDING",
      "BIDDING",
    ],
    [
      "REEL",
      "reel-new-1",
      "ADM Reel 1",
      "",
      "venue-new-club",
      "Tên địa điểm mới",
      "ACTIVE",
      "",
      "",
      "",
      "",
      "",
      "Caption hiển thị ở homepage",
      "ADM",
      "",
      "",
      "https://www.instagram.com/reel/SHORTCODE/",
      "https://example.com/reel.mp4",
      "",
      "1",
      "HOME_FEED",
      "TRUE",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "CUSTOMER",
      "cust-new-1",
      "Nguyễn Văn A",
      "0865251125",
      "",
      "",
      "VIP",
      "",
      "",
      "",
      "",
      "",
      "Ghi chú khách hàng",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "BOOKING",
      "res-new-1",
      "Nguyễn Văn A",
      "0865251125",
      "venue-new-club",
      "Tên địa điểm mới",
      "NEW",
      "2026-06-30",
      "21:00",
      "4",
      "",
      "",
      "Ghi chú booking",
      "VIP Table",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
  ];
}

function buildImportTemplateCsv() {
  const sampleRows = getImportTemplateRows();
  return `\ufeffsep=,\n${sampleRows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getLogoDataUrl(logoUrl = "/duyt-logo.png") {
  try {
    const response = await fetch(logoUrl || "/duyt-logo.png", {
      cache: "force-cache",
    });
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read logo."));
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function reportStyles() {
  return `
    body{font-family:Arial,'Segoe UI',sans-serif;color:#0f172a;background:#fff;margin:24px;}
    .brand{display:flex;align-items:center;gap:18px;border:1px solid #e2e8f0;border-radius:18px;padding:18px 22px;margin-bottom:22px;background:#111827;color:white;}
    .brand img{width:104px;height:auto;object-fit:contain;}
    .brand h1{font-size:24px;margin:0;color:#fff;letter-spacing:.02em;}
    .brand p{margin:4px 0 0;color:#0066ff;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;}
    .meta{font-size:12px;color:#475569;margin:0 0 18px;}
    h2{margin:26px 0 10px;color:#0052cc;font-size:18px;}
    table{border-collapse:collapse;width:100%;margin-bottom:22px;font-size:12px;}
    th{background:#0f172a;color:#0066ff;text-transform:uppercase;letter-spacing:.08em;font-size:11px;text-align:left;}
    td,th{border:1px solid #D9D9DF;padding:8px;vertical-align:top;mso-number-format:'\\@';}
    tr:nth-child(even) td{background:#FAFAFB;}
    .note{border:1px solid #e2e8f0;background:#f8f9ff;border-radius:14px;padding:12px 14px;color:#475569;font-size:12px;}
  `;
}

function tableHtml(
  title: string,
  headers: string[],
  rows: Array<Array<unknown>>,
) {
  return `<h2>${escapeHtml(title)}</h2><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function buildReportHtml(
  payload: ConciergeDataPayload,
  logoDataUrl = "",
  mode: "excel" | "word" | "print" = "word",
) {
  const reels = payload.venues.flatMap((venue) =>
    (venue.reels || []).map((reel) => ({
      ...reel,
      venueName: venue.name,
      venueId: reel.venueId || venue.id,
    })),
  );
  const generatedAt = new Date().toLocaleString("vi-VN");
  const logo = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="DuyT logo" />`
    : `<div style="font-size:28px;font-weight:700;color:#0066ff;">DuyT</div>`;
  const excelNs =
    mode === "excel" ? 'xmlns:x="urn:schemas-microsoft-com:office:excel"' : "";

  return `<!doctype html><html ${excelNs}><head><meta charset="utf-8"><title>DuyT Danang-Concierge Export</title><style>${reportStyles()}</style></head><body>
    <div class="brand">${logo}<div><h1>DuyT Danang-Concierge</h1><p>Báo cáo vận hành</p></div></div>
    <p class="meta">Xuất lúc: ${escapeHtml(generatedAt)} · Địa điểm: ${payload.venues.length} · Reels: ${reels.length} · Đặt chỗ: ${payload.reservations.length} · Khách hàng: ${payload.customers.length}</p>
    <div class="note">Dữ liệu xuất dùng để đối soát, bàn giao và lưu trữ vận hành. Khi cần nhập lại, hãy dùng mẫu CSV UTF-8 chuẩn.</div>
    ${tableHtml(
      "Địa điểm",
      ["ID", "Tên", "Danh mục", "Vị trí", "Mô tả", "Ảnh", "Đánh giá"],
      payload.venues.map((venue) => [
        venue.id,
        venue.name,
        venue.category,
        venue.location,
        venue.shortDescription,
        venue.image,
        venue.rating,
      ]),
    )}
    ${tableHtml(
      "Reels trang chủ / địa điểm",
      [
        "ID",
        "Venue",
        "Title",
        "Tag",
        "Caption",
        "Instagram",
        "Video URL",
        "Poster",
        "Order",
        "Placement",
        "Active",
      ],
      reels.map((reel) => [
        reel.id,
        reel.venueName,
        reel.title,
        reel.tag,
        reel.caption,
        reel.instagramUrl,
        reel.videoUrl,
        reel.posterUrl,
        reel.order,
        reel.placement,
        reel.isActive !== false ? "Có" : "Không",
      ]),
    )}
    ${tableHtml(
      "Khu bàn/phòng",
      [
        "Địa điểm",
        "Mã khu",
        "Tên",
        "Nhãn",
        "Minimum spend",
        "Sức chứa",
        "Màu",
        "Thứ tự",
        "Hiển thị",
      ],
      payload.venues.flatMap((venue) =>
        (venue.tableZones || []).map((zone) => [
          venue.name,
          zone.id,
          zone.name,
          zone.label,
          zone.minimumSpend,
          zone.capacity,
          zone.color,
          zone.order,
          zone.isActive !== false ? "Có" : "Không",
        ]),
      ),
    )}
    ${tableHtml(
      "Bàn/phòng",
      [
        "Địa điểm",
        "Mã bàn/phòng",
        "Tên",
        "Khu",
        "Mã khu",
        "Minimum spend",
        "Sức chứa",
        "Trạng thái",
        "Cơ chế",
        "X",
        "Y",
        "Rộng",
        "Cao",
      ],
      payload.venues.flatMap((venue) =>
        (venue.preferredTables || []).map((table) => [
          venue.name,
          table.id,
          table.name,
          table.area,
          table.zoneId || "",
          table.minimumSpend,
          table.capacity,
          table.status || "AVAILABLE",
          table.bookingMode || "REQUEST",
          table.x || "",
          table.y || "",
          table.width || "",
          table.height || "",
        ]),
      ),
    )}
    ${tableHtml(
      "Đặt chỗ",
      [
        "ID",
        "Khách",
        "Số điện thoại",
        "Địa điểm",
        "Ngày",
        "Giờ",
        "Số khách",
        "Bàn/phòng",
        "Trạng thái",
        "Ghi chú",
      ],
      payload.reservations.map((booking) => [
        booking.id,
        booking.fullName,
        booking.phoneNumber,
        booking.venueName,
        booking.date,
        booking.arrivalTime,
        booking.guestCount,
        booking.preferredTableName,
        booking.status,
        booking.notes,
      ]),
    )}
    ${tableHtml(
      "Khách hàng",
      ["ID", "Name", "Phone", "VIP", "Notes"],
      payload.customers.map((customer) => [
        customer.id,
        customer.fullName,
        customer.phoneNumber,
        customer.vipStatus,
        customer.notes,
      ]),
    )}
  </body></html>`;
}

function buildWordHtml(payload: ConciergeDataPayload, logoDataUrl = "") {
  return buildReportHtml(payload, logoDataUrl, "word");
}

function buildExcelHtml(payload: ConciergeDataPayload, logoDataUrl = "") {
  return buildReportHtml(payload, logoDataUrl, "excel");
}

function buildImportTemplateExcelHtml(logoDataUrl = "") {
  const [headers, ...sampleRows] = getImportTemplateRows();
  const logo = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="DuyT logo" />`
    : `<div style="font-size:28px;font-weight:700;color:#0066ff;">DuyT</div>`;
  return `<!doctype html><html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><title>Mẫu import DuyT</title><style>${reportStyles()}</style></head><body>
    <div class="brand">${logo}<div><h1>DuyT Danang-Concierge</h1><p>Admin import template</p></div></div>
    <p class="meta">Chỉnh các dòng mẫu bên dưới. Khi nhập lại, hãy tải mẫu CSV hoặc lưu file này thành CSV UTF-8.</p>
    <div class="note">Các loại dữ liệu hỗ trợ: VENUE, REEL, CUSTOMER, BOOKING. Với reel, ảnh bìa có thể để trống nếu upload video trong dashboard.</div>
    ${tableHtml("Mẫu import có thể chỉnh sửa", headers, sampleRows)}
  </body></html>`;
}

function normalizedPhone(value = "") {
  return value.replace(/\s+/g, "").trim();
}

function findReservationVenue(booking: ReservationRequest, venues: Venue[]) {
  return venues.find(
    (venue) => venue.id === booking.venueId || venue.name === booking.venueName,
  );
}

function findReservationTable(booking: ReservationRequest, venues: Venue[]) {
  const venue = findReservationVenue(booking, venues);
  return venue?.preferredTables.find(
    (table) =>
      table.id === booking.preferredTableId ||
      table.name === booking.preferredTableName,
  );
}

function getReservationZoneLabel(booking: ReservationRequest, venues: Venue[]) {
  const venue = findReservationVenue(booking, venues);
  const table = findReservationTable(booking, venues);
  const zone = venue?.tableZones?.find(
    (item) =>
      item.id === table?.zoneId ||
      item.name === table?.area ||
      item.label === table?.area,
  );
  return (
    booking.preferredTableArea ||
    zone?.label ||
    zone?.name ||
    table?.area ||
    "Concierge chọn khu"
  );
}

function getReservationTableColor(
  booking: ReservationRequest,
  venues: Venue[],
) {
  const table = findReservationTable(booking, venues);
  const venue = findReservationVenue(booking, venues);
  const zone = venue?.tableZones?.find(
    (item) =>
      item.id === table?.zoneId ||
      item.name === table?.area ||
      item.label === table?.area,
  );
  return (
    booking.preferredTableColor || table?.color || zone?.color || "#0066ff"
  );
}

function getReservationMinimumSpend(
  booking: ReservationRequest,
  venues: Venue[],
) {
  const table = findReservationTable(booking, venues);
  return (
    booking.preferredTableMinimumSpend ||
    table?.minimumSpend ||
    booking.guestCount * 500000
  );
}

function loadNotificationHistory(): AdminNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
  } catch {
    return [];
  }
}

function saveNotificationHistory(notifications: AdminNotification[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(notifications.slice(0, 100)),
    );
  } catch {
    // Notification history is best-effort and should never block admin operations.
  }
}

function buildBookingNotice(
  booking: ReservationRequest,
  venues: Venue[],
): AdminNotification {
  const color = getReservationTableColor(booking, venues);
  const zoneLabel = getReservationZoneLabel(booking, venues);
  return {
    id: `notice-${booking.id}`,
    reservationId: booking.id,
    title: `Đặt chỗ mới · ${booking.preferredTableName || "Chưa chọn bàn"}`,
    message: `${booking.fullName} · ${booking.venueName} · ${zoneLabel} · ${booking.guestCount} khách`,
    createdAt: getBookingCreatedIso(booking),
    read: false,
    tableColor: color,
  };
}

function shouldNotifyAdminForBooking(booking: ReservationRequest) {
  return (
    booking.status === BookingStatus.NEW ||
    booking.status === BookingStatus.CONTACTED
  );
}

function buildBookingNoticeForSync(
  booking: ReservationRequest,
  venues: Venue[],
): AdminNotification {
  return {
    ...buildBookingNotice(booking, venues),
    read: !shouldNotifyAdminForBooking(booking),
  };
}

function getNewestUnreadNotification(
  notifications: AdminNotification[],
): AdminNotification | null {
  return (
    notifications
      .filter((notice) => !notice.read)
      .sort((a, b) => getNotificationSortTime(b) - getNotificationSortTime(a))[0] || null
  );
}

function mergeNotificationHistory(
  ...sources: AdminNotification[][]
): AdminNotification[] {
  const unique = new Map<string, AdminNotification>();

  sources.flat().forEach((notice) => {
    if (!notice?.id) return;

    const existing = unique.get(notice.id);

    if (existing) {
      unique.set(notice.id, {
        ...notice,
        ...existing,
        read: existing.read,
        createdAt: existing.createdAt || notice.createdAt,
      });
      return;
    }

    unique.set(notice.id, notice);
  });

  return Array.from(unique.values())
    .sort((a, b) => getNotificationSortTime(b) - getNotificationSortTime(a))
    .slice(0, 150);
}

function areNotificationsEqual(
  current: AdminNotification[],
  next: AdminNotification[],
) {
  if (current.length !== next.length) return false;

  return current.every((item, index) => {
    const other = next[index];
    return (
      other &&
      item.id === other.id &&
      item.reservationId === other.reservationId &&
      item.title === other.title &&
      item.message === other.message &&
      item.createdAt === other.createdAt &&
      item.read === other.read &&
      item.tableColor === other.tableColor
    );
  });
}

function syncNotificationHistoryWithBookings(
  history: AdminNotification[],
  bookings: ReservationRequest[],
  venues: Venue[],
) {
  const existingById = new Map(history.map((notice) => [notice.id, notice]));
  const bookingIds = new Set(bookings.map((booking) => booking.id));

  const bookingNotices = bookings.map((booking) => {
    const fresh = buildBookingNoticeForSync(booking, venues);
    const existing = existingById.get(fresh.id);

    if (!existing) return fresh;

    return {
      ...existing,
      ...fresh,
      createdAt: fresh.createdAt || existing.createdAt,
      read: shouldNotifyAdminForBooking(booking) ? existing.read : true,
    };
  });

  const nonBookingNotices = history.filter(
    (notice) => !notice.reservationId || !bookingIds.has(notice.reservationId),
  );

  return mergeNotificationHistory(bookingNotices, nonBookingNotices);
}

async function loadNotificationHistoryFromServer(): Promise<
  AdminNotification[]
> {
  const response = await fetch("/api/admin-notifications?limit=100", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || "Không tải được lịch sử thông báo.");
  }

  return Array.isArray(json.notifications)
    ? (json.notifications as AdminNotification[])
    : [];
}

async function saveNotificationHistoryToServer(
  notifications: AdminNotification[],
) {
  if (!notifications.length) return;

  await fetch("/api/admin-notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    credentials: "same-origin",
    body: JSON.stringify({ notifications }),
  });
}

async function markNotificationsReadOnServer(ids?: string[]) {
  await fetch("/api/admin-notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    credentials: "same-origin",
    body: JSON.stringify({ ids, read: true }),
  });
}

function playAdminBell() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const gain = context.createGain();
    const osc = context.createOscillator();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, context.currentTime);
    osc.frequency.setValueAtTime(1175, context.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.6);
    window.setTimeout(() => context.close().catch(() => undefined), 900);
  } catch {
    // Browsers can block sound until the admin interacts with the page.
  }
}

function DashboardContent({
  coreVenues = [],
  coreReservations = [],
  coreCustomers = [],
  onUpdateReservations,
  onUpdateCustomers,
  onUpdateVenues,
  onReplaceData,
  onExit,
}: LuxuryDashboardProps) {
  const { t } = useI18n();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(
    emptyBookingDraft(coreVenues[0]?.id || ""),
  );
  const [venueDraft, setVenueDraft] = useState<VenueDraft>(emptyVenueDraft());
  const [customerDraft, setCustomerDraft] =
    useState<CustomerDraft>(emptyCustomerDraft());
  const [toast, setToast] = useState<{
    kind: ToastKind;
    message: string;
  } | null>(null);
  const [liveToast, setLiveToast] = useState<AdminNotification | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>(() =>
    loadNotificationHistory(),
  );
  const [notificationOpen, setNotificationOpen] = useState(false);
  const knownReservationIdsRef = useRef<Set<string> | null>(null);
  const hydratedNotificationsRef = useRef(false);
  const loginUnreadToastShownRef = useRef(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);
  const [reelEditor, setReelEditor] = useState<{
    reelId: string | null;
    venueId: string | null;
  } | null>(null);
  const [reelDraft, setReelDraft] = useState<VenueReelDraft>(emptyReelDraft());
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(
    DEFAULT_SITE_SETTINGS,
  );

  useEffect(() => {
    let mounted = true;
    async function hydrateSiteSettings() {
      try {
        const settings = await loadSiteSettingsFromServer();
        if (mounted) setSiteSettings(settings);
      } catch {
        if (mounted) setSiteSettings(loadSiteSettingsLocal());
      }
    }
    hydrateSiteSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const updateSiteSettingsState = (settings: SiteSettings) => {
    setSiteSettings(settings);
    saveSiteSettingsLocal(settings);
  };

  const venueById = useMemo(
    () => new Map(coreVenues.map((venue) => [venue.id, venue])),
    [coreVenues],
  );
  const dataPayload = useMemo(
    () => ({
      venues: coreVenues,
      reservations: coreReservations,
      customers: coreCustomers,
    }),
    [coreVenues, coreReservations, coreCustomers],
  );

  const commitAll = (payload: ConciergeDataPayload) => {
    try {
      if (onReplaceData) {
        onReplaceData(payload);
        return;
      }
      onUpdateVenues?.(payload.venues);
      onUpdateReservations?.(payload.reservations);
      onUpdateCustomers?.(payload.customers);
    } catch (error) {
      console.error("[DuyT Admin] Could not persist admin data", error);
      const message = isStorageQuotaError(error)
        ? "Video hoặc ảnh đang quá nặng để lưu vào localStorage. Hãy dùng link mp4/Instagram hoặc upload qua Supabase Storage/Cloudinary."
        : "Chưa thể lưu dữ liệu. Vui lòng kiểm tra kết nối Supabase/API.";
      setToast({ kind: "error", message });
      window.setTimeout(() => setToast(null), 5200);
    }
  };

  const showToast = (kind: ToastKind, message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 2600);
  };

  const confirmAction = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmDialog({ title, message, confirmLabel: "Xác nhận", onConfirm });
  };

  const filteredReservations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const source = q
      ? coreReservations.filter((booking) =>
          [
            booking.fullName,
            booking.venueName,
            booking.phoneNumber,
            booking.id,
            booking.status,
            booking.notes,
            booking.date,
            booking.arrivalTime,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : coreReservations;

    return sortReservationsByCreatedAtDesc(source);
  }, [coreReservations, searchQuery]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return coreCustomers;
    return coreCustomers.filter((customer) =>
      [
        customer.fullName,
        customer.phoneNumber,
        customer.vipStatus,
        customer.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [coreCustomers, searchQuery]);

  const filteredVenues = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return coreVenues;
    return coreVenues.filter((venue) =>
      [
        venue.name,
        venue.location,
        venue.category,
        venue.shortDescription,
        venue.longDescription,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [coreVenues, searchQuery]);

  const allReels = useMemo(() => getAllVenueReels(coreVenues), [coreVenues]);

  useEffect(() => {
    if (hydratedNotificationsRef.current) return;
    if (!coreReservations.length && !coreVenues.length) return;

    hydratedNotificationsRef.current = true;
    let mounted = true;

    async function hydrateNotifications() {
      const bookingNotices = coreReservations.map((booking) =>
        buildBookingNoticeForSync(booking, coreVenues),
      );

      try {
        const serverNotices = await loadNotificationHistoryFromServer();
        const localNotices = loadNotificationHistory();
        const baseHistory = mergeNotificationHistory(
          serverNotices,
          localNotices,
        );
        const merged = syncNotificationHistoryWithBookings(
          baseHistory,
          coreReservations,
          coreVenues,
        );

        if (!mounted) return;

        setNotifications(merged);
        saveNotificationHistory(merged);

        const serverIds = new Set(serverNotices.map((notice) => notice.id));
        const missingNotices = bookingNotices.filter(
          (notice) => !serverIds.has(notice.id),
        );

        if (missingNotices.length) {
          saveNotificationHistoryToServer(missingNotices).catch((error) => {
            console.warn(
              "[DuyT Admin] Could not seed notification history",
              error,
            );
          });
        }

        const newestUnreadNotice = getNewestUnreadNotification(merged);

        if (newestUnreadNotice && !loginUnreadToastShownRef.current) {
          loginUnreadToastShownRef.current = true;
          setLiveToast(newestUnreadNotice);
          setNotificationOpen(false);
          playAdminBell();

          window.setTimeout(() => {
            setLiveToast((current) =>
              current?.id === newestUnreadNotice.id ? null : current,
            );
          }, 8000);
        }
      } catch (error) {
        console.warn("[DuyT Admin] Notification DB unavailable", error);

        const fallbackMerged = syncNotificationHistoryWithBookings(
          loadNotificationHistory(),
          coreReservations,
          coreVenues,
        );

        if (mounted) {
          setNotifications(fallbackMerged);
          saveNotificationHistory(fallbackMerged);
        }
      } finally {
        knownReservationIdsRef.current = new Set(
          coreReservations.map((booking) => booking.id),
        );
      }
    }

    hydrateNotifications();

    return () => {
      mounted = false;
    };
  }, [coreReservations, coreVenues]);

  useEffect(() => {
    if (!coreReservations.length) return;

    setNotifications((prev) => {
      const prevIds = new Set(prev.map((notice) => notice.id));
      const synced = syncNotificationHistoryWithBookings(
        prev,
        coreReservations,
        coreVenues,
      );

      if (areNotificationsEqual(prev, synced)) return prev;

      const missingNotices = synced.filter(
        (notice) => notice.reservationId && !prevIds.has(notice.id),
      );

      saveNotificationHistory(synced);

      if (missingNotices.length) {
        saveNotificationHistoryToServer(missingNotices).catch((error) => {
          console.warn(
            "[DuyT Admin] Could not backfill missing notifications",
            error,
          );
        });
      }

      return synced;
    });
  }, [coreReservations, coreVenues]);

  useEffect(() => {
    const currentIds = new Set(coreReservations.map((booking) => booking.id));
    if (!knownReservationIdsRef.current) {
      knownReservationIdsRef.current = currentIds;
      return;
    }

    const previousIds = knownReservationIdsRef.current;
    const freshBookings = coreReservations
      .filter((booking) => !previousIds.has(booking.id))
      .sort((a, b) => getBookingCreatedTimeMs(a) - getBookingCreatedTimeMs(b));

    if (freshBookings.length) {
      const notices = freshBookings.map((booking) => ({
        ...buildBookingNotice(booking, coreVenues),
        read: false,
      }));

      setNotifications((prev) => {
        const merged = mergeNotificationHistory(notices, prev);
        saveNotificationHistory(merged);
        return merged;
      });

      saveNotificationHistoryToServer(notices).catch((error) => {
        console.warn("[DuyT Admin] Could not save live notification", error);
      });

      const newest = notices[notices.length - 1];
      setLiveToast(newest);
      setNotificationOpen(false);
      playAdminBell();
      window.setTimeout(
        () =>
          setLiveToast((current) =>
            current?.id === newest.id ? null : current,
          ),
        5000,
      );
    }

    knownReservationIdsRef.current = currentIds;
  }, [coreReservations, coreVenues]);

  const unreadNotificationCount = notifications.filter(
    (notice) => !notice.read,
  ).length;

  useEffect(() => {
    saveNotificationHistory(notifications);
  }, [notifications]);

  const markAllNotificationsRead = () => {
    const unreadIds = notifications
      .filter((notice) => !notice.read)
      .map((notice) => notice.id);

    setNotifications((prev) =>
      prev.map((notice) => ({ ...notice, read: true })),
    );

    if (unreadIds.length) {
      markNotificationsReadOnServer(unreadIds).catch((error) => {
        console.warn("[DuyT Admin] Could not mark notifications read", error);
      });
    }
  };

  const metrics = useMemo(() => {
    const active = coreReservations.filter(
      (item) =>
        item.status !== BookingStatus.CANCELLED &&
        item.status !== BookingStatus.NO_SHOW,
    );
    const revenue = active.reduce(
      (sum, item) => sum + getReservationMinimumSpend(item, coreVenues),
      0,
    );
    const views = coreVenues.reduce(
      (sum, venue) => sum + Math.max(0, Number(venue.viewCount || 0)),
      0,
    );
    const avgRating = coreVenues.length
      ? coreVenues.reduce((sum, venue) => sum + Number(venue.rating || 0), 0) /
        coreVenues.length
      : 0;
    const today = getLocalDateInputValue();
    return {
      total: coreReservations.length,
      today: coreReservations.filter((item) => getBookingCreatedDateKey(item) === today).length,
      pending: coreReservations.filter(
        (item) =>
          item.status === BookingStatus.NEW ||
          item.status === BookingStatus.CONTACTED,
      ).length,
      confirmed: coreReservations.filter(
        (item) => item.status === BookingStatus.CONFIRMED,
      ).length,
      completed: coreReservations.filter(
        (item) => item.status === BookingStatus.COMPLETED,
      ).length,
      cancelled: coreReservations.filter(
        (item) =>
          item.status === BookingStatus.CANCELLED ||
          item.status === BookingStatus.NO_SHOW,
      ).length,
      revenue,
      depositTarget: Math.round(revenue * 0.2),
      guests: coreCustomers.length,
      venues: coreVenues.length,
      views,
      avgRating: Number(avgRating.toFixed(1)),
    };
  }, [coreReservations, coreCustomers, coreVenues]);

  const tabs: {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    {
      id: "bookings",
      label: t("bookings"),
      icon: BookOpen,
      badge: metrics.total,
    },
    { id: "guests", label: t("guestsNav"), icon: Users, badge: metrics.guests },
    { id: "venues", label: t("venues"), icon: MapPin, badge: metrics.venues },
    { id: "reels", label: "Reels", icon: Video, badge: allReels.length },
    { id: "payments", label: t("payments"), icon: CreditCard },
    { id: "reviews", label: t("reviews"), icon: Star },
    { id: "messages", label: t("messages"), icon: MessageCircle },
    { id: "analytics", label: t("analytics"), icon: BarChart3 },
    { id: "files", label: "Tệp dữ liệu", icon: FileText },
    { id: "settings", label: t("settings"), icon: Settings },
  ];

  const openNewBooking = () => {
    setEditingId(null);
    setBookingDraft(emptyBookingDraft(coreVenues[0]?.id || ""));
    setModal("booking");
  };

  const openEditBooking = (booking: ReservationRequest) => {
    setEditingId(booking.id);
    setBookingDraft({
      id: booking.id,
      fullName: booking.fullName,
      phoneNumber: booking.phoneNumber,
      venueId: booking.venueId,
      guestCount: booking.guestCount,
      date: booking.date,
      arrivalTime: booking.arrivalTime,
      preferredTableId: booking.preferredTableId,
      notes: booking.notes,
      status: booking.status,
      source: booking.source,
    });
    setModal("booking");
  };

  const openNewVenue = () => {
    setEditingId(null);
    setVenueDraft(emptyVenueDraft());
    setModal("venue");
  };

  const openEditVenue = (venue: Venue) => {
    setEditingId(venue.id);
    setVenueDraft({
      id: venue.id,
      name: venue.name,
      category: venue.category,
      location: venue.location,
      shortDescription: venue.shortDescription,
      longDescription: venue.longDescription,
      imageUrls: Array.from(
        new Set([venue.image, ...(venue.images || [])].filter(Boolean)),
      ),
      videoUrl: venue.videoUrl || "",
      menuUrl: venue.menuUrl || "",
      menuPdfUrl: venue.menuPdfUrl || "",
      openingOpen: venue.openingHours?.open || "18:00",
      openingClose: venue.openingHours?.close || "02:00",
      openingLabel:
        venue.openingHours?.label ||
        `${venue.openingHours?.open || "18:00"} - ${venue.openingHours?.close || "02:00"}`,
      viewCount: Number(venue.viewCount || 0),
      rating: venue.rating,
      reviewsCount: venue.reviewsCount,
      minimumSpend: venue.preferredTables[0]?.minimumSpend || 3000000,
      capacity: venue.preferredTables[0]?.capacity || 4,
      floorPlanTheme: sanitizeFloorPlanTheme(
        venue.floorPlanTheme,
        venue.category,
      ),
      floorPlanElements: sanitizeFloorPlanElements(
        venue.floorPlanElements,
        venue.category,
      ),
      tableZones: sanitizeZones(venue.tableZones || []),
      preferredTables: sanitizeTables(
        venue.preferredTables || [],
        sanitizeZones(venue.tableZones || []),
      ),
    });
    setModal("venue");
  };

  const openNewCustomer = () => {
    setEditingId(null);
    setCustomerDraft(emptyCustomerDraft());
    setModal("customer");
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingId(customer.id);
    setCustomerDraft({
      id: customer.id,
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      vipStatus: customer.vipStatus,
      notes: customer.notes,
    });
    setModal("customer");
  };

  const updateStatus = (id: string, status: BookingStatus) => {
    commitAll({
      ...dataPayload,
      reservations: coreReservations.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    });
  };

  const saveBooking = (event: React.FormEvent) => {
    event.preventDefault();
    const venue = venueById.get(bookingDraft.venueId) || coreVenues[0];
    const table =
      venue?.preferredTables.find(
        (item) => item.id === bookingDraft.preferredTableId,
      ) || venue?.preferredTables[0];
    if (bookingDraft.fullName.trim().length < 2)
      return showToast("error", "Vui lòng nhập tên khách tối thiểu 2 ký tự.");
    const normalizedPhone = bookingDraft.phoneNumber.replace(/[\s.-]/g, "");
    if (!/^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(normalizedPhone))
      return showToast("error", "Vui lòng nhập đúng số điện thoại Việt Nam.");
    if (
      !isValidArrivalWindow(
        bookingDraft.date,
        bookingDraft.arrivalTime,
        venue?.openingHours?.open || "00:00",
        venue?.openingHours?.close || "23:30",
      )
    )
      return showToast(
        "error",
        `Giờ đến phải nằm trong giờ hoạt động của địa điểm (${venue?.openingHours?.label || `${venue?.openingHours?.open || "00:00"} - ${venue?.openingHours?.close || "23:30"}`}). Nếu đặt hôm nay, giờ đến cần cách hiện tại ít nhất 30 phút.`,
      );
    if (bookingDraft.guestCount < 1 || bookingDraft.guestCount > 30)
      return showToast("error", "Số khách phải từ 1 đến 30.");
    if (table && bookingDraft.guestCount > table.capacity)
      return showToast(
        "error",
        `Bàn đã chọn chỉ phù hợp tối đa ${table.capacity} khách.`,
      );
    if (bookingDraft.notes.length > 500)
      return showToast("error", "Ghi chú tối đa 500 ký tự.");

    const record: ReservationRequest = {
      id: editingId || bookingDraft.id || `res-${Date.now()}`,
      venueId: venue?.id || bookingDraft.venueId,
      venueName: venue?.name || "Venue",
      fullName: bookingDraft.fullName.trim(),
      phoneNumber: bookingDraft.phoneNumber.trim(),
      guestCount: Number(bookingDraft.guestCount) || 1,
      date: bookingDraft.date,
      arrivalTime: bookingDraft.arrivalTime,
      preferredTableId: table?.id || "",
      preferredTableName: table?.name || "VIP Table",
      preferredTableArea: table?.area,
      preferredTableMinimumSpend: table?.minimumSpend,
      preferredTableColor: table?.color,
      preferredTableCapacity: table?.capacity,
      notes: bookingDraft.notes,
      status: bookingDraft.status,
      createdAt:
        coreReservations.find((item) => item.id === editingId)?.createdAt ||
        new Date().toISOString(),
      source: bookingDraft.source,
    };

    const nextReservations = editingId
      ? coreReservations.map((item) => (item.id === editingId ? record : item))
      : [record, ...coreReservations];

    const phoneKey = record.phoneNumber.replace(/\s+/g, "");
    const exists = coreCustomers.some(
      (customer) =>
        customer.phoneNumber.replace(/\s+/g, "") === phoneKey && phoneKey,
    );
    const nextCustomers =
      exists || editingId
        ? coreCustomers
        : [
            {
              id: `cust-${Date.now()}`,
              fullName: record.fullName,
              phoneNumber: record.phoneNumber,
              notes: `Tự tạo từ booking admin cho ${record.venueName}.`,
              vipStatus: VipStatus.VIP,
              favoriteVenueIds: [record.venueId],
              createdAt: new Date().toISOString(),
            },
            ...coreCustomers,
          ];

    commitAll({
      venues: coreVenues,
      reservations: nextReservations,
      customers: nextCustomers,
    });
    setModal(null);
    showToast("success", "Đã lưu booking và đồng bộ dữ liệu.");
  };

  const openNewReel = (venueId = coreVenues[0]?.id || "") => {
    const venue = venueById.get(venueId) || coreVenues[0];
    if (!venue)
      return showToast(
        "error",
        "Vui lòng tạo ít nhất một địa điểm trước khi thêm reel.",
      );
    const nextOrder =
      Math.max(0, ...allReels.map((reel) => Number(reel.order) || 0)) + 1;
    setReelDraft(emptyReelDraft(venue.id, venue.name, venue.image, nextOrder));
    setReelEditor({ reelId: null, venueId: venue.id });
  };

  const openEditReel = (reel: VenueReelDraft) => {
    const venue = venueById.get(reel.venueId);
    setReelDraft(cleanVenueReel(reel, venue, reel.order));
    setReelEditor({ reelId: reel.id, venueId: reel.venueId });
  };

  const deleteReel = (reel: VenueReelDraft) =>
    confirmAction(
      "Xóa reel?",
      "Reel này sẽ bị xóa khỏi khu hiển thị homepage.",
      () => {
        const nextVenues = coreVenues.map((venue) => ({
          ...venue,
          reels: getVenueReels(venue).filter((item) => item.id !== reel.id),
        }));
        commitAll({
          venues: nextVenues,
          reservations: coreReservations,
          customers: coreCustomers,
        });
        showToast("success", "Đã xóa reel.");
      },
    );

  const toggleReelActive = (reel: VenueReelDraft) => {
    const nextVenues = coreVenues.map((venue) => ({
      ...venue,
      reels: getVenueReels(venue).map((item) =>
        item.id === reel.id ? { ...item, isActive: !item.isActive } : item,
      ),
    }));
    commitAll({
      venues: nextVenues,
      reservations: coreReservations,
      customers: coreCustomers,
    });
    showToast(
      "success",
      reel.isActive
        ? "Đã ẩn reel khỏi homepage."
        : "Đã hiển thị reel trên homepage.",
    );
  };

  const moveReel = (reel: VenueReelDraft, direction: -1 | 1) => {
    const ordered = [...allReels];
    const currentIndex = ordered.findIndex((item) => item.id === reel.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length)
      return;

    const current = ordered[currentIndex];
    const target = ordered[targetIndex];
    const nextOrders = new Map<string, number>([
      [current.id, target.order],
      [target.id, current.order],
    ]);

    const nextVenues = coreVenues.map((venue) => ({
      ...venue,
      reels: getVenueReels(venue).map((item) =>
        nextOrders.has(item.id)
          ? { ...item, order: nextOrders.get(item.id) || item.order }
          : item,
      ),
    }));

    commitAll({
      venues: nextVenues,
      reservations: coreReservations,
      customers: coreCustomers,
    });
  };

  const saveReel = (event: React.FormEvent) => {
    event.preventDefault();
    const selectedVenue = venueById.get(reelDraft.venueId);
    const clean = cleanVenueReel(reelDraft, selectedVenue, allReels.length + 1);
    const videoHasInstagram = Boolean(getInstagramEmbedUrl(clean.videoUrl));
    const normalizedInstagram = normalizeInstagramPermalink(
      clean.instagramUrl || (videoHasInstagram ? clean.videoUrl : ""),
    );

    if (!selectedVenue)
      return showToast("error", "Vui lòng chọn địa điểm có sẵn cho reel này.");
    if (!clean.caption)
      return showToast(
        "error",
        "Vui lòng nhập mô tả reel để hiển thị ngoài homepage.",
      );
    if (!clean.posterUrl && !clean.videoUrl)
      return showToast(
        "error",
        "Vui lòng upload video 9:16, dán link Instagram Reel hoặc thêm ảnh poster.",
      );
    if (
      clean.videoUrl &&
      !isDirectVideoUrl(clean.videoUrl) &&
      !getInstagramEmbedUrl(clean.videoUrl) &&
      !/^https?:\/\//i.test(clean.videoUrl)
    )
      return showToast(
        "error",
        "Video phải là file đã upload, link mp4/webm trực tiếp hoặc link Instagram Reel/Post.",
      );

    const finalReel: VenueReelDraft = {
      ...clean,
      instagramUrl: normalizedInstagram,
      posterUrl: clean.posterUrl || selectedVenue.image,
      order:
        clean.order ||
        Math.max(0, ...allReels.map((item) => Number(item.order) || 0)) + 1,
    };

    const editingReelId = reelEditor?.reelId;
    const nextVenues = coreVenues.map((venue) => {
      const withoutEditing = getVenueReels(venue).filter(
        (item) => item.id !== editingReelId && item.id !== finalReel.id,
      );
      if (venue.id !== finalReel.venueId)
        return { ...venue, reels: withoutEditing };
      return {
        ...venue,
        reels: [...withoutEditing, finalReel].sort((a, b) => a.order - b.order),
      };
    });

    commitAll({
      venues: nextVenues,
      reservations: coreReservations,
      customers: coreCustomers,
    });
    setReelEditor(null);
    showToast("success", "Đã lưu reel homepage và đồng bộ dữ liệu.");
  };

  const saveVenue = (event: React.FormEvent) => {
    event.preventDefault();
    if (!venueDraft.name.trim())
      return showToast("error", "Tên địa điểm is required.");
    if (!venueDraft.location.trim())
      return showToast("error", "Venue location is required.");
    if (!venueDraft.shortDescription.trim())
      return showToast("error", "Mô tả ngắn is required.");
    if (Number(venueDraft.rating) < 0 || Number(venueDraft.rating) > 5)
      return showToast("error", "Đánh giá must be between 0 and 5.");
    if (Number(venueDraft.capacity) < 1 || Number(venueDraft.capacity) > 100)
      return showToast("error", "Sức chứa phải từ 1 đến 100 khách.");
    if (Number(venueDraft.minimumSpend) < 0)
      return showToast("error", "Minimum spend cannot be negative.");
    const cleanZones = sanitizeZones(venueDraft.tableZones);
    const cleanTables = sanitizeTables(venueDraft.preferredTables, cleanZones);
    const cleanFloorPlanTheme = sanitizeFloorPlanTheme(
      venueDraft.floorPlanTheme,
      venueDraft.category,
    );
    const cleanFloorPlanElements = sanitizeFloorPlanElements(
      venueDraft.floorPlanElements,
      venueDraft.category,
    );
    if (!cleanTables.length)
      return showToast(
        "error",
        "Please create at least one table/spot for this venue.",
      );
    const id = editingId || venueDraft.id || slugId("venue", venueDraft.name);
    const existing = coreVenues.find((venue) => venue.id === id);
    const imageList = Array.from(
      new Set<string>(
        venueDraft.imageUrls.map((item) => item.trim()).filter(Boolean),
      ),
    );
    const mainImage = safeImageSrc(imageList[0]);
    const reels = existing ? getVenueReels(existing) : [];
    const venue = {
      id,
      name: venueDraft.name.trim(),
      category: venueDraft.category,
      location: venueDraft.location.trim(),
      shortDescription: venueDraft.shortDescription.trim(),
      longDescription:
        venueDraft.longDescription.trim() || venueDraft.shortDescription.trim(),
      image: mainImage,
      images: imageList.slice(1),
      reels,
      menuUrl:
        venueDraft.menuUrl.trim() ||
        existing?.menuUrl ||
        "Menu đang được cập nhật. Vui lòng liên hệ concierge để nhận tư vấn set phù hợp.",
      menuPdfUrl: venueDraft.menuPdfUrl.trim() || existing?.menuPdfUrl,
      openingHours: {
        open: venueDraft.openingOpen || "18:00",
        close: venueDraft.openingClose || "02:00",
        label:
          venueDraft.openingLabel ||
          `${venueDraft.openingOpen || "18:00"} - ${venueDraft.openingClose || "02:00"}`,
      },
      viewCount: Math.max(
        0,
        Number(venueDraft.viewCount || existing?.viewCount || 0),
      ),
      floorPlanUrl: existing?.floorPlanUrl,
      floorPlanTheme: cleanFloorPlanTheme,
      floorPlanElements: cleanFloorPlanElements,
      tableZones: cleanZones,
      preferredTables: cleanTables,
      rating: Number(venueDraft.rating) || 4.8,
      reviewsCount: Number(venueDraft.reviewsCount) || 0,
    } as Venue & { reels?: VenueReelDraft[] };

    const nextVenues = editingId
      ? coreVenues.map((item) => (item.id === editingId ? venue : item))
      : [venue, ...coreVenues];
    const nextReservations = coreReservations.map((booking) =>
      booking.venueId === id ? { ...booking, venueName: venue.name } : booking,
    );
    commitAll({
      venues: nextVenues,
      reservations: nextReservations,
      customers: coreCustomers,
    });
    setModal(null);
    showToast("success", "Đã lưu địa điểm, thư viện ảnh và sơ đồ bàn.");
  };

  const saveCustomer = (event: React.FormEvent) => {
    event.preventDefault();
    const id = editingId || customerDraft.id || `cust-${Date.now()}`;
    const customer: Customer = {
      id,
      fullName: customerDraft.fullName.trim(),
      phoneNumber: customerDraft.phoneNumber.trim(),
      notes: customerDraft.notes,
      vipStatus: customerDraft.vipStatus,
      favoriteVenueIds:
        coreCustomers.find((item) => item.id === id)?.favoriteVenueIds || [],
      createdAt:
        coreCustomers.find((item) => item.id === id)?.createdAt ||
        new Date().toISOString(),
    };
    const nextCustomers = editingId
      ? coreCustomers.map((item) => (item.id === editingId ? customer : item))
      : [customer, ...coreCustomers];
    commitAll({
      venues: coreVenues,
      reservations: coreReservations,
      customers: nextCustomers,
    });
    setModal(null);
    showToast("success", "Đã lưu hồ sơ khách.");
  };

  const deleteBooking = (id: string) =>
    confirmAction(
      "Xóa đặt chỗ?",
      "Thao tác này sẽ xóa vĩnh viễn hồ sơ đặt chỗ.",
      () => {
        commitAll({
          ...dataPayload,
          reservations: coreReservations.filter((item) => item.id !== id),
        });
        showToast("success", "Booking deleted.");
      },
    );

  const deleteVenue = (id: string) =>
    confirmAction(
      "Xóa địa điểm?",
      "Thao tác này sẽ xóa địa điểm và các đặt chỗ liên quan.",
      () => {
        commitAll({
          venues: coreVenues.filter((item) => item.id !== id),
          reservations: coreReservations.filter((item) => item.venueId !== id),
          customers: coreCustomers,
        });
        showToast("success", "Venue deleted.");
      },
    );

  const deleteCustomer = (id: string) =>
    confirmAction(
      "Xóa khách?",
      "Thao tác này sẽ xóa hồ sơ khách khỏi hệ thống quản trị.",
      () => {
        commitAll({
          ...dataPayload,
          customers: coreCustomers.filter((item) => item.id !== id),
        });
        showToast("success", "Guest deleted.");
      },
    );

  const exportJson = () =>
    downloadFile(
      "duyt-concierge-backup.json",
      JSON.stringify(dataPayload, null, 2),
      "application/json;charset=utf-8",
    );
  const exportExcel = async () =>
    downloadFile(
      "duyt-concierge-admin-export.xls",
      buildExcelHtml(dataPayload, await getLogoDataUrl(siteSettings.logoUrl)),
      "application/vnd.ms-excel;charset=utf-8",
    );
  const exportCsv = () =>
    downloadFile(
      "duyt-concierge-admin-data.csv",
      buildCsv(dataPayload),
      "text/csv;charset=utf-8",
    );
  const exportTemplate = async () =>
    downloadFile(
      "duyt-concierge-import-template.xls",
      buildImportTemplateExcelHtml(await getLogoDataUrl(siteSettings.logoUrl)),
      "application/vnd.ms-excel;charset=utf-8",
    );
  const exportCsvTemplate = () =>
    downloadFile(
      "duyt-concierge-import-template.csv",
      buildImportTemplateCsv(),
      "text/csv;charset=utf-8",
    );
  const exportWord = async () =>
    downloadFile(
      "duyt-concierge-report.doc",
      buildWordHtml(dataPayload, await getLogoDataUrl(siteSettings.logoUrl)),
      "application/msword;charset=utf-8",
    );
  const exportPdf = async () => {
    const printWindow = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=1100,height=800",
    );
    if (!printWindow) return window.print();
    printWindow.document.write(
      buildReportHtml(
        dataPayload,
        await getLogoDataUrl(siteSettings.logoUrl),
        "print",
      ),
    );
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 350);
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        const imported = JSON.parse(text) as ConciergeDataPayload;
        if (
          !Array.isArray(imported.venues) ||
          !Array.isArray(imported.customers) ||
          !Array.isArray(imported.reservations)
        )
          throw new Error("Invalid JSON backup.");
        commitAll(imported);
        showToast("success", "Đã nhập bản sao lưu JSON thành công.");
        return;
      }

      let rows = parseCsv(text);
      if (rows[0]?.[0]?.trim().toLowerCase().startsWith("sep="))
        rows = rows.slice(1);
      const [header, ...records] = rows;
      if (!header?.length)
        throw new Error("Missing CSV header. Use the admin import template.");
      const index = (name: string) =>
        header.findIndex(
          (item) => item.trim().toLowerCase() === name.toLowerCase(),
        );
      const nextVenues = [...coreVenues];
      const nextCustomers = [...coreCustomers];
      const nextReservations = [...coreReservations];

      records.forEach((row) => {
        const type = row[index("type")]?.trim().toUpperCase();
        const id = row[index("id")] || `${type?.toLowerCase()}-${Date.now()}`;
        if (type === "VENUE") {
          const venue: Venue = {
            id,
            name: row[index("name")] || "Thêm địa điểm",
            category:
              (row[index("category")] as Venue["category"]) || "Nightclub",
            location: row[index("location")] || "Da Nang",
            shortDescription:
              row[index("description")] || "Địa điểm được nhập từ file.",
            longDescription:
              row[index("description")] || "Địa điểm được nhập từ file.",
            image: row[index("image")] || emptyVenueDraft().imageUrls[0],
            images: [row[index("image")] || emptyVenueDraft().imageUrls[0]],
            floorPlanTheme: defaultFloorPlanTheme(
              (row[index("category")] as Venue["category"]) || "Nightclub",
            ),
            floorPlanElements: defaultFloorPlanElements(
              (row[index("category")] as Venue["category"]) || "Nightclub",
            ),
            tableZones: defaultTableZones(),
            preferredTables: defaultPreferredTables(),
            rating: Number(row[index("rating")]) || 4.8,
            reviewsCount: 0,
          };
          const found = nextVenues.findIndex((item) => item.id === id);
          if (found >= 0) nextVenues[found] = venue;
          else nextVenues.push(venue);
        }
        if (type === "TABLE_ZONE") {
          const venue =
            nextVenues.find((item) => item.id === row[index("venueId")]) ||
            nextVenues.find((item) => item.name === row[index("venueName")]);
          if (!venue) return;
          const zone: VenueTableZone = {
            id,
            name: row[index("name")] || "Table Zone",
            label:
              row[index("description")] || row[index("name")] || "Table Zone",
            description: row[index("notes")] || "",
            minimumSpend:
              Number(row[index("minimumSpend")]) ||
              Number(row[index("rating")]) ||
              0,
            capacity: Number(row[index("capacity")]) || 4,
            color: row[index("color")] || "#0066ff",
            order:
              Number(row[index("order")]) ||
              (venue.tableZones || []).length + 1,
            isActive: !["FALSE", "INACTIVE", "0", "NO"].includes(
              String(row[index("isActive")] || row[index("status")] || "")
                .trim()
                .toUpperCase(),
            ),
          };
          const venueIndex = nextVenues.findIndex(
            (item) => item.id === venue.id,
          );
          const currentZones = (venue.tableZones || []).filter(
            (item) => item.id !== zone.id,
          );
          nextVenues[venueIndex] = {
            ...venue,
            tableZones: [...currentZones, zone].sort(
              (a, b) => a.order - b.order,
            ),
          };
        }
        if (type === "TABLE") {
          const venue =
            nextVenues.find((item) => item.id === row[index("venueId")]) ||
            nextVenues.find((item) => item.name === row[index("venueName")]);
          if (!venue) return;
          const zones = sanitizeZones(venue.tableZones || []);
          const zoneId = row[index("zoneId")] || zones[0]?.id;
          const zone = zones.find((item) => item.id === zoneId) || zones[0];
          const table: PreferredTable = {
            id,
            name: row[index("name")] || "VIP Table",
            area:
              row[index("area")] ||
              row[index("description")] ||
              zone?.name ||
              "VIP Area",
            zoneId,
            minimumSpend:
              Number(row[index("minimumSpend")]) || zone?.minimumSpend || 0,
            capacity:
              Number(row[index("capacity")]) ||
              Number(row[index("guestCount")]) ||
              zone?.capacity ||
              4,
            description: row[index("notes")] || "",
            status:
              (row[index("status")] as PreferredTable["status"]) || "AVAILABLE",
            shape: (row[index("shape")] as PreferredTable["shape"]) || "RECT",
            bookingMode:
              (row[index("bookingMode")] as PreferredTable["bookingMode"]) ||
              "REQUEST",
            x: Number(row[index("x")]) || 20,
            y: Number(row[index("y")]) || 22,
            width: Number(row[index("width")]) || 8,
            height: Number(row[index("height")]) || 5,
            color: row[index("color")] || zone?.color || "#0066ff",
            sortOrder:
              Number(row[index("order")]) ||
              (venue.preferredTables || []).length + 1,
            badge: (row[index("badge")] as PreferredTable["badge"]) || "NONE",
          };
          const venueIndex = nextVenues.findIndex(
            (item) => item.id === venue.id,
          );
          const currentTables = (venue.preferredTables || []).filter(
            (item) => item.id !== table.id,
          );
          nextVenues[venueIndex] = {
            ...venue,
            preferredTables: [...currentTables, table].sort(
              (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
            ),
          };
        }
        if (type === "CUSTOMER") {
          const customer: Customer = {
            id,
            fullName: row[index("name")] || "Imported Guest",
            phoneNumber: row[index("phone")] || "",
            vipStatus: Object.values(VipStatus).includes(
              row[index("status")] as VipStatus,
            )
              ? (row[index("status")] as VipStatus)
              : VipStatus.VIP,
            notes: row[index("notes")] || "",
            favoriteVenueIds: [],
            createdAt: new Date().toISOString(),
          };
          const found = nextCustomers.findIndex((item) => item.id === id);
          if (found >= 0) nextCustomers[found] = customer;
          else nextCustomers.push(customer);
        }
        if (type === "BOOKING") {
          const venue =
            nextVenues.find((item) => item.id === row[index("venueId")]) ||
            nextVenues.find((item) => item.name === row[index("venueName")]) ||
            nextVenues[0];
          const booking: ReservationRequest = {
            id,
            fullName: row[index("name")] || "Đặt chỗ nhập từ file",
            phoneNumber: row[index("phone")] || "",
            venueId: venue?.id || "",
            venueName: venue?.name || row[index("venueName")] || "Venue",
            status: Object.values(BookingStatus).includes(
              row[index("status")] as BookingStatus,
            )
              ? (row[index("status")] as BookingStatus)
              : BookingStatus.NEW,
            date: row[index("date")] || new Date().toISOString().slice(0, 10),
            arrivalTime: row[index("time")] || "21:00",
            guestCount: Number(row[index("guestCount")]) || 1,
            preferredTableId: venue?.preferredTables[0]?.id || "",
            preferredTableName: venue?.preferredTables[0]?.name || "VIP Table",
            notes: row[index("notes")] || "",
            createdAt: new Date().toISOString(),
            source: "Web Form",
          };
          const found = nextReservations.findIndex((item) => item.id === id);
          if (found >= 0) nextReservations[found] = booking;
          else nextReservations.push(booking);
        }
        if (type === "REEL") {
          const venue =
            nextVenues.find((item) => item.id === row[index("venueId")]) ||
            nextVenues.find((item) => item.name === row[index("venueName")]);
          if (!venue) return;
          const reel = cleanVenueReel(
            {
              id,
              venueId: venue.id,
              title: row[index("name")] || `${venue.name} Reel`,
              tag:
                row[index("description")] || venue.name.split(" ")[0] || "DuyT",
              caption: row[index("notes")] || "",
              instagramUrl: row[index("instagramUrl")] || "",
              videoUrl: row[index("videoUrl")] || "",
              posterUrl: row[index("posterUrl")] || venue.image,
              order:
                Number(row[index("order")]) || (venue.reels || []).length + 1,
              placement:
                (row[index("placement")] as HomepageReel["placement"]) ||
                "HOME_FEED",
              isActive: !["FALSE", "INACTIVE", "0", "NO"].includes(
                String(row[index("isActive")] || row[index("status")] || "")
                  .trim()
                  .toUpperCase(),
              ),
            },
            venue,
          );
          const currentReels = getVenueReels(venue).filter(
            (item) => item.id !== reel.id,
          );
          const venueIndex = nextVenues.findIndex(
            (item) => item.id === venue.id,
          );
          nextVenues[venueIndex] = {
            ...venue,
            reels: [...currentReels, reel].sort((a, b) => a.order - b.order),
          };
        }
      });
      commitAll({
        venues: nextVenues,
        customers: nextCustomers,
        reservations: nextReservations,
      });
      showToast("success", "Đã nhập mẫu CSV thành công.");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Không nhập được file này. Vui lòng dùng bản sao lưu JSON hoặc mẫu CSV UTF-8.",
      );
    }
  };

  const resetDemoData = () =>
    confirmAction(
      "Khôi phục dữ liệu chuẩn?",
      "Thay dữ liệu hiện tại bằng bộ dữ liệu chuẩn DuyT Danang-Concierge.",
      () => {
        commitAll({
          venues: INITIAL_VENUES,
          customers: INITIAL_CUSTOMERS,
          reservations: INITIAL_RESERVATIONS,
        });
        showToast("success", "Đã khôi phục dữ liệu chuẩn.");
      },
    );

  const pageAction =
    activeTab === "bookings"
      ? { label: "Tạo đặt chỗ", action: openNewBooking }
      : activeTab === "venues"
        ? { label: "Thêm địa điểm", action: openNewVenue }
        : activeTab === "reels"
          ? { label: "Thêm reel", action: () => openNewReel() }
          : activeTab === "guests"
            ? { label: "Thêm khách", action: openNewCustomer }
            : null;

  return (
    <div className="duyt-admin-app flex min-h-screen bg-surface text-on-surface font-sans selection:bg-primary/20 print:block">
      <aside
        id="sidebar-navigation"
        className="hidden fixed left-0 top-0 z-50 h-screen w-[280px] flex-col justify-between overflow-y-auto border-r border-outline-variant bg-on-secondary-fixed px-3 pb-4 pt-6 text-white shadow-xl print:hidden lg:flex"
      >
        <div className="min-h-0">
          <div className="mb-8 flex select-none flex-col items-center px-3">
            <div className="font-serif text-4xl font-extrabold italic tracking-wider text-white transition-all duration-300 hover:scale-105">
              Duy<span className="text-primary-container">T</span>
            </div>
          </div>

          <nav className="space-y-1.5 overflow-y-auto pr-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    selected
                      ? "scale-[1.02] bg-primary text-on-primary shadow-md shadow-primary/20"
                      : "text-outline-variant hover:bg-on-secondary-fixed-variant hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-transform duration-300 ${selected ? "scale-110" : "group-hover:scale-110"}`}
                    />
                    {tab.label}
                  </span>
                  {!!tab.badge && tab.badge > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold transition-all duration-200 ${selected ? "bg-white/20 text-black" : "bg-surface-container/10 text-outline-variant group-hover:bg-white/20 group-hover:text-black"}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-on-secondary-fixed-variant/30 px-1 pt-4">
          <button
            type="button"
            onClick={onExit}
            id="logout-button"
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-outline-variant transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            {t("logout")}
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden lg:ml-[280px] print:block">
        <header
          id="top-app-bar"
          className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-8 backdrop-blur-md print:static print:bg-white"
        >
          <div className="min-w-0">
            <div className="mt-1 flex items-center gap-3">
              <h1 className="mt-0.5 truncate text-2xl font-extrabold tracking-tight text-on-surface">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h1>
            </div>
            <select
              value={activeTab}
              onChange={(event) => setActiveTab(event.target.value as TabId)}
              className="mt-3 w-full rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-bold text-on-surface outline-none lg:hidden"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 print:hidden">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationOpen((value) => !value);
                }}
                className="relative grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-outline-variant/40 bg-surface-container-lowest text-on-surface transition-colors hover:border-primary hover:bg-surface-container"
                aria-label="Thông báo đặt chỗ"
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 top-14 z-[80] w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_30px_80px_rgba(20,20,20,0.16)]">
                  <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0066ff]">
                        Thông báo
                      </p>
                      <p className="mt-1 text-base font-black text-[#0f172a]">
                        Lịch sử đặt chỗ · {notifications.length}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="rounded-full bg-[#f8f9ff] px-3 py-1.5 text-xs font-bold text-[#475569] hover:text-[#0f172a]"
                    >
                      Đã đọc
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto p-2">
                    {notifications.length ? (
                      notifications.map((notice) => (
                        <button
                          type="button"
                          key={notice.id}
                          onClick={() => {
                            setActiveTab("bookings");
                            setNotificationOpen(false);
                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === notice.id
                                  ? { ...item, read: true }
                                  : item,
                              ),
                            );
                            markNotificationsReadOnServer([notice.id]).catch(
                              (error) => {
                                console.warn(
                                  "[DuyT Admin] Could not mark notification read",
                                  error,
                                );
                              },
                            );
                          }}
                          className="flex w-full gap-3 rounded-[22px] p-3 text-left transition hover:bg-[#f8f9ff]"
                        >
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xs font-black text-white"
                            style={{
                              backgroundColor: notice.tableColor || "#0066ff",
                            }}
                          >
                            <Bell className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-[#0f172a]">
                              {notice.title}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-[#475569]">
                              {notice.message}
                            </span>
                            <span className="mt-1 block text-[10px] font-semibold text-[#94a3b8]">
                              {formatAdminDateTime(notice.createdAt)}
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm text-[#64748b]">
                        Chưa có lịch sử thông báo.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-8 print:overflow-visible print:p-4">
          <div className="mx-auto max-w-[1580px] space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-end gap-3 print:hidden">
              {activeTab === "files" && (
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant/60 bg-white px-5 py-2.5 text-xs font-bold text-on-surface shadow-sm transition-all hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" /> Nhập dữ liệu
                </button>
              )}
              {pageAction && (
                <button
                  type="button"
                  onClick={pageAction.action}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-on-surface px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-on-surface-variant"
                >
                  <Plus className="h-4 w-4" />
                  {pageAction.label}
                </button>
              )}
            </div>

            {activeTab === "dashboard" && (
              <DashboardOverview
                metrics={metrics}
                reservations={coreReservations}
                venues={coreVenues}
                customers={coreCustomers}
                openNewBooking={openNewBooking}
                openVenues={() => setActiveTab("venues")}
                openBookings={() => setActiveTab("bookings")}
              />
            )}
            {activeTab === "bookings" && (
              <BookingsPage
                reservations={filteredReservations}
                venues={coreVenues}
                updateStatus={updateStatus}
                onEdit={openEditBooking}
                onDelete={deleteBooking}
              />
            )}
            {activeTab === "guests" && (
              <GuestsPage
                customers={filteredCustomers}
                reservations={coreReservations}
                venues={coreVenues}
                onEdit={openEditCustomer}
                onDelete={deleteCustomer}
              />
            )}
            {activeTab === "venues" && (
              <VenuesPage
                venues={filteredVenues}
                reservations={coreReservations}
                onEdit={openEditVenue}
                onDelete={deleteVenue}
              />
            )}
            {activeTab === "reels" && (
              <ReelsPage
                reels={allReels}
                venues={coreVenues}
                onAddReel={openNewReel}
                onEditReel={openEditReel}
                onDeleteReel={deleteReel}
                onMoveReel={moveReel}
                onToggleReel={toggleReelActive}
              />
            )}
            {activeTab === "payments" && (
              <PaymentsPage
                reservations={filteredReservations}
                venues={coreVenues}
              />
            )}
            {activeTab === "reviews" && (
              <ReviewsPage
                venues={coreVenues}
                reservations={coreReservations}
                onEditVenue={openEditVenue}
              />
            )}
            {activeTab === "messages" && (
              <MessagesPage
                reservations={filteredReservations}
                onOpenBookings={() => setActiveTab("bookings")}
              />
            )}
            {activeTab === "analytics" && (
              <AnalyticsPage
                metrics={metrics}
                reservations={coreReservations}
                venues={coreVenues}
              />
            )}
            {activeTab === "files" && (
              <FilesPage
                exportJson={exportJson}
                exportExcel={exportExcel}
                exportCsv={exportCsv}
                exportTemplate={exportTemplate}
                exportCsvTemplate={exportCsvTemplate}
                exportWord={exportWord}
                exportPdf={exportPdf}
                importClick={() => importInputRef.current?.click()}
                resetDemoData={resetDemoData}
              />
            )}
            {activeTab === "settings" && (
              <SettingsPage
                settings={siteSettings}
                onSettingsChange={updateSiteSettingsState}
              />
            )}
          </div>
        </main>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept=".json,.csv,.txt"
        className="hidden"
        onChange={importData}
      />

      {modal === "booking" && (
        <BookingModal
          draft={bookingDraft}
          setDraft={setBookingDraft}
          venues={coreVenues}
          editing={Boolean(editingId)}
          onSubmit={saveBooking}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "venue" && (
        <VenueModal
          draft={venueDraft}
          setDraft={setVenueDraft}
          editing={Boolean(editingId)}
          onSubmit={saveVenue}
          onClose={() => setModal(null)}
        />
      )}
      {reelEditor && (
        <ReelModal
          draft={reelDraft}
          setDraft={setReelDraft}
          venues={coreVenues}
          editing={Boolean(reelEditor.reelId)}
          onSubmit={saveReel}
          onClose={() => setReelEditor(null)}
        />
      )}
      {modal === "customer" && (
        <CustomerModal
          draft={customerDraft}
          setDraft={setCustomerDraft}
          editing={Boolean(editingId)}
          onSubmit={saveCustomer}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onHủy={() => setConfirmDialog(null)}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
        />
      )}
      {liveToast && (
        <BookingLiveToast
          notice={liveToast}
          onOpen={() => {
            const noticeId = liveToast.id;

            setActiveTab("bookings");
            setNotificationOpen(false);
            setLiveToast(null);

            setNotifications((prev) => {
              const merged = prev.map((notice) =>
                notice.id === noticeId ? { ...notice, read: true } : notice,
              );

              saveNotificationHistory(merged);
              return merged;
            });

            markNotificationsReadOnServer([noticeId]).catch((error) => {
              console.warn(
                "[DuyT Admin] Could not mark live notification read",
                error,
              );
            });
          }}
          onClose={() => setLiveToast(null)}
        />
      )}
      {toast && <Toast kind={toast.kind} message={toast.message} />}
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.max(0, Number(value) || 0));
}

function statusLabel(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    [BookingStatus.NEW]: "Mới",
    [BookingStatus.CONTACTED]: "Đã liên hệ",
    [BookingStatus.CONFIRMED]: "Đã xác nhận",
    [BookingStatus.COMPLETED]: "Hoàn tất",
    [BookingStatus.CANCELLED]: "Đã hủy",
    [BookingStatus.NO_SHOW]: "Không đến",
  };
  return labels[status] || status;
}

function getWeekdayLabel(date: string) {
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const day = dateKeyToLocalDate(date).getDay();
  return labels[day] || "—";
}

function getMondayOfWeek(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addLocalDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatShortChartDate(date: Date) {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatFullChartDate(date: Date) {
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusTone(status: BookingStatus) {
  if (status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED)
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === BookingStatus.CANCELLED || status === BookingStatus.NO_SHOW)
    return "bg-red-50 text-red-700 border-red-100";
  if (status === BookingStatus.CONTACTED)
    return "bg-blue-50 text-blue-700 border-blue-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  accent = "gold",
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  accent?: "gold" | "dark" | "green" | "blue";
  trend?: string;
}) {
  const accentClass =
    accent === "green"
      ? "from-emerald-50 to-white text-emerald-600"
      : accent === "blue"
        ? "from-blue-50 to-white text-blue-600"
        : accent === "dark"
          ? "from-[#0f172a] to-[#2A2117] text-[#3b82f6]"
          : "from-[#FFF8E8] to-white text-[#0066ff]";

  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-black/10 bg-white p-5 shadow-[0_18px_45px_rgba(18,18,18,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(18,18,18,0.10)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0066ff] via-[#3b82f6] to-transparent" />
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748b]">
            {title}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-[#0f172a]">
            {value}
          </p>
        </div>
        <span className={`rounded-2xl bg-gradient-to-br p-3 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium leading-relaxed text-[#475569]">
          {subtitle}
        </p>
        {trend && (
          <span className="shrink-0 rounded-full bg-[#F5F0E7] px-2.5 py-1 text-[10px] font-black text-[#0052cc]">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function DashboardOverview({
  metrics,
  reservations,
  venues,
  customers,
  openNewBooking,
  openVenues,
  openBookings,
}: {
  metrics: Record<string, number>;
  reservations: ReservationRequest[];
  venues: Venue[];
  customers: Customer[];
  openNewBooking: () => void;
  openVenues: () => void;
  openBookings: () => void;
}) {
  const activeReservations = reservations.filter(
    (booking) =>
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.NO_SHOW,
  );
  const sortedLatest = sortReservationsByCreatedAtDesc(reservations).slice(0, 6);
  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const todayKey = getLocalDateInputValue();
  const weekStart = getMondayOfWeek(dateKeyToLocalDate(todayKey));
  const weekChartData = dayLabels.map((label, index) => {
    const date = addLocalDays(weekStart, index);
    const dateIso = getLocalDateInputValue(date);
    const dayBookings = reservations.filter(
      (booking) => getBookingCreatedDateKey(booking) === dateIso,
    );

    return {
      label,
      date,
      dateIso,
      shortDate: formatShortChartDate(date),
      fullDate: formatFullChartDate(date),
      count: dayBookings.length,
      guests: dayBookings.reduce(
        (sum, booking) => sum + Number(booking.guestCount || 0),
        0,
      ),
      bookingNames: dayBookings
        .slice(0, 3)
        .map(
          (booking) =>
            `${booking.fullName} · lịch đến ${normalizeDateKey(booking.date)} ${booking.arrivalTime}`,
        )
        .join(" · "),
    };
  });
  const maxDay = Math.max(1, ...weekChartData.map((item) => item.count));
  const weekGuestCount = weekChartData.reduce(
    (sum, item) => sum + item.guests,
    0,
  );
  const statusItems = Object.values(BookingStatus)
    .map((status) => ({
      status,
      label: statusLabel(status),
      count: reservations.filter((booking) => booking.status === status).length,
    }))
    .filter((item) => item.count > 0);
  const venuePerformance = venues
    .map((venue) => {
      const venueBookings = reservations.filter(
        (booking) => booking.venueId === venue.id,
      );
      const activeVenueBookings = venueBookings.filter(
        (booking) =>
          booking.status !== BookingStatus.CANCELLED &&
          booking.status !== BookingStatus.NO_SHOW,
      );
      return {
        venue,
        bookings: venueBookings.length,
        revenue: activeVenueBookings.reduce(
          (sum, booking) => sum + getReservationMinimumSpend(booking, venues),
          0,
        ),
        views: Number(venue.viewCount || 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
    .slice(0, 5);
  const totalPerformanceRevenue = Math.max(
    1,
    ...venuePerformance.map((item) => item.revenue),
  );
  const totalGuests = activeReservations.reduce(
    (sum, booking) => sum + Number(booking.guestCount || 0),
    0,
  );
  const conversion = metrics.total
    ? Math.round(
        ((metrics.confirmed + metrics.completed) / metrics.total) * 100,
      )
    : 0;

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Tổng đặt chỗ"
          value={formatNumber(metrics.total)}
          icon={BookOpen}
          subtitle={`${formatNumber(metrics.today)} đặt chỗ trong hôm nay`}
          trend={`${conversion}% xác nhận`}
        />
        <MetricCard
          title="Doanh thu dự kiến"
          value={formatVnd(metrics.revenue)}
          icon={Wallet}
          subtitle="Tính từ minimum spend của đặt chỗ đang hoạt động"
          accent="dark"
        />
        <MetricCard
          title="Cần xử lý"
          value={formatNumber(metrics.pending)}
          icon={Bell}
          subtitle="Đặt chỗ mới hoặc đã liên hệ cần concierge theo dõi"
          accent="blue"
        />
        <MetricCard
          title="Lượt xem địa điểm"
          value={formatNumber(metrics.views)}
          icon={Eye}
          subtitle={`Đánh giá TB ${metrics.avgRating || 0}/5 · ${formatNumber(metrics.venues)} địa điểm`}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0066ff]">
                Biểu đồ tuần
              </p>
              <h3 className="mt-1 text-xl font-black text-[#0f172a]">
                Đặt chỗ mới theo ngày
              </h3>
            </div>
          </div>
          <div className="flex h-80 items-end gap-3 rounded-[28px] bg-[#f8f9ff] p-5">
            {weekChartData.map((item) => {
              const height = Math.max(
                item.count > 0 ? 46 : 22,
                Math.round((item.count / maxDay) * 210),
              );
              const isToday = item.dateIso === todayKey;

              return (
                <div
                  key={item.dateIso}
                  title={`${item.fullDate}: ${item.count} booking mới · ${item.guests} khách${item.bookingNames ? ` · ${item.bookingNames}` : ""}`}
                  className="group flex flex-1 flex-col items-center justify-end gap-3"
                  aria-label={`${item.fullDate}: ${item.count} booking mới, ${item.guests} khách`}
                >
                  <div className="mb-1 rounded-2xl bg-white px-2.5 py-1 text-center text-[10px] font-black text-[#0f172a] shadow-sm ring-1 ring-black/5 transition group-hover:-translate-y-1 group-hover:ring-[#0066ff]/35">
                    {item.count} booking mới
                  </div>

                  <div
                    className={[
                      "relative flex w-full max-w-[92px] items-end justify-center overflow-hidden rounded-t-[24px] shadow-inner transition group-hover:-translate-y-1",
                      isToday
                        ? "bg-gradient-to-t from-[#0066ff] to-[#2f1958] ring-4 ring-[#0066ff]/15"
                        : "bg-gradient-to-t from-[#405daf] to-[#2f1958]",
                    ].join(" ")}
                    style={{ height: `${height}px` }}
                  >
                    <span className="mb-3 rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#0f172a] shadow-sm">
                      {item.count}
                    </span>
                  </div>

                  <div className="text-center leading-tight">
                    <span className="block text-xs font-black text-[#0f172a]">
                      {item.label}
                    </span>
                    <span
                      className={[
                        "mt-1 block text-[11px] font-extrabold",
                        isToday ? "text-[#0066ff]" : "text-[#64748b]",
                      ].join(" ")}
                    >
                      {item.shortDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="mt-1 text-xl font-black text-[#0f172a]">
                Trạng thái đặt chỗ
              </h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#0066ff]" />
          </div>
          <div className="space-y-3">
            {statusItems.map((item) => {
              const width = metrics.total
                ? Math.max(6, Math.round((item.count / metrics.total) * 100))
                : 0;
              return (
                <div key={item.status}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A544D]">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#F1EEE9]">
                    <div
                      className="h-full rounded-full bg-[#0066ff]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!statusItems.length && (
              <p className="rounded-2xl border border-dashed border-black/10 p-5 text-center text-sm text-[#64748b]">
                Chưa có dữ liệu đặt chỗ.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="mt-1 text-xl font-black text-[#0f172a]">
                Địa điểm nổi bật
              </h3>
            </div>
            <button
              type="button"
              onClick={openVenues}
              className="rounded-2xl border border-black/10 px-4 py-2 text-xs font-black text-[#0f172a] transition hover:border-[#0066ff]"
            >
              Quản lý địa điểm
            </button>
          </div>
          <div className="space-y-4">
            {venuePerformance.map((item) => {
              const percent = Math.round(
                (item.revenue / totalPerformanceRevenue) * 100,
              );
              return (
                <div
                  key={item.venue.id}
                  className="rounded-[22px] border border-[#e2e8f0] bg-[#f8fafc] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#000000]">
                        {item.venue.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#64748b]">
                        {item.bookings} đặt chỗ · {formatNumber(item.views)}{" "}
                        lượt xem · ★ {item.venue.rating}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-[#000000]">
                      {formatVnd(item.revenue)}
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-[#3b82f6]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!venuePerformance.length && (
              <p className="rounded-2xl border border-dashed border-black/10 p-5 text-center text-sm text-[#64748b]">
                Chưa có địa điểm để phân tích.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="mt-1 text-xl font-black text-[#0f172a]">
                Đặt chỗ mới nhất
              </h3>
            </div>
            <CalendarDays className="h-5 w-5 text-[#0066ff]" />
          </div>
          <div className="space-y-3">
            {sortedLatest.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={openBookings}
                className="w-full rounded-[22px] border border-[#e2e8f0] bg-white p-4 text-left transition hover:border-[#0066ff] hover:bg-[#eff6ff]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0066ff]">
                      Tạo lúc {formatAdminDateTime(new Date(getBookingCreatedTimeMs(booking)))}
                    </p>
                    <p className="mt-1 text-sm font-black text-[#0f172a]">
                      {booking.fullName}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#64748b]">
                      Lịch đến: {getWeekdayLabel(booking.date)} · {normalizeDateKey(booking.date)} · {booking.arrivalTime}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#64748b]">
                      {booking.venueName} · {booking.guestCount} khách ·{" "}
                      {booking.preferredTableName || "Concierge chọn"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${getStatusTone(booking.status)}`}
                  >
                    {statusLabel(booking.status)}
                  </span>
                </div>
              </button>
            ))}
            {!sortedLatest.length && (
              <p className="rounded-2xl border border-dashed border-black/10 p-5 text-center text-sm text-[#64748b]">
                Chưa có đặt chỗ mới.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${danger ? "border-red-100 text-red-500 hover:bg-red-50" : "border-black/10 text-[#475569] hover:border-[#0066ff] hover:text-[#0f172a]"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPageState] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = items.length ? (currentPage - 1) * pageSize : 0;
  const endIndex = Math.min(items.length, startIndex + pageSize);
  const paginatedItems = items.slice(startIndex, endIndex);

  const setPage = (nextPage: number) => {
    setPageState(Math.min(Math.max(nextPage, 1), totalPages));
  };

  return {
    paginatedItems,
    page: currentPage,
    totalPages,
    startIndex,
    endIndex,
    total: items.length,
    pageSize,
    setPage,
  };
}

function PaginationControls({
  total,
  page,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
}: {
  total: number;
  page: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}) {
  if (total <= 0) return null;

  const visiblePages = Array.from(
    new Set(
      [1, page - 1, page, page + 1, totalPages].filter(
        (item) => item >= 1 && item <= totalPages,
      ),
    ),
  ).sort((a, b) => a - b);

  let lastPage = 0;

  return (
    <div className="flex flex-col gap-3 border-t border-[#e2e8f0] bg-white px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-bold text-[#64748b]">
        Hiển thị {startIndex + 1}-{endIndex} / {total} mục
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-black/10 px-3 py-2 text-xs font-black text-[#0f172a] transition hover:border-[#0066ff] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Trước
        </button>
        {visiblePages.map((pageNumber) => {
          const showGap = lastPage > 0 && pageNumber - lastPage > 1;
          lastPage = pageNumber;

          return (
            <React.Fragment key={pageNumber}>
              {showGap && (
                <span className="px-1 text-xs font-bold text-[#94a3b8]">
                  ...
                </span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={[
                  "h-9 min-w-9 rounded-xl px-3 text-xs font-black transition",
                  pageNumber === page
                    ? "bg-[#0066ff] text-white shadow-sm"
                    : "border border-black/10 bg-white text-[#0f172a] hover:border-[#0066ff]",
                ].join(" ")}
              >
                {pageNumber}
              </button>
            </React.Fragment>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-xl border border-black/10 px-3 py-2 text-xs font-black text-[#0f172a] transition hover:border-[#0066ff] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function getCustomerBookingHistory(
  customer: Customer,
  reservations: ReservationRequest[],
) {
  const phone = normalizedPhone(customer.phoneNumber);
  const name = safeText(customer.fullName).toLowerCase();

  return sortReservationsByCreatedAtDesc(
    reservations.filter((booking) => {
      const bookingPhone = normalizedPhone(booking.phoneNumber);
      const bookingName = safeText(booking.fullName).toLowerCase();

      return (phone && bookingPhone === phone) || (name && bookingName === name);
    }),
  );
}

function BookingsPage({
  reservations,
  venues,
  updateStatus,
  onEdit,
  onDelete,
}: {
  reservations: ReservationRequest[];
  venues: Venue[];
  updateStatus: (id: string, status: BookingStatus) => void;
  onEdit: (booking: ReservationRequest) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const pagination = usePagination(reservations, 10);
  const visibleReservations = pagination.paginatedItems;

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full text-left text-sm">
          <thead className="bg-[#f8f9ff] text-xs uppercase tracking-wider text-[#64748b]">
            <tr>
              <th className="p-4">Bàn / khu</th>
              <th className="p-4">{t("guest")}</th>
              <th className="p-4">{t("venue")}</th>
              <th className="p-4">{t("date")}</th>
              <th className="p-4 text-center">{t("party")}</th>
              <th className="p-4 text-right">Minimum</th>
              <th className="p-4">{t("status")}</th>
              <th className="p-4 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {visibleReservations.map((booking) => {
              const config =
                statusConfig[booking.status] || statusConfig[BookingStatus.NEW];
              const table = findReservationTable(booking, venues);
              const color = getReservationTableColor(booking, venues);
              const zoneLabel = getReservationZoneLabel(booking, venues);
              const minimum = getReservationMinimumSpend(booking, venues);
              return (
                <tr key={booking.id} className="hover:bg-[#f8fafc]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-11 min-w-11 place-items-center rounded-2xl px-2 text-xs font-black text-white shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${color}, rgba(0,0,0,.72))`,
                        }}
                      >
                        {booking.preferredTableName || table?.name || "—"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-[#0f172a]">
                          {booking.preferredTableName ||
                            table?.name ||
                            "Concierge chọn"}
                        </p>
                        <p className="truncate text-xs font-semibold text-[#64748b]">
                          {zoneLabel}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold">{booking.fullName}</p>
                    <p className="text-xs text-[#64748b]">
                      {booking.phoneNumber || "—"}
                    </p>
                  </td>
                  <td className="p-4 font-semibold">{booking.venueName}</td>
                  <td className="p-4">
                    <p>{booking.date}</p>
                    <p className="text-xs text-[#64748b]">
                      {booking.arrivalTime}
                    </p>
                  </td>
                  <td className="p-4 text-center font-bold">
                    {booking.guestCount}
                  </td>
                  <td className="p-4 text-right font-black text-[#0066ff]">
                    {formatVnd(minimum)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${config.className}`}
                    >
                      {t(config.labelKey)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <select
                        value={booking.status}
                        onChange={(event) =>
                          updateStatus(
                            booking.id,
                            event.target.value as BookingStatus,
                          )
                        }
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none"
                      >
                        {Object.values(BookingStatus).map((status) => (
                          <option key={status} value={status}>
                            {t(statusConfig[status].labelKey)}
                          </option>
                        ))}
                      </select>
                      <IconButton
                        label="Sửa"
                        icon={Edit3}
                        onClick={() => onEdit(booking)}
                      />
                      <IconButton
                        label="Xóa"
                        icon={Trash2}
                        onClick={() => onDelete(booking.id)}
                        danger
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!reservations.length && (
              <tr>
                <td colSpan={9} className="p-10 text-center text-[#64748b]">
                  Chưa có đặt chỗ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useI18n();
  const config = statusConfig[status] || statusConfig[BookingStatus.NEW];
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${config.className}`}
    >
      {t(config.labelKey)}
    </span>
  );
}

function GuestsPage({
  customers,
  reservations,
  venues,
  onEdit,
  onDelete,
}: {
  customers: Customer[];
  reservations: ReservationRequest[];
  venues: Venue[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}) {
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const rows = useMemo(
    () =>
      customers
        .map((customer) => {
          const bookings = getCustomerBookingHistory(customer, reservations);
          const activeBookings = bookings.filter(
            (booking) =>
              booking.status !== BookingStatus.CANCELLED &&
              booking.status !== BookingStatus.NO_SHOW,
          );
          const spend = activeBookings.reduce(
            (sum, booking) => sum + getReservationMinimumSpend(booking, venues),
            0,
          );
          const latestBooking = bookings[0];
          const latestTime = latestBooking
            ? getBookingCreatedTimeMs(latestBooking)
            : safeDateTimeMs(customer.createdAt) || timestampFromId(customer.id);

          return {
            customer,
            bookings,
            activeBookings,
            spend,
            latestBooking,
            latestTime,
          };
        })
        .sort((a, b) => b.latestTime - a.latestTime),
    [customers, reservations, venues],
  );
  const pagination = usePagination(rows, 10);
  const visibleRows = pagination.paginatedItems;

  return (
    <>
      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left text-sm">
            <thead className="bg-[#f8f9ff] text-xs uppercase tracking-wider text-[#64748b]">
              <tr>
                <th className="p-4">Khách</th>
                <th className="p-4">Số điện thoại</th>
                <th className="p-4 text-center">Hạng</th>
                <th className="p-4 text-center">Đặt chỗ</th>
                <th className="p-4 text-center">Hoạt động</th>
                <th className="p-4 text-right">Chi tiêu</th>
                <th className="p-4">Đặt chỗ gần nhất</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {visibleRows.map(({ customer, bookings, activeBookings, spend, latestBooking }) => (
                <tr key={customer.id} className="hover:bg-[#f8fafc]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0f172a] text-white shadow-sm">
                        <Users className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black text-[#0f172a]">
                          {customer.fullName || "Chưa có tên"}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-[#64748b]">
                          {customer.notes || "Hồ sơ khách được đồng bộ từ hệ thống."}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-[#0f172a]">
                    {customer.phoneNumber || "—"}
                  </td>
                  <td className="p-4 text-center">
                    <span className="rounded-full bg-[#0066ff] px-3 py-1 text-[10px] font-black text-white">
                      {customer.vipStatus || VipStatus.VIP}
                    </span>
                  </td>
                  <td className="p-4 text-center font-black text-[#0f172a]">
                    {bookings.length}
                  </td>
                  <td className="p-4 text-center font-black text-[#0f172a]">
                    {activeBookings.length}
                  </td>
                  <td className="p-4 text-right font-black text-[#0066ff]">
                    {formatVnd(spend)}
                  </td>
                  <td className="p-4">
                    {latestBooking ? (
                      <div>
                        <p className="font-black text-[#0f172a]">
                          {latestBooking.venueName}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#64748b]">
                          {latestBooking.date} · {latestBooking.arrivalTime} · {latestBooking.guestCount} khách
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-[#94a3b8]">
                          {latestBooking.preferredTableName || "Concierge chọn"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-[#94a3b8]">
                        Chưa có lịch sử đặt chỗ
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setHistoryCustomer(customer)}
                        className="rounded-xl border border-black/10 px-3 py-2 text-xs font-black text-[#0f172a] transition hover:border-[#0066ff] hover:bg-[#eff6ff]"
                      >
                        Xem lịch sử
                      </button>
                      <IconButton
                        label="Sửa khách"
                        icon={Edit3}
                        onClick={() => onEdit(customer)}
                      />
                      <IconButton
                        label="Xóa khách"
                        icon={Trash2}
                        onClick={() => onDelete(customer.id)}
                        danger
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!customers.length && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#64748b]">
                    Chưa có hồ sơ khách.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          total={pagination.total}
          page={pagination.page}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={pagination.setPage}
        />
      </div>

      {historyCustomer && (
        <CustomerHistoryModal
          customer={historyCustomer}
          reservations={reservations}
          venues={venues}
          onClose={() => setHistoryCustomer(null)}
        />
      )}
    </>
  );
}

function CustomerHistoryModal({
  customer,
  reservations,
  venues,
  onClose,
}: {
  customer: Customer;
  reservations: ReservationRequest[];
  venues: Venue[];
  onClose: () => void;
}) {
  const history = useMemo(
    () => getCustomerBookingHistory(customer, reservations),
    [customer, reservations],
  );
  const pagination = usePagination(history, 8);
  const activeCount = history.filter(
    (booking) =>
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.NO_SHOW,
  ).length;
  const totalSpend = history.reduce(
    (sum, booking) => sum + getReservationMinimumSpend(booking, venues),
    0,
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-3 backdrop-blur-xl print:hidden">
      <div className="flex max-h-[calc(100vh-28px)] w-[min(1180px,calc(100vw-24px))] flex-col overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_30px_100px_rgba(20,20,20,0.22)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/10 bg-[#0f172a] px-6 py-5 text-white">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-[22px] bg-white/10 text-[#60a5fa]">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#93c5fd]">
                Lịch sử đặt chỗ
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                {customer.fullName || "Khách"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-white/60">
                {customer.phoneNumber || "Chưa có số điện thoại"} · {customer.vipStatus || VipStatus.VIP}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 grid grid-cols-1 gap-3 border-b border-black/10 bg-[#f8f9ff] p-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
              Tổng đặt chỗ
            </p>
            <p className="mt-2 text-2xl font-black text-[#0f172a]">
              {history.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
              Đang hoạt động
            </p>
            <p className="mt-2 text-2xl font-black text-[#0f172a]">
              {activeCount}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
              Tổng chi tiêu dự kiến
            </p>
            <p className="mt-2 text-2xl font-black text-[#0066ff]">
              {formatVnd(totalSpend)}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wider text-[#64748b] shadow-sm">
              <tr>
                <th className="p-4">Bàn / khu</th>
                <th className="p-4">Địa điểm</th>
                <th className="p-4">Ngày đến</th>
                <th className="p-4 text-center">Số khách</th>
                <th className="p-4 text-right">Minimum</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {pagination.paginatedItems.map((booking) => {
                const table = findReservationTable(booking, venues);
                const color = getReservationTableColor(booking, venues);
                const zoneLabel = getReservationZoneLabel(booking, venues);
                const minimum = getReservationMinimumSpend(booking, venues);

                return (
                  <tr key={booking.id} className="hover:bg-[#f8fafc]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-11 min-w-11 place-items-center rounded-2xl px-2 text-xs font-black text-white shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${color}, rgba(0,0,0,.72))`,
                          }}
                        >
                          {booking.preferredTableName || table?.name || "—"}
                        </span>
                        <div>
                          <p className="font-black text-[#0f172a]">
                            {booking.preferredTableName || table?.name || "Concierge chọn"}
                          </p>
                          <p className="text-xs font-semibold text-[#64748b]">
                            {zoneLabel}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-[#0f172a]">
                      {booking.venueName}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#0f172a]">{booking.date}</p>
                      <p className="text-xs font-semibold text-[#64748b]">
                        {booking.arrivalTime}
                      </p>
                    </td>
                    <td className="p-4 text-center font-black">
                      {booking.guestCount}
                    </td>
                    <td className="p-4 text-right font-black text-[#0066ff]">
                      {formatVnd(minimum)}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="p-4 text-xs leading-relaxed text-[#64748b]">
                      {booking.notes || "—"}
                    </td>
                  </tr>
                );
              })}
              {!history.length && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#64748b]">
                    Khách này chưa có lịch sử đặt chỗ.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          total={pagination.total}
          page={pagination.page}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={pagination.setPage}
        />
      </div>
    </div>
  );
}

function VenuesPage({
  venues,
  reservations,
  onEdit,
  onDelete,
  compact = false,
}: {
  venues: Venue[];
  reservations: ReservationRequest[];
  onEdit?: (venue: Venue) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
  const pagination = usePagination(venues, compact ? 6 : 6);

  return (
    <div
      className={
        compact
          ? "rounded-[32px] border border-black/10 bg-white p-6 shadow-sm"
          : "space-y-6"
      }
    >
      {compact && (
        <h2 className="mb-5 text-lg font-black text-[#0f172a]">
          Địa điểm đang hoạt động
        </h2>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {pagination.paginatedItems.map((venue) => {
          const count = reservations.filter(
            (booking) => booking.venueId === venue.id,
          ).length;
          const active = reservations.filter(
            (booking) =>
              booking.venueId === venue.id &&
              booking.status !== BookingStatus.CANCELLED &&
              booking.status !== BookingStatus.NO_SHOW,
          );
          const revenue = active.reduce(
            (sum, booking) => sum + getReservationMinimumSpend(booking, venues),
            0,
          );
          const zones = sanitizeZones(venue.tableZones || []);
          return (
            <article
              key={venue.id}
              className="overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-48 overflow-hidden bg-[#0f172a]">
                <img
                  src={safeImageSrc(venue.image)}
                  alt={venue.name}
                  className="h-full w-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#3b82f6] backdrop-blur">
                  {venue.category}
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="truncate text-xl font-black text-white">
                    {venue.name}
                  </h3>
                  <p className="mt-1 truncate text-xs font-semibold text-white/70">
                    {venue.location}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="line-clamp-2 min-h-[40px] text-sm leading-relaxed text-[#5A544D]">
                  {venue.shortDescription}
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-2xl bg-[#f8f9ff] p-2">
                    <p className="text-sm font-black">{count}</p>
                    <p className="text-[10px] font-bold text-[#64748b]">
                      Đặt chỗ
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8f9ff] p-2">
                    <p className="text-sm font-black">
                      {formatNumber(Number(venue.viewCount || 0))}
                    </p>
                    <p className="text-[10px] font-bold text-[#64748b]">
                      Lượt xem
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8f9ff] p-2">
                    <p className="text-sm font-black">★ {venue.rating}</p>
                    <p className="text-[10px] font-bold text-[#64748b]">
                      Đánh giá
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f8f9ff] p-2">
                    <p className="text-sm font-black">
                      {venue.preferredTables?.length || 0}
                    </p>
                    <p className="text-[10px] font-bold text-[#64748b]">Bàn</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {zones.slice(0, 4).map((zone) => (
                    <span
                      key={zone.id}
                      className="rounded-full border px-3 py-1 text-[10px] font-black"
                      style={{
                        borderColor: `${zone.color}55`,
                        color: zone.color,
                      }}
                    >
                      {zone.name}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">
                      Doanh thu dự kiến
                    </p>
                    <p className="mt-1 text-sm font-black text-[#000000]">
                      {formatVnd(revenue)}
                    </p>
                  </div>
                  {onEdit && onDelete && (
                    <div className="flex gap-2 print:hidden">
                      <IconButton
                        label="Sửa địa điểm"
                        icon={Edit3}
                        onClick={() => onEdit(venue)}
                      />
                      <IconButton
                        label="Xóa địa điểm"
                        icon={Trash2}
                        onClick={() => onDelete(venue.id)}
                        danger
                      />
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!venues.length && (
        <div className="rounded-[32px] border border-black/10 bg-white p-12 text-center text-[#64748b]">
          Chưa có địa điểm.
        </div>
      )}
      {!compact && (
        <PaginationControls
          total={pagination.total}
          page={pagination.page}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={pagination.setPage}
        />
      )}
    </div>
  );
}

function ReelsPage({
  reels,
  venues,
  onAddReel,
  onEditReel,
  onDeleteReel,
  onMoveReel,
  onToggleReel,
}: {
  reels: ReturnType<typeof getAllVenueReels>;
  venues: Venue[];
  onAddReel: (venueId?: string) => void;
  onEditReel: (reel: VenueReelDraft) => void;
  onDeleteReel: (reel: VenueReelDraft) => void;
  onMoveReel: (reel: VenueReelDraft, direction: -1 | 1) => void;
  onToggleReel: (reel: VenueReelDraft) => void;
}) {
  const pagination = usePagination(reels, 8);

  return (
    <div className="space-y-6">
      {!venues.length && (
        <div className="rounded-[28px] border border-dashed border-[#0066ff]/40 bg-white p-10 text-center text-sm font-semibold text-[#64748b]">
          Cần có ít nhất một địa điểm trước khi thêm reel trang chủ.
        </div>
      )}

      {venues.length > 0 && reels.length === 0 && (
        <button
          type="button"
          onClick={() => onAddReel()}
          className="w-full rounded-[28px] border border-dashed border-[#0066ff]/45 bg-white p-12 text-center shadow-sm transition hover:border-[#0066ff] hover:bg-[#0066ff]/5"
        >
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f172a] text-white">
            <Plus className="h-6 w-6" />
          </span>
          <span className="block text-lg font-bold text-[#0f172a]">
            Thêm reel đầu tiên
          </span>
          <span className="mt-2 block text-sm text-[#64748b]">
            Reel sẽ hiển thị dạng thẻ 9:16 trên trang chủ.
          </span>
        </button>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {pagination.paginatedItems.map((reel, index) => {
          const absoluteIndex = pagination.startIndex + index;
          const instagramLink = normalizeInstagramPermalink(
            reel.instagramUrl ||
              (getInstagramEmbedUrl(reel.videoUrl) ? reel.videoUrl : ""),
          );
          const hasVideo = Boolean(
            reel.videoUrl && isDirectVideoUrl(reel.videoUrl),
          );
          const disabledUp = absoluteIndex === 0;
          const disabledDown = absoluteIndex === reels.length - 1;

          return (
            <article
              key={reel.id}
              className={`overflow-hidden rounded-[28px] border bg-white shadow-sm transition ${reel.isActive ? "border-black/10" : "border-dashed border-[#C7C7CC] opacity-75"}`}
            >
              <div className="grid grid-cols-[130px_1fr] gap-4 p-4">
                <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-black">
                  {hasVideo ? (
                    <video
                      src={reel.videoUrl}
                      poster={reel.posterUrl || undefined}
                      muted
                      playsInline
                      loop
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : reel.posterUrl ? (
                    <img
                      src={safeImageSrc(reel.posterUrl)}
                      alt={reel.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/45">
                      9:16
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                    #{absoluteIndex + 1}
                  </span>
                  {!reel.isActive && (
                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-center text-[9px] font-bold uppercase tracking-widest text-white">
                      Đã ẩn
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold uppercase tracking-wider text-[#0066ff]">
                        {reel.tag || "DuyT"}
                      </p>
                      <h3 className="mt-1 truncate text-base font-bold text-[#0f172a]">
                        {reel.title || "Chưa đặt tên reel"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleReel(reel)}
                      className={`rounded-xl p-2 transition ${reel.isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-[#f8f9ff] text-[#64748b] hover:text-[#0f172a]"}`}
                      aria-label={reel.isActive ? "Ẩn reel" : "Hiện reel"}
                    >
                      {reel.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#475569]">
                    {reel.caption || "Chưa có mô tả."}
                  </p>
                  <div className="mt-3 space-y-1 text-[11px] font-semibold text-[#64748b]">
                    <p className="truncate">
                      Địa điểm:{" "}
                      <span className="text-[#0f172a]">{reel.venueName}</span>
                    </p>
                    <p>
                      Vị trí:{" "}
                      <span className="text-[#0f172a]">
                        {reel.placement === "HOME_HOST"
                          ? "Khu concierge"
                          : "Trang chủ"}
                      </span>
                    </p>
                    <p>
                      Instagram:{" "}
                      <span
                        className={
                          instagramLink ? "text-emerald-700" : "text-red-500"
                        }
                      >
                        {instagramLink
                          ? "Đã có link reel/post"
                          : "Thiếu link reel/post"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onMoveReel(reel, -1)}
                      disabled={disabledUp}
                      className="rounded-xl border border-black/10 p-2 text-[#475569] transition hover:border-[#0066ff] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Đưa reel lên"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveReel(reel, 1)}
                      disabled={disabledDown}
                      className="rounded-xl border border-black/10 p-2 text-[#475569] transition hover:border-[#0066ff] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Đưa reel xuống"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditReel(reel)}
                      className="rounded-xl border border-black/10 px-3 py-2 text-xs font-bold text-[#0f172a] transition hover:border-[#0066ff]"
                    >
                      <Edit3 className="mr-1 inline h-3.5 w-3.5" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteReel(reel)}
                      className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <PaginationControls
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

function PaymentsPage({
  reservations,
  venues,
}: {
  reservations: ReservationRequest[];
  venues: Venue[];
}) {
  const active = reservations.filter(
    (booking) =>
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.NO_SHOW,
  );
  const total = active.reduce(
    (sum, booking) => sum + getReservationMinimumSpend(booking, venues),
    0,
  );
  const deposit = Math.round(total * 0.2);
  const paid = active.filter(
    (booking) =>
      booking.status === BookingStatus.CONFIRMED ||
      booking.status === BookingStatus.COMPLETED,
  ).length;
  const paidRatio = active.length
    ? Math.round((paid / active.length) * 100)
    : 0;
  const pagination = usePagination(reservations, 10);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <MetricCard
          title="Doanh thu dự kiến"
          value={formatVnd(total)}
          icon={Wallet}
          subtitle="Tính từ minimum spend của booking hoạt động"
          accent="dark"
        />
        <MetricCard
          title="Đặt cọc đề xuất"
          value={formatVnd(deposit)}
          icon={CreditCard}
          subtitle="Gợi ý 20% tổng minimum spend để theo dõi"
        />
        <MetricCard
          title="Tỷ lệ đã xác nhận"
          value={`${paidRatio}%`}
          icon={CheckCircle2}
          subtitle={`${paid}/${active.length || 0} booking đã xác nhận hoặc hoàn tất`}
          accent="green"
        />
      </section>

      <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="bg-[#f8f9ff] text-[11px] uppercase tracking-wider text-[#64748b]">
              <tr>
                <th className="p-4">Mã đặt chỗ</th>
                <th className="p-4">Khách</th>
                <th className="p-4">Địa điểm</th>
                <th className="p-4">Ngày giờ</th>
                <th className="p-4 text-right">Minimum</th>
                <th className="p-4 text-right">Cọc gợi ý</th>
                <th className="p-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {pagination.paginatedItems.map((booking) => {
                const minimum = getReservationMinimumSpend(booking, venues);
                return (
                  <tr key={booking.id} className="hover:bg-[#f8fafc]">
                    <td className="p-4 font-mono text-xs font-black">
                      {booking.id}
                    </td>
                    <td className="p-4">
                      <p className="font-black">{booking.fullName}</p>
                      <p className="text-xs text-[#64748b]">
                        {booking.phoneNumber || "—"}
                      </p>
                    </td>
                    <td className="p-4 font-bold">{booking.venueName}</td>
                    <td className="p-4">
                      <p>{booking.date}</p>
                      <p className="text-xs text-[#64748b]">
                        {booking.arrivalTime}
                      </p>
                    </td>
                    <td className="p-4 text-right font-black text-[#000000]">
                      {formatVnd(minimum)}
                    </td>
                    <td className="p-4 text-right font-black">
                      {formatVnd(Math.round(minimum * 0.2))}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                );
              })}
              {!reservations.length && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#64748b]">
                    Chưa có dữ liệu thanh toán.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          total={pagination.total}
          page={pagination.page}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={pagination.setPage}
        />
      </section>
    </div>
  );
}

function ReviewsPage({
  venues,
  reservations,
  onEditVenue,
}: {
  venues: Venue[];
  reservations: ReservationRequest[];
  onEditVenue: (venue: Venue) => void;
}) {
  const totalReviews = venues.reduce(
    (sum, venue) => sum + Number(venue.reviewsCount || 0),
    0,
  );
  const avgRating = venues.length
    ? venues.reduce((sum, venue) => sum + Number(venue.rating || 0), 0) /
      venues.length
    : 0;
  const pagination = usePagination(venues, 6);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <MetricCard
          title="Điểm trung bình"
          value={`${avgRating.toFixed(1)}/5`}
          icon={Star}
          subtitle="Tính từ rating các địa điểm đang hoạt động"
        />
        <MetricCard
          title="Tổng đánh giá"
          value={formatNumber(totalReviews)}
          icon={MessageCircle}
          subtitle="Có thể chỉnh trực tiếp trong phần sửa địa điểm"
        />
        <MetricCard
          title="Lượt xem"
          value={formatNumber(
            venues.reduce(
              (sum, venue) => sum + Number(venue.viewCount || 0),
              0,
            ),
          )}
          icon={Eye}
          subtitle="Mỗi lần khách mở lại trang địa điểm sẽ +1"
          accent="green"
        />
      </section>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {pagination.paginatedItems.map((venue) => {
          const bookingCount = reservations.filter(
            (booking) => booking.venueId === venue.id,
          ).length;
          return (
            <article
              key={venue.id}
              className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <img
                    src={safeImageSrc(venue.image)}
                    alt={venue.name}
                    className="h-20 w-20 rounded-3xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0066ff]">
                      {venue.category}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#0f172a]">
                      {venue.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-[#64748b]">
                      {bookingCount} đặt chỗ ·{" "}
                      {formatNumber(Number(venue.viewCount || 0))} lượt xem
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEditVenue(venue)}
                  className="rounded-2xl border border-black/10 px-4 py-2 text-xs font-black transition hover:border-[#0066ff]"
                >
                  Chỉnh
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-[#f8f9ff] p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-[#64748b]">
                    Đánh giá
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#0f172a]">
                    ★ {venue.rating}
                  </p>
                </div>
                <div className="rounded-3xl bg-[#f8f9ff] p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-[#64748b]">
                    Đánh giá
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#0f172a]">
                    {formatNumber(Number(venue.reviewsCount || 0))}
                  </p>
                </div>
              </div>
              <p className="mt-4 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm leading-relaxed text-[#5A544D]">
                “Xác nhận nhanh, giao tiếp rõ ràng và trải nghiệm đón tiếp chỉn
                chu.”
              </p>
            </article>
          );
        })}
      </div>
      <PaginationControls
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

function MessagesPage({
  reservations,
  onOpenBookings,
}: {
  reservations: ReservationRequest[];
  onOpenBookings: () => void;
}) {
  const templates = reservations.map((booking) => ({
    id: booking.id,
    guest: booking.fullName,
    channel: booking.source,
    message: `Vui lòng xác nhận ${booking.venueName} cho ${booking.guestCount} khách lúc ${booking.arrivalTime} ngày ${booking.date}.`,
    status: booking.status,
  }));
  const pagination = usePagination(templates, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {pagination.paginatedItems.map((item) => (
          <article
            key={item.id}
            className="rounded-[30px] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-[#0f172a]">
                  {item.guest}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#0066ff]">
                  {item.channel}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="rounded-2xl bg-[#f8f9ff] p-4 text-sm leading-relaxed text-[#5A544D]">
              {item.message}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onOpenBookings}
                className="rounded-2xl border border-black/10 px-4 py-2 text-xs font-black transition hover:border-[#0066ff]"
              >
                Mở đặt chỗ
              </button>
            </div>
          </article>
        ))}
        {!templates.length && (
          <div className="rounded-[32px] border border-black/10 bg-white p-12 text-center text-[#64748b] lg:col-span-2">
            Chưa có tin nhắn từ đặt chỗ.
          </div>
        )}
      </div>
      <PaginationControls
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

function AnalyticsPage({
  metrics,
  reservations,
  venues,
}: {
  metrics: Record<string, number>;
  reservations: ReservationRequest[];
  venues: Venue[];
}) {
  const venueData = venues
    .map((venue) => ({
      venue,
      count: reservations.filter((booking) => booking.venueId === venue.id)
        .length,
    }))
    .sort((a, b) => b.count - a.count);
  const maxVenueCount = Math.max(1, ...venueData.map((item) => item.count));
  const categoryMap = venues.reduce(
    (acc, venue) => {
      acc[venue.category] = (acc[venue.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const viewMax = Math.max(
    1,
    ...venues.map((venue) => Number(venue.viewCount || 0)),
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Khách hàng"
          value={formatNumber(metrics.guests)}
          icon={Users}
          subtitle="Hồ sơ khách trong hệ thống"
        />
        <MetricCard
          title="Đã xác nhận"
          value={formatNumber(metrics.confirmed)}
          icon={UserCheck}
          subtitle="Booking sẵn sàng phục vụ"
          accent="green"
        />
        <MetricCard
          title="Hoàn tất"
          value={formatNumber(metrics.completed)}
          icon={CheckCircle2}
          subtitle="Booking đã hoàn tất"
        />
        <MetricCard
          title="Lượt xem"
          value={formatNumber(metrics.views)}
          icon={Eye}
          subtitle="Tổng lượt xem venue"
          accent="blue"
        />
      </section>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"></div>
    </div>
  );
}

function FilesPage({
  exportJson,
  exportExcel,
  exportCsv,
  exportTemplate,
  exportCsvTemplate,
  exportWord,
  exportPdf,
  importClick,
  resetDemoData,
}: {
  exportJson: () => void;
  exportExcel: () => void | Promise<void>;
  exportCsv: () => void;
  exportTemplate: () => void | Promise<void>;
  exportCsvTemplate: () => void;
  exportWord: () => void | Promise<void>;
  exportPdf: () => void | Promise<void>;
  importClick: () => void;
  resetDemoData: () => void;
}) {
  const actions = [
    {
      title: "Xuất Excel",
      desc: "Tải báo cáo .xls gồm logo, địa điểm, reels, đặt chỗ và khách.",
      icon: Download,
      action: exportExcel,
    },
    {
      title: "Xuất dữ liệu CSV",
      desc: "Dữ liệu CSV có thể chỉnh nhanh rồi import lại.",
      icon: Download,
      action: exportCsv,
    },
    {
      title: "Mẫu import Excel",
      desc: "Mẫu cấu trúc chuẩn để nhập địa điểm, khu và bàn.",
      icon: FileText,
      action: exportTemplate,
    },
    {
      title: "Mẫu import CSV",
      desc: "Mẫu CSV chuẩn để import trực tiếp vào hệ thống.",
      icon: FileText,
      action: exportCsvTemplate,
    },
    {
      title: "Xuất Word",
      desc: "Tải báo cáo .doc có logo và thông tin hệ thống.",
      icon: FileText,
      action: exportWord,
    },
    {
      title: "Xuất PDF",
      desc: "Mở báo cáo thương hiệu ở chế độ in và lưu PDF.",
      icon: Printer,
      action: exportPdf,
    },
    {
      title: "Sao lưu JSON",
      desc: "Bản sao lưu đầy đủ để khôi phục chính xác.",
      icon: Download,
      action: exportJson,
    },
    {
      title: "Nhập dữ liệu",
      desc: "Nhập bản sao lưu JSON hoặc mẫu CSV UTF-8.",
      icon: Upload,
      action: importClick,
    },
    {
      title: "Đặt lại dữ liệu chuẩn",
      desc: "Khôi phục bộ dữ liệu mẫu cho hệ thống concierge.",
      icon: CheckCircle2,
      action: resetDemoData,
    },
  ];
  const pagination = usePagination(actions, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {pagination.paginatedItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className="rounded-[30px] border border-black/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0066ff] hover:shadow-md"
            >
              <span className="mb-5 inline-flex rounded-2xl bg-[#f8f9ff] p-3 text-[#0066ff]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-black text-[#0f172a]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>
      <PaginationControls
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

function SettingsPage({
  settings,
  onSettingsChange,
}: {
  settings: SiteSettings;
  onSettingsChange: (settings: SiteSettings) => void;
}) {
  const { t } = useI18n();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const uploadLogo = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({
        kind: "error",
        text: "Vui lòng chọn file ảnh logo PNG/JPG/SVG.",
      });
      return;
    }
    setSavingLogo(true);
    setMessage(null);
    try {
      const uploadFile =
        file.type === "image/svg+xml"
          ? file
          : await resizeImageForUpload(file, 1200, 600, 0.9);
      const url = await uploadMediaFile(uploadFile, "brand/logo");
      const nextSettings: SiteSettings = {
        ...settings,
        logoUrl: url,
        logoPath: "",
        updatedAt: new Date().toISOString(),
      };
      saveSiteSettingsLocal(nextSettings);
      const saved = await saveSiteSettingsToServer(nextSettings);
      onSettingsChange(saved);
      setMessage({
        kind: "success",
        text: "Đã cập nhật logo thương hiệu. Trang người dùng sẽ dùng logo mới sau khi reload.",
      });
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof Error ? error.message : "Không upload được logo.",
      });
    } finally {
      setSavingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const resetLogo = async () => {
    setSavingLogo(true);
    setMessage(null);
    try {
      const nextSettings: SiteSettings = {
        ...settings,
        logoUrl: "",
        logoPath: "",
        updatedAt: new Date().toISOString(),
      };
      saveSiteSettingsLocal(nextSettings);
      const saved = await saveSiteSettingsToServer(nextSettings);
      onSettingsChange(saved);
      setMessage({
        kind: "success",
        text: "Đã dùng lại logo mặc định trong /public/duyt-logo.png.",
      });
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof Error ? error.message : "Không đặt lại được logo.",
      });
    } finally {
      setSavingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0066ff]">
            Thiết lập hệ thống
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#0f172a]">
            Ngôn ngữ và giao diện vận hành
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5A544D]">
            Ngôn ngữ mặc định là Tiếng Việt. Khi đổi ngôn ngữ, hệ thống giữ
            nguyên trang hoặc địa điểm đang xem và không tự chuyển về trang chủ.
          </p>
          <div className="mt-5">
            <LanguageSelector variant="light" />
          </div>
        </section>

        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0066ff]">
                Thương hiệu
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#0f172a]">
                Logo website
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5A544D]">
                Tải logo từ máy và lưu vào Supabase Storage. Logo sẽ được dùng
                cho header, footer, trang chủ và bảng quản trị.
              </p>
            </div>
            <ImageIcon className="h-5 w-5 text-[#0066ff]" />
          </div>
          <div className="mt-5 rounded-[28px] bg-[#111827] p-6">
            <img
              src={settings.logoUrl || "/duyt-logo.png"}
              alt="DuyT Danang-Concierge"
              className="mx-auto h-28 w-auto object-contain"
            />
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => uploadLogo(event.target.files)}
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={savingLogo}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:bg-black disabled:opacity-60"
            >
              {savingLogo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Tải logo
            </button>
            <button
              type="button"
              onClick={resetLogo}
              disabled={savingLogo}
              className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-black text-[#0f172a] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              Dùng logo mặc định
            </button>
          </div>
          {message && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${message.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
            >
              {message.text}
            </div>
          )}
        </section>
      </div>
      <BannerVideoManager embedded />
    </div>
  );
}

function ModalShell({
  title,
  children,
  onClose,
  full = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  full?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-xl print:hidden">
      <div
        className={`${full ? "h-[calc(100vh-26px)] w-[calc(100vw-34px)] max-w-[1580px]" : "max-h-[calc(100vh-32px)] w-full max-w-3xl"} overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_30px_100px_rgba(20,20,20,0.22)]`}
      >
        <div className="flex h-full flex-col bg-[#f8f9ff]">
          <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-white px-6 py-4">
            <div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0f172a]">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-[#475569] transition hover:border-[#0066ff] hover:text-[#0f172a]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className={
              full
                ? "min-h-0 flex-1 overflow-y-auto"
                : "min-h-0 overflow-y-auto p-5"
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#64748b]">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "mt-1 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#0f172a] shadow-sm outline-none transition placeholder:text-[#A1A1AA] focus:border-[#0066ff] focus:ring-4 focus:ring-[#0066ff]/10";

function BookingModal({
  draft,
  setDraft,
  venues,
  editing,
  onSubmit,
  onClose,
}: {
  draft: BookingDraft;
  setDraft: React.Dispatch<React.SetStateAction<BookingDraft>>;
  venues: Venue[];
  editing: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const selectedVenue =
    venues.find((venue) => venue.id === draft.venueId) || venues[0];
  const openingHours = selectedVenue?.openingHours || {
    open: "18:00",
    close: "02:00",
    label: "18:00 - 02:00",
  };
  const arrivalOptions = useMemo(
    () => timeOptionsForOpeningHours(openingHours.open, openingHours.close),
    [openingHours.open, openingHours.close],
  );
  const localizedSelectedVenue = selectedVenue
    ? localizeVenue(selectedVenue, locale)
    : selectedVenue;
  return (
    <ModalShell
      title={editing ? "Chỉnh sửa đặt chỗ" : t("newBooking")}
      onClose={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field label={t("name")}>
          <input
            required
            value={draft.fullName}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, fullName: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
        <Field label={t("phone")}>
          <input
            required
            placeholder="0918 246 789"
            value={draft.phoneNumber}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
        <Field label={t("venue")}>
          <select
            value={draft.venueId}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                venueId: e.target.value,
                preferredTableId:
                  venues.find((venue) => venue.id === e.target.value)
                    ?.preferredTables[0]?.id || "",
              }))
            }
            className={inputClass}
          >
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {localizeVenue(venue, locale).name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bàn / khu">
          <select
            value={draft.preferredTableId}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                preferredTableId: e.target.value,
              }))
            }
            className={inputClass}
          >
            {(selectedVenue?.preferredTables || []).map((table) => (
              <option key={table.id} value={table.id}>
                {table.name} · {formatVnd(table.minimumSpend)} · tối đa{" "}
                {table.capacity}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("date")}>
          <input
            type="date"
            min={getLocalDateInputValue()}
            value={draft.date}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, date: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
        <Field label={t("arrivalTime")}>
          <select
            value={draft.arrivalTime}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, arrivalTime: e.target.value }))
            }
            className={inputClass}
          >
            {arrivalOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] font-semibold normal-case tracking-normal text-[#64748b]">
            Giờ hoạt động:{" "}
            {openingHours.label ||
              `${openingHours.open} - ${openingHours.close}`}
          </p>
        </Field>
        <Field label={t("guests")}>
          <input
            type="number"
            min={1}
            max={
              localizedSelectedVenue?.preferredTables.find(
                (table) => table.id === draft.preferredTableId,
              )?.capacity || 99
            }
            value={draft.guestCount}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                guestCount: Number(e.target.value),
              }))
            }
            className={inputClass}
          />
        </Field>
        <Field label={t("status")}>
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                status: e.target.value as BookingStatus,
              }))
            }
            className={inputClass}
          >
            {Object.values(BookingStatus).map((status) => (
              <option key={status} value={status}>
                {t(statusConfig[status].labelKey)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nguồn">
          <select
            value={draft.source}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                source: e.target.value as ReservationRequest["source"],
              }))
            }
            className={inputClass}
          >
            {bookingSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("notes")}>
            <textarea
              value={draft.notes}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={2}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-[#0f172a] px-5 py-3 text-sm font-bold text-white"
          >
            {t("save")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function VenueModal({
  draft,
  setDraft,
  editing,
  onSubmit,
  onClose,
}: {
  draft: VenueDraft;
  setDraft: React.Dispatch<React.SetStateAction<VenueDraft>>;
  editing: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const menuPdfUploadRef = useRef<HTMLInputElement | null>(null);
  const [imageInputs, setImageInputs] = useState(
    draft.imageUrls.length ? draft.imageUrls : [FALLBACK_IMAGE],
  );
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingMenuPdf, setUploadingMenuPdf] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [menuUploadError, setMenuUploadError] = useState("");
  const [tableManagerOpen, setTableManagerOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(
    draft.preferredTables[0]?.id || "",
  );
  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-[#0f172a] outline-none transition focus:border-[#0066ff]";
  const compactInputClass =
    "w-full rounded-xl border border-black/10 bg-white px-2.5 py-2 text-xs font-semibold text-[#0f172a] outline-none transition focus:border-[#0066ff]";

  React.useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      imageUrls: imageInputs.map((item) => item.trim()).filter(Boolean),
    }));
  }, [imageInputs, setDraft]);

  const previewVenue: Venue = {
    id: draft.id || "preview-venue",
    name: draft.name || "Xem trước địa điểm",
    category: draft.category,
    location: draft.location,
    shortDescription: draft.shortDescription,
    longDescription: draft.longDescription || draft.shortDescription,
    image: imageInputs.find((item) => item.trim()) || FALLBACK_IMAGE,
    images: imageInputs.slice(1),
    menuUrl: draft.menuUrl,
    menuPdfUrl: draft.menuPdfUrl,
    openingHours: {
      open: draft.openingOpen || "18:00",
      close: draft.openingClose || "02:00",
      label:
        draft.openingLabel ||
        `${draft.openingOpen || "18:00"} - ${draft.openingClose || "02:00"}`,
    },
    viewCount: Number(draft.viewCount) || 0,
    floorPlanTheme: sanitizeFloorPlanTheme(
      draft.floorPlanTheme,
      draft.category,
    ),
    floorPlanElements: sanitizeFloorPlanElements(
      draft.floorPlanElements,
      draft.category,
    ),
    tableZones: sanitizeZones(draft.tableZones),
    preferredTables: sanitizeTables(
      draft.preferredTables,
      sanitizeZones(draft.tableZones),
    ),
    rating: Number(draft.rating) || 4.8,
    reviewsCount: Number(draft.reviewsCount) || 0,
  };

  const selectedTable =
    draft.preferredTables.find((table) => table.id === selectedTableId) ||
    draft.preferredTables[0];
  const imageList = imageInputs.map((item) => item.trim()).filter(Boolean);
  const mainPreview = imageList[0] || FALLBACK_IMAGE;

  const updateImageAt = (index: number, value: string) =>
    setImageInputs(
      imageInputs.map((image, itemIndex) =>
        itemIndex === index ? value : image,
      ),
    );
  const removeImageAt = (index: number) =>
    setImageInputs(imageInputs.filter((_, itemIndex) => itemIndex !== index));
  const addImageUrl = () => setImageInputs([...imageInputs, ""]);
  const promoteImage = (image: string) => {
    const cleanImages = imageInputs.map((item) => item.trim()).filter(Boolean);
    setImageInputs([image, ...cleanImages.filter((item) => item !== image)]);
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImages(true);
    setImageUploadError("");
    try {
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          if (!file.type.startsWith("image/"))
            throw new Error("Chỉ cho phép upload file ảnh.");
          const optimized = await resizeImageForUpload(file, 1600, 1100, 0.86);
          return uploadMediaFile(optimized, "venues");
        }),
      );
      const cleanInputs = imageInputs
        .map((item) => item.trim())
        .filter(Boolean);
      setImageInputs([...cleanInputs, ...uploadedUrls]);
    } catch (error) {
      setImageUploadError(
        error instanceof Error ? error.message : "Upload ảnh thất bại.",
      );
    } finally {
      setUploadingImages(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const uploadMenuPdf = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingMenuPdf(true);
    setMenuUploadError("");
    try {
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        throw new Error("Vui lòng chọn file PDF cho menu.");
      }
      const uploadedUrl = await uploadMediaFile(file, "venues/menus");
      setDraft((prev) => ({ ...prev, menuPdfUrl: uploadedUrl }));
    } catch (error) {
      setMenuUploadError(
        error instanceof Error ? error.message : "Upload menu PDF thất bại.",
      );
    } finally {
      setUploadingMenuPdf(false);
      if (menuPdfUploadRef.current) menuPdfUploadRef.current.value = "";
    }
  };

  const updateZone = (zoneId: string, patch: Partial<VenueTableZone>) => {
    setDraft((prev) => ({
      ...prev,
      tableZones: sanitizeZones(prev.tableZones).map((zone) =>
        zone.id === zoneId ? { ...zone, ...patch } : zone,
      ),
    }));
  };

  const addZone = () => {
    const nextIndex = draft.tableZones.length + 1;
    const zone: VenueTableZone = {
      id: `zone-${Date.now()}`,
      name: `Zone ${nextIndex}`,
      label: `Khu ${nextIndex}`,
      description: "Mô tả khu vực mới.",
      minimumSpend: Number(draft.minimumSpend) || 3000000,
      capacity: Number(draft.capacity) || 4,
      color: DEFAULT_ZONE_COLORS[nextIndex % DEFAULT_ZONE_COLORS.length],
      order: nextIndex,
      isActive: true,
    };
    setDraft((prev) => ({ ...prev, tableZones: [...prev.tableZones, zone] }));
  };

  const deleteZone = (zoneId: string) => {
    setDraft((prev) => {
      const nextZones = prev.tableZones.filter((zone) => zone.id !== zoneId);
      const fallbackZone = nextZones[0];
      return {
        ...prev,
        tableZones: nextZones,
        preferredTables: prev.preferredTables.map((table) =>
          table.zoneId === zoneId
            ? {
                ...table,
                zoneId: fallbackZone?.id,
                area: fallbackZone?.name || table.area,
                color: fallbackZone?.color || table.color,
              }
            : table,
        ),
      };
    });
  };

  const addTable = () => {
    const zones = sanitizeZones(draft.tableZones);
    const zone = zones[0];
    const nextIndex = draft.preferredTables.length + 1;
    const table: PreferredTable = {
      id: `table-${Date.now()}`,
      name: `T${nextIndex}`,
      area: zone?.name || "VIP Area",
      zoneId: zone?.id,
      minimumSpend: zone?.minimumSpend || Number(draft.minimumSpend) || 3000000,
      capacity: zone?.capacity || Number(draft.capacity) || 4,
      description: "Bàn mới được tạo từ dashboard.",
      status: "AVAILABLE",
      shape: "RECT",
      bookingMode: "REQUEST",
      x: 18 + (nextIndex % 5) * 12,
      y: 26 + Math.floor(nextIndex / 5) * 8,
      width: 8,
      height: 5,
      rotation: 0,
      color: zone?.color || "#0066ff",
      badge: "NONE",
      sortOrder: nextIndex,
    };
    setDraft((prev) => ({
      ...prev,
      preferredTables: [...prev.preferredTables, table],
    }));
    setSelectedTableId(table.id);
  };

  const updateTable = (tableId: string, patch: Partial<PreferredTable>) => {
    setDraft((prev) => ({
      ...prev,
      preferredTables: sanitizeTables(
        prev.preferredTables,
        sanitizeZones(prev.tableZones),
      ).map((table) => {
        if (table.id !== tableId) return table;
        const next = { ...table, ...patch };
        if (patch.zoneId) {
          const zone = prev.tableZones.find((item) => item.id === patch.zoneId);
          if (zone) {
            next.area = zone.name;
            next.color = next.color || zone.color;
            if (!patch.minimumSpend)
              next.minimumSpend =
                Number(next.minimumSpend) || zone.minimumSpend;
          }
        }
        return next;
      }),
    }));
  };

  const deleteTable = (tableId: string) => {
    setDraft((prev) => ({
      ...prev,
      preferredTables: prev.preferredTables.filter(
        (table) => table.id !== tableId,
      ),
    }));
    if (selectedTableId === tableId)
      setSelectedTableId(
        draft.preferredTables.find((table) => table.id !== tableId)?.id || "",
      );
  };

  const moveSelectedTable = (dx: number, dy: number) => {
    if (!selectedTable) return;
    updateTable(selectedTable.id, {
      x: Math.max(0, Math.min(100, Number(selectedTable.x) + dx)),
      y: Math.max(0, Math.min(100, Number(selectedTable.y) + dy)),
    });
  };

  return (
    <ModalShell
      full
      title={editing ? "Chỉnh sửa địa điểm" : "Thêm địa điểm"}
      onClose={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="grid min-h-full grid-cols-12 gap-4 p-4"
      >
        <section className="col-span-12 grid min-h-0 grid-rows-[auto_auto_1fr] gap-3 rounded-[26px] border border-black/10 bg-[#f8f9ff] p-4 lg:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Thư viện ảnh
              </p>
              <p className="text-[11px] text-[#64748b]">
                Mỗi dòng là một ảnh. Ảnh đầu tiên sẽ là ảnh đại diện địa điểm.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addImageUrl}
                className="inline-flex items-center gap-1 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-[#0f172a] transition hover:border-[#0066ff]"
              >
                <Plus className="h-3.5 w-3.5" />
                URL
              </button>
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                disabled={uploadingImages}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploadingImages ? "Đang tải..." : "Tải ảnh"}
              </button>
            </div>
          </div>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => uploadImages(event.target.files)}
          />
          <div className="overflow-hidden rounded-[24px] border border-[#0066ff]/30 bg-black shadow-inner">
            <img
              src={safeImageSrc(mainPreview)}
              alt="Main venue preview"
              referrerPolicy="no-referrer"
              className="max-h-[300px] min-h-[220px] w-full object-contain"
            />
          </div>
          <div className="min-h-0 rounded-2xl border border-black/10 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Danh sách ảnh
              </p>
              <span className="text-[11px] font-semibold text-[#A1A1A6]">
                {imageInputs.length} ảnh
              </span>
            </div>
            <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto pr-1">
              {imageInputs.map((image, index) => {
                const cleanImage = image.trim();
                return (
                  <div
                    key={`${index}-${cleanImage.slice(0, 20)}`}
                    className="grid grid-cols-[32px_1fr_28px_28px] items-center gap-2 rounded-2xl border border-black/10 bg-[#FBFBFD] p-1.5"
                  >
                    {cleanImage ? (
                      <img
                        src={safeImageSrc(cleanImage)}
                        alt={`URL preview ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f8f9ff] text-[9px] text-[#A1A1A6]">
                        URL
                      </div>
                    )}
                    <input
                      value={image}
                      onChange={(event) =>
                        updateImageAt(index, event.target.value)
                      }
                      placeholder={`URL ảnh ${index + 1}`}
                      className="w-full bg-transparent text-[11px] font-semibold text-[#0f172a] outline-none placeholder:text-[#A1A1A6]"
                    />
                    <button
                      type="button"
                      onClick={() => promoteImage(image)}
                      className="flex h-7 w-7 items-center justify-center rounded-xl text-[#0066ff] transition hover:bg-[#0066ff]/10"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImageAt(index)}
                      className="flex h-7 w-7 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            {imageUploadError && (
              <p className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                {imageUploadError}
              </p>
            )}
          </div>
        </section>

        <section className="col-span-12 grid min-h-0 grid-rows-[auto_auto_1fr_auto] rounded-[26px] border border-black/10 bg-white p-4 lg:col-span-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tên địa điểm">
              <input
                required
                value={draft.name}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Danh mục">
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    category: e.target.value as Venue["category"],
                  }))
                }
                className={inputClass}
              >
                {venueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vị trí">
              <input
                value={draft.location}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, location: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Chi tiêu tối thiểu cơ bản">
              <input
                type="number"
                min={0}
                value={draft.minimumSpend}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    minimumSpend: Number(e.target.value),
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Đánh giá">
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={draft.rating}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    rating: Number(e.target.value),
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Lượt xem địa điểm">
              <input
                type="number"
                min={0}
                value={draft.viewCount}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    viewCount: Number(e.target.value),
                  }))
                }
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <input
                ref={menuPdfUploadRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => uploadMenuPdf(e.target.files)}
              />
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-[#F9F9FA] p-3">
                <button
                  type="button"
                  onClick={() => menuPdfUploadRef.current?.click()}
                  disabled={uploadingMenuPdf}
                  className="rounded-xl bg-[#0f172a] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {uploadingMenuPdf ? "Đang tải PDF..." : "Tải PDF menu từ máy"}
                </button>
                <span className="text-xs text-[#64748b]">
                  PDF menu được lưu vào Supabase Storage. Giá hiển thị chưa bao
                  gồm 10% VAT và 5% phí phục vụ.
                </span>
                {draft.menuPdfUrl && (
                  <a
                    href={draft.menuPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#0066ff]"
                  >
                    Xem PDF hiện tại
                  </a>
                )}
              </div>
              {menuUploadError && (
                <p className="mt-2 text-xs font-semibold text-red-500">
                  {menuUploadError}
                </p>
              )}
            </div>
            <Field label="Giờ mở cửa">
              <input
                type="time"
                value={draft.openingOpen}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    openingOpen: e.target.value,
                    openingLabel: `${e.target.value} - ${prev.openingClose}`,
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Giờ đóng cửa">
              <input
                type="time"
                value={draft.openingClose}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    openingClose: e.target.value,
                    openingLabel: `${prev.openingOpen} - ${e.target.value}`,
                  }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-3 grid min-h-0 grid-rows-[auto_1fr] gap-3">
            <Field label="Mô tả ngắn">
              <textarea
                required
                value={draft.shortDescription}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    shortDescription: e.target.value,
                  }))
                }
                rows={2}
                className={inputClass}
              />
            </Field>
            <Field label="Mô tả chi tiết">
              <textarea
                value={draft.longDescription}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    longDescription: e.target.value,
                  }))
                }
                className={`${inputClass} h-full resize-none leading-relaxed`}
              />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/10 pt-4">
            <p className="max-w-sm text-xs leading-relaxed text-[#64748b]"></p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold transition hover:bg-[#f8f9ff]"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-[#0f172a] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </section>

        <section className="col-span-12 flex min-h-0 flex-col rounded-[26px] border border-black/10 bg-[#f8f9ff] p-4 lg:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#000000]">
                Preview sơ đồ
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTableManagerOpen(true)}
              className="rounded-2xl bg-[#0066ff] px-4 py-2 text-xs font-black text-[#0f172a]"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              Quản lý
            </button>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[22px] border border-black/10 bg-white p-4">
            <div className="rounded-[24px] border border-[#20242E] bg-[#d7d9df] p-4 text-black">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#283241]">
                {previewVenue.name}
              </p>
              <h3 className="mt-1 text-xl font-black">
                {
                  sanitizeTables(
                    draft.preferredTables,
                    sanitizeZones(draft.tableZones),
                  ).length
                }{" "}
                bàn · {sanitizeZones(draft.tableZones).length} khu
              </h3>
              <div className="mt-4 space-y-2">
                {sanitizeZones(draft.tableZones)
                  .slice(0, 6)
                  .map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-xs font-bold">{zone.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#0066ff]">
                        {formatVnd(zone.minimumSpend)}
                      </span>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                onClick={() => setTableManagerOpen(true)}
                className="mt-4 w-full rounded-2xl bg-[#0066ff] px-4 py-3 text-xs font-black uppercase tracking-wider text-black"
              >
                Mở modal kéo thả layout
              </button>
            </div>
          </div>
        </section>
      </form>
      {tableManagerOpen && (
        <TableMapManagerModal
          venueName={draft.name || "Venue"}
          venueCategory={draft.category}
          zones={draft.tableZones}
          tables={draft.preferredTables}
          elements={draft.floorPlanElements}
          theme={draft.floorPlanTheme}
          baseMinimumSpend={Number(draft.minimumSpend) || 3000000}
          baseCapacity={Number(draft.capacity) || 4}
          onChangeZones={(nextZones) =>
            setDraft((prev) => ({ ...prev, tableZones: nextZones }))
          }
          onChangeTables={(nextTables) =>
            setDraft((prev) => ({ ...prev, preferredTables: nextTables }))
          }
          onChangeElements={(nextElements) =>
            setDraft((prev) => ({ ...prev, floorPlanElements: nextElements }))
          }
          onChangeTheme={(nextTheme) =>
            setDraft((prev) => ({ ...prev, floorPlanTheme: nextTheme }))
          }
          onClose={() => setTableManagerOpen(false)}
        />
      )}
    </ModalShell>
  );
}

function ReelModal({
  draft,
  setDraft,
  venues,
  editing,
  onSubmit,
  onClose,
}: {
  draft: VenueReelDraft;
  setDraft: React.Dispatch<React.SetStateAction<VenueReelDraft>>;
  venues: Venue[];
  editing: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLInputElement | null>(null);
  const posterRef = useRef<HTMLInputElement | null>(null);
  const [mediaError, setMediaError] = useState("");
  const selectedVenue =
    venues.find((venue) => venue.id === draft.venueId) || venues[0];

  const applyVenuePreset = (venueId: string) => {
    const venue = venues.find((item) => item.id === venueId);
    setDraft((prev) => ({
      ...prev,
      venueId,
      title: prev.title || (venue ? `${venue.name} Reel` : prev.title),
      tag: prev.tag || venue?.name.split(" ")[0] || "DuyT",
      posterUrl: prev.posterUrl || venue?.image || "",
    }));
  };

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  const uploadVideo = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMediaError("Vui lòng chọn file video.");
      return;
    }

    if (file.size > MAX_REEL_VIDEO_BYTES) {
      setMediaError(
        "Video quá nặng. Hãy nén video dưới 250MB hoặc upload lên Cloudinary/Supabase Storage rồi dán URL .mp4.",
      );
      return;
    }

    setUploadingVideo(true);
    setMediaError("");

    try {
      let autoPosterUrl = "";
      try {
        const posterFile = await extractPosterFromVideo(file);
        if (posterFile)
          autoPosterUrl = await uploadMediaFile(posterFile, "reels/posters");
      } catch (posterError) {
        console.warn("[DuyT] Auto poster extraction failed.", posterError);
      }

      const url = await uploadMediaFile(file, "reels");
      setDraft((prev) => ({
        ...prev,
        videoUrl: url,
        posterUrl:
          autoPosterUrl || prev.posterUrl || selectedVenue?.image || "",
      }));
      if (!autoPosterUrl)
        setMediaError(
          "Đã upload video. Hệ thống không lấy được ảnh bìa tự động nên dùng ảnh địa điểm làm dự phòng.",
        );
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Không upload được video.",
      );
    } finally {
      setUploadingVideo(false);
      if (videoRef.current) videoRef.current.value = "";
    }
  };

  const uploadPoster = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMediaError("Vui lòng chọn file ảnh.");
      return;
    }

    setUploadingPoster(true);
    setMediaError("");

    try {
      const optimized = await resizeImageForUpload(file, 1080, 1920, 0.88);
      const url = await uploadMediaFile(optimized, "reels/posters");
      setDraft((prev) => ({ ...prev, posterUrl: url }));
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Không upload được ảnh bìa.",
      );
    } finally {
      setUploadingPoster(false);
      if (posterRef.current) posterRef.current.value = "";
    }
  };

  const showVideoPlayer = Boolean(
    draft.videoUrl && isDirectVideoUrl(draft.videoUrl),
  );
  const showPoster = Boolean(draft.posterUrl && !showVideoPlayer);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xl">
      <form
        onSubmit={onSubmit}
        className="grid h-[min(820px,calc(100vh-32px))] w-[min(1080px,calc(100vw-32px))] grid-cols-12 overflow-hidden rounded-[34px] bg-white shadow-2xl"
      >
        <section className="col-span-5 flex flex-col bg-[#0f172a] p-6 text-white">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0066ff]">
                Reel trang chủ
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {editing ? "Chỉnh sửa reel" : "Thêm reel"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-auto aspect-[9/16] h-[min(620px,calc(100vh-170px))] overflow-hidden rounded-[28px] border border-[#0066ff]/30 bg-black shadow-2xl">
            {showVideoPlayer ? (
              <video
                src={draft.videoUrl}
                poster={draft.posterUrl || undefined}
                controls
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : showPoster ? (
              <img
                src={safeImageSrc(draft.posterUrl)}
                alt="Xem trước ảnh bìa reel"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center text-sm text-white/60">
                <div className="mb-4 rounded-full bg-white/10 p-4">
                  <Upload className="h-8 w-8" />
                </div>
                Upload reel MP4/WebM tỷ lệ 9:16. Ảnh bìa sẽ được tạo tự động.
              </div>
            )}
          </div>
        </section>

        <section className="col-span-7 grid min-h-0 grid-rows-[1fr_auto] p-6">
          <div className="grid min-h-0 content-start grid-cols-2 gap-4 overflow-y-auto pr-1">
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => uploadVideo(event.target.files)}
            />
            <input
              ref={posterRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => uploadPoster(event.target.files)}
            />

            <div className="col-span-2 rounded-[24px] border border-black/10 bg-[#f8f9ff] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Tệp reel
              </p>
              <p className="mt-1 text-xs text-[#64748b]">
                Upload video dọc 9:16. Ảnh bìa sẽ được lấy tự động từ khung hình
                video; link Instagram dùng để chuyển hướng khi khách bấm xem.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => videoRef.current?.click()}
                  disabled={uploadingVideo}
                  className="rounded-2xl bg-[#0f172a] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload className="mr-2 inline h-4 w-4" />
                  {uploadingVideo ? "Đang tải video..." : "Tải video 9:16"}
                </button>
                <button
                  type="button"
                  onClick={() => posterRef.current?.click()}
                  disabled={uploadingPoster}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingPoster ? "Đang tải ảnh bìa..." : "Thay ảnh bìa"}
                </button>
              </div>
              {mediaError && (
                <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {mediaError}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Field label="Địa điểm liên kết">
                <select
                  value={draft.venueId}
                  onChange={(e) => applyVenuePreset(e.target.value)}
                  className={inputClass}
                >
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} · {venue.category}
                    </option>
                  ))}
                </select>
              </Field>
              {selectedVenue && (
                <p className="mt-2 text-xs font-semibold normal-case tracking-normal text-[#64748b]">
                  Reel này dùng thông tin từ {selectedVenue.name}. Không cần
                  nhập lại dữ liệu địa điểm.
                </p>
              )}
            </div>
            <Field label="Tiêu đề quản lý">
              <input
                value={draft.title}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                className={inputClass}
                placeholder="ADM Club Reel"
              />
            </Field>
            <Field label="Nhãn hiển thị">
              <input
                value={draft.tag}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, tag: e.target.value }))
                }
                className={inputClass}
                placeholder="ADM"
              />
            </Field>
            <div className="col-span-2">
              <Field label="Mô tả trên trang chủ">
                <textarea
                  value={draft.caption}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, caption: e.target.value }))
                  }
                  rows={3}
                  className={inputClass}
                  placeholder="Không khí sôi động, bàn VIP và hỗ trợ concierge trước khi khách đến..."
                />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Link Instagram reel/post">
                <input
                  value={draft.instagramUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      instagramUrl: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="https://www.instagram.com/reel/..."
                />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Video đã upload / đường dẫn video">
                <input
                  value={
                    draft.videoUrl.startsWith("data:video") ||
                    draft.videoUrl.startsWith("blob:")
                      ? "File video đã upload"
                      : draft.videoUrl
                  }
                  readOnly={
                    draft.videoUrl.startsWith("data:video") ||
                    draft.videoUrl.startsWith("blob:")
                  }
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, videoUrl: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="https://.../video.mp4 hoặc upload phía trên"
                />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Ảnh bìa đã upload / URL ảnh bìa">
                <input
                  value={
                    draft.posterUrl.startsWith("data:image")
                      ? "Ảnh bìa đã upload"
                      : draft.posterUrl
                  }
                  readOnly={draft.posterUrl.startsWith("data:image")}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, posterUrl: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="Tự tạo từ video đã upload hoặc thay bằng ảnh bìa riêng"
                />
              </Field>
            </div>
            <Field label="Vị trí hiển thị">
              <select
                value={draft.placement || "HOME_FEED"}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    placement: e.target.value as HomepageReel["placement"],
                  }))
                }
                className={inputClass}
              >
                <option value="HOME_FEED">Luồng reel chính</option>
                <option value="HOME_HOST">Khu concierge / liên hệ</option>
              </select>
            </Field>
            <Field label="Thứ tự hiển thị">
              <input
                type="number"
                min={1}
                value={draft.order}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    order: Number(e.target.value) || 1,
                  }))
                }
                className={inputClass}
              />
            </Field>
            <label className="col-span-2 inline-flex items-center gap-3 rounded-2xl border border-black/10 p-4 text-sm font-bold text-[#0f172a]">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />{" "}
              Hiển thị reel trên trang chủ
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-black/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold transition hover:bg-[#f8f9ff]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-[#0f172a] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
            >
              Lưu reel
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

function CustomerModal({
  draft,
  setDraft,
  editing,
  onSubmit,
  onClose,
}: {
  draft: CustomerDraft;
  setDraft: React.Dispatch<React.SetStateAction<CustomerDraft>>;
  editing: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <ModalShell
      title={editing ? "Chỉnh sửa khách" : "Thêm khách"}
      onClose={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field label={t("name")}>
          <input
            required
            value={draft.fullName}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, fullName: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
        <Field label={t("phone")}>
          <input
            value={draft.phoneNumber}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
        <Field label="Hạng khách">
          <select
            value={draft.vipStatus}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                vipStatus: e.target.value as VipStatus,
              }))
            }
            className={inputClass}
          >
            {Object.values(VipStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("notes")}>
            <textarea
              value={draft.notes}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={4}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-[#0f172a] px-5 py-3 text-sm font-bold text-white"
          >
            {t("save")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Xác nhận",
  onHủy,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onHủy: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#12151B] p-6 text-white shadow-2xl">
        <div className="mb-4 inline-flex rounded-2xl bg-[#0066ff]/15 p-3 text-[#0066ff]">
          <Bell className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/65">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onHủy}
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-[#0066ff] px-5 py-3 text-sm font-bold text-[#0f172a] hover:bg-[#3b82f6]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingLiveToast({
  notice,
  onOpen,
  onClose,
}: {
  notice: AdminNotification;
  onOpen: () => void;
  onClose: () => void;
}) {
  const accentColor = notice.tableColor || "#0066ff";

  const createdTime = formatAdminDateTime(notice.createdAt, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <div className="pointer-events-none fixed left-1/2 top-7 z-[1000] w-[min(620px,calc(100vw-24px))] -translate-x-1/2 print:hidden">
      <div
        className="pointer-events-auto relative overflow-hidden rounded-[32px] border bg-white text-[#0f172a] shadow-[0_34px_110px_rgba(15,23,42,0.28)]"
        style={{
          borderColor: "rgba(15, 23, 42, 0.12)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, #0066ff, #3b82f6)`,
          }}
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 12% 0%, rgba(0,102,255,0.12), transparent 34%), linear-gradient(135deg, rgba(15,23,42,0.03), transparent 45%)",
          }}
        />

        <button
          type="button"
          onClick={onOpen}
          className="relative block w-full px-5 py-5 pr-16 text-left transition hover:bg-[#f8f9ff]"
        >
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] text-white shadow-[0_16px_34px_rgba(0,102,255,0.24)]"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, #0066ff)`,
              }}
            >
              <Bell className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{
                    backgroundColor: "rgba(0,102,255,0.08)",
                    color: "#0066ff",
                  }}
                >
                  Đặt chỗ mới
                </span>

                <span className="text-[11px] font-black text-[#64748b]">
                  {createdTime}
                </span>
              </div>

              <h3 className="truncate text-lg font-black tracking-tight text-[#0f172a]">
                {notice.title || "Đặt chỗ mới"}
              </h3>

              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-[#475569]">
                {notice.message || "Có booking mới cần xử lý."}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-4 py-2 text-xs font-black text-white shadow-sm">
                Mở đặt chỗ
                <span className="text-[#60a5fa]">→</span>
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }}
          aria-label="Đóng thông báo"
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full border transition hover:scale-105"
          style={{
            backgroundColor: "rgba(15,23,42,0.96)",
            borderColor: "rgba(15,23,42,0.16)",
            color: "#ffffff",
          }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="absolute bottom-0 left-0 h-1 w-full bg-[#e2e8f0]">
          <div
            className="h-full w-full origin-left"
            style={{
              background: `linear-gradient(90deg, ${accentColor}, #0066ff, #3b82f6)`,
              animation: "duytToastProgress 8s linear forwards",
            }}
          />
        </div>

        <style jsx>{`
          @keyframes duytToastProgress {
            from {
              transform: scaleX(1);
            }
            to {
              transform: scaleX(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function Toast({ kind, message }: { kind: ToastKind; message: string }) {
  const style =
    kind === "success"
      ? {
          title: "Hoàn tất",
          accent: "from-emerald-300 via-emerald-400 to-[#0066ff]",
          border: "border-emerald-300/50",
          glow: "shadow-emerald-900/20",
          icon: "✓",
        }
      : kind === "error"
        ? {
            title: "Cần xử lý",
            accent: "from-red-300 via-red-500 to-[#0066ff]",
            border: "border-red-300/50",
            glow: "shadow-red-900/25",
            icon: "!",
          }
        : {
            title: "Thông báo concierge",
            accent: "from-[#0066ff] via-[#3b82f6] to-white",
            border: "border-[#0066ff]/50",
            glow: "shadow-[#0066ff]/20",
            icon: "i",
          };
  return (
    <div
      className={`fixed left-1/2 top-5 z-[95] w-[min(460px,calc(100vw-40px))] -translate-x-1/2 overflow-hidden rounded-[26px] border ${style.border} bg-[#0f172a]/95 text-white shadow-2xl ${style.glow} backdrop-blur-2xl`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${style.accent}`} />
      <div className="relative flex items-start gap-4 p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,168,95,0.16),transparent_40%)]" />
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.accent} text-xl font-black text-[#0f172a] shadow-lg`}
        >
          {style.icon}
        </div>
        <div className="relative min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0066ff]">
            DuyT Concierge
          </p>
          <p className="mt-1 text-base font-bold tracking-tight">
            {style.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/78">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LuxuryDashboard(props: LuxuryDashboardProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "vi";
    const stored = localStorage.getItem("aurelius-locale");
    return isLocale(stored) ? stored : "vi";
  });

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined")
      localStorage.setItem("aurelius-locale", nextLocale);
  };

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      <DashboardContent {...props} />
    </I18nProvider>
  );
}
