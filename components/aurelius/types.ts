export enum BookingStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum VipStatus {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  VVIP = 'VVIP',
  ELITE = 'ELITE'
}

export type HomepageReelPlacement = 'HOME_FEED' | 'HOME_HOST';

export interface HomepageReel {
  id: string;
  venueId: string;
  title: string;
  tag: string;
  caption: string;
  instagramUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  isActive: boolean;
  order: number;
  placement?: HomepageReelPlacement;
}

export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'HIDDEN' | 'INQUIRY';
export type TableShape = 'RECT' | 'ROUND' | 'SOFA' | 'BAR' | 'STAGE';
export type TableBookingMode = 'REQUEST' | 'BIDDING' | 'LOTTERY' | 'MESSAGE_ONLY';
export type VenueMapElementType = 'STAGE' | 'DJ' | 'BAR' | 'DOOR' | 'WALKWAY' | 'LABEL' | 'POOL' | 'KTV' | 'SCREEN' | 'VIP_ROOM' | 'CUSTOM';
export type VenueFloorPlanThemeStyle = 'NIGHTCLUB' | 'BLUEPRINT' | 'BEACH' | 'LOUNGE' | 'YACHT' | 'MINIMAL';
export type VenueFloorPlanRatio = 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE';


export interface VenueFloorPlanTheme {
  style: VenueFloorPlanThemeStyle;
  ratio: VenueFloorPlanRatio;
  backgroundColor: string;
  accentColor: string;
  surfaceColor: string;
  gridColor: string;
  texture?: 'GRID' | 'WOOD' | 'POOL' | 'CARPET' | 'NONE';
  helperText?: string;
  showGrid?: boolean;
}

export interface VenueMapElement {
  id: string;
  type: VenueMapElementType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color?: string;
  order?: number;
  isActive?: boolean;
}

export interface VenueTableZone {
  id: string;
  name: string;
  label: string;
  description: string;
  minimumSpend: number;
  capacity: number;
  color: string;
  order: number;
  isActive: boolean;
}

export interface PreferredTable {
  id: string;
  name: string;
  area: string;
  minimumSpend: number;
  capacity: number;
  description: string;
  zoneId?: string;
  status?: TableStatus;
  shape?: TableShape;
  bookingMode?: TableBookingMode;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  sortOrder?: number;
  badge?: 'BIDDING' | 'LADY' | 'VIP' | 'SVIP' | 'NONE';
}

export interface Venue {
  id: string;
  name: string;
  category: 'Nightclub' | 'Karaoke';
  location: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  images: string[];
  videoUrl?: string;
  reels?: HomepageReel[];
  menuUrl?: string;
  menuPdfUrl?: string;
  openingHours?: { open: string; close: string; label?: string };
  viewCount?: number;
  floorPlanUrl?: string;
  floorPlanTheme?: VenueFloorPlanTheme;
  floorPlanElements?: VenueMapElement[];
  tableZones?: VenueTableZone[];
  preferredTables: PreferredTable[];
  rating: number;
  reviewsCount: number;
}

export interface ReservationRequest {
  id: string;
  venueId: string;
  venueName: string;
  fullName: string;
  phoneNumber: string;
  guestCount: number;
  date: string;
  arrivalTime: string;
  preferredTableId: string;
  preferredTableName: string;
  preferredTableArea?: string;
  preferredTableMinimumSpend?: number;
  preferredTableColor?: string;
  preferredTableCapacity?: number;
  referenceCode?: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
  source: 'WhatsApp' | 'Telegram' | 'Zalo' | 'Instagram' | 'Web Form';
}

export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  notes: string;
  vipStatus: VipStatus;
  favoriteVenueIds: string[];
  createdAt: string;
}
