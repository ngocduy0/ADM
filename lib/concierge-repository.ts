import { createClient } from '@supabase/supabase-js';
import { INITIAL_CUSTOMERS, INITIAL_RESERVATIONS, INITIAL_VENUES } from '@/components/aurelius/data';
import { BookingStatus, Customer, ReservationRequest, Venue } from '@/components/aurelius/types';
import {
  buildBookingStorageDate,
  decodeBookingNotes,
  encodeBookingNotes,
  parseBookingStorageDateTime,
} from '@/lib/booking-storage-time';

export const dynamic = 'force-dynamic';

export type ConciergePayload = {
  venues: Venue[];
  customers: Customer[];
  reservations: ReservationRequest[];
};

type DbVenue = Record<string, any>;
type DbVenueImage = Record<string, any>;
type DbVenueSpot = Record<string, any>;
type DbVenueTableZone = Record<string, any>;
type DbVenueMapElement = Record<string, any>;
type DbVenueMapConfig = Record<string, any>;
type DbCustomer = Record<string, any>;
type DbBooking = Record<string, any>;
type DbBookingContact = Record<string, any>;

const SUPABASE_TIMEOUT_MS = Math.max(3_000, Number(process.env.SUPABASE_REQUEST_TIMEOUT_MS || 5_000));
const READ_CACHE_TTL_MS = Math.max(500, Number(process.env.CONCIERGE_READ_CACHE_TTL_MS || 3_000));
let dataCache: { expiresAt: number; value: ConciergePayload } | null = null;
let seedPromise: Promise<void> | null = null;

export function invalidateConciergeCache() {
  dataCache = null;
}

function timedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  const externalSignal = init?.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

export function getSupabaseAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase API key');
  }

  return createClient(url, key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });
}

function slugify(input: string, fallback: string) {
  const slug = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || fallback;
}

const VIDEO_MARKER = '\n\nVIDEO_URL:';
const REELS_MARKER = '\n\nREELS_JSON:';
const VENUE_META_MARKER = '\n\nVENUE_META_JSON:';

function readMarkerBlock(raw: string, marker: string) {
  const markerIndex = raw.indexOf(marker);
  if (markerIndex < 0) return { value: '', rest: raw };

  const start = markerIndex + marker.length;
  const nextMarkerIndex = raw.slice(start).search(/\n\n[A-Z_]+:/);
  const end = nextMarkerIndex >= 0 ? start + nextMarkerIndex : raw.length;

  return {
    value: raw.slice(start, end).trim(),
    rest: `${raw.slice(0, markerIndex)}${raw.slice(end)}`.trim(),
  };
}

function splitDescription(description?: string | null) {
  let raw = description || '';
  const metaBlock = readMarkerBlock(raw, VENUE_META_MARKER);
  raw = metaBlock.rest;
  const reelsBlock = readMarkerBlock(raw, REELS_MARKER);
  raw = reelsBlock.rest;
  const videoBlock = readMarkerBlock(raw, VIDEO_MARKER);
  raw = videoBlock.rest;

  let reels: Venue['reels'] = [];
  if (reelsBlock.value) {
    try {
      const parsed = JSON.parse(reelsBlock.value);
      reels = Array.isArray(parsed) ? parsed : [];
    } catch {
      reels = [];
    }
  }

  let meta: Partial<Venue> = {};
  if (metaBlock.value) {
    try {
      const parsed = JSON.parse(metaBlock.value);
      meta = parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      meta = {};
    }
  }

  const [shortDescription, ...rest] = raw.split('\n\n');
  return {
    shortDescription: shortDescription || 'Địa điểm concierge cao cấp được đồng bộ từ Supabase.',
    longDescription: rest.join('\n\n') || shortDescription || 'Địa điểm concierge cao cấp được đồng bộ từ Supabase.',
    videoUrl: videoBlock.value,
    reels,
    meta,
  };
}

function buildVenueDescription(venue: Venue) {
  const base = `${venue.shortDescription || ''}\n\n${venue.longDescription || ''}`.trim();
  const video = venue.videoUrl ? `${VIDEO_MARKER}${venue.videoUrl}` : '';
  const reels = Array.isArray(venue.reels) && venue.reels.length
    ? `${REELS_MARKER}${JSON.stringify(venue.reels.map((reel) => ({
        id: reel.id,
        venueId: reel.venueId || venue.id,
        title: reel.title,
        tag: reel.tag,
        caption: reel.caption,
        instagramUrl: reel.instagramUrl || '',
        videoUrl: reel.videoUrl || '',
        posterUrl: reel.posterUrl || '',
        isActive: reel.isActive !== false,
        order: Number(reel.order) || 0,
        placement: reel.placement || 'HOME_FEED',
      })))}`
    : '';
  const meta = `${VENUE_META_MARKER}${JSON.stringify({
    menuUrl: venue.menuUrl || '',
    menuPdfUrl: venue.menuPdfUrl || '',
    openingHours: venue.openingHours || null,
    viewCount: Math.max(0, Number(venue.viewCount || 0)),
    rating: Number(venue.rating) || 4.8,
    reviewsCount: Math.max(0, Number(venue.reviewsCount || 0)),
  })}`;

  return `${base}${video}${reels}${meta}`.trim();
}

function uiStatusToDb(status: BookingStatus) {
  if (status === BookingStatus.NEW) return 'PENDING';
  return status;
}

function dbStatusToUi(status: string): BookingStatus {
  if (status === 'PENDING') return BookingStatus.NEW;
  if (status === 'CONTACTED') return BookingStatus.CONTACTED;
  if (status === 'CONFIRMED') return BookingStatus.CONFIRMED;
  if (status === 'COMPLETED') return BookingStatus.COMPLETED;
  if (status === 'CANCELLED') return BookingStatus.CANCELLED;
  if (status === 'NO_SHOW') return BookingStatus.NO_SHOW;
  return BookingStatus.NEW;
}

function buildBookingDate(date: string, arrivalTime: string) {
  return buildBookingStorageDate(date, arrivalTime);
}

function formatDate(value: string, notes?: string | null) {
  return parseBookingStorageDateTime(value, notes)?.date || '';
}

function formatTime(value: string, notes?: string | null) {
  return parseBookingStorageDateTime(value, notes)?.time || '';
}

export async function readReservationStatusFast(id: string): Promise<ReservationRequest | null> {
  const supabase = getSupabaseAdminClient();
  const row = await checked(
    supabase.from('Booking').select('id,bookingDate,status,notes,createdAt').eq('id', id).maybeSingle(),
    'read Booking status',
  ) as { id: string; bookingDate: string; status: string; notes?: string | null; createdAt?: string } | null;
  if (!row) return null;
  return {
    id: row.id,
    venueId: '',
    venueName: '',
    fullName: '',
    phoneNumber: '',
    guestCount: 1,
    date: formatDate(row.bookingDate, row.notes),
    arrivalTime: formatTime(row.bookingDate, row.notes),
    preferredTableId: '',
    preferredTableName: '',
    notes: '',
    status: dbStatusToUi(String(row.status)),
    createdAt: row.createdAt || new Date().toISOString(),
    source: 'Web Form',
  };
}

function generateId(prefix: string, seed: string) {
  return `${prefix}-${seed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || Date.now()}`;
}

async function checked<T>(query: PromiseLike<{ data: T; error: any }>, label: string): Promise<T> {
  const { data, error } = await query;
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return data;
}

function getCloudflareClientIp(request: Request) {
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('true-client-ip') ||
    forwardedFor ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

function buildRequestSecurityContext(request: Request, metadata: Record<string, unknown> = {}) {
  const url = new URL(request.url);
  return {
    ip: getCloudflareClientIp(request),
    country: request.headers.get('cf-ipcountry') || 'unknown',
    cfRay: request.headers.get('cf-ray') || '',
    userAgent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
    language: request.headers.get('accept-language') || '',
    method: request.method,
    path: url.pathname,
    metadata,
  };
}

export async function upsertBookingNotificationFast(reservation: ReservationRequest) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  await checked(supabase.from('AdminNotification').upsert({
    id: `booking-${reservation.id}`,
    reservationId: reservation.id,
    title: `Booking mới · ${reservation.fullName}`,
    message: `${reservation.venueName} · ${reservation.preferredTableName || 'Chưa chọn bàn'} · ${reservation.guestCount} khách · ${reservation.date} ${reservation.arrivalTime}`,
    tableColor: reservation.preferredTableColor || null,
    isRead: false,
    createdAt: reservation.createdAt || now,
    updatedAt: now,
  }, { onConflict: 'id' }), 'upsert AdminNotification');
}

export async function writeSecurityLog(event: string, request: Request, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = getSupabaseAdminClient();
    const context = buildRequestSecurityContext(request, metadata);
    await supabase.from('SecurityLog').insert({
      event,
      ip: context.ip,
      country: context.country,
      cfRay: context.cfRay,
      userAgent: context.userAgent,
      referer: context.referer,
      language: context.language,
      method: context.method,
      path: context.path,
      metadata: context.metadata,
    });
  } catch {
    // Security logging must never delay or break primary admin operations.
  }
}

async function deleteStaleRowsByVenue(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  tableName: string,
  currentIds: string[],
  venueIds: string[],
  label: string,
) {
  if (!venueIds.length) return;
  const existing = await checked(
    supabase.from(tableName).select('id,venueId').in('venueId', venueIds),
    `read existing ${label}`,
  ) as Array<{ id: string; venueId?: string }>;
  const current = new Set(currentIds.filter(Boolean));
  const staleIds = existing.map((row) => row.id).filter((id) => id && !current.has(id));
  if (staleIds.length) {
    await checked(supabase.from(tableName).delete().in('id', staleIds), `delete stale ${label}`);
  }
}

async function deleteStaleRowsById(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  tableName: string,
  currentIds: string[],
  label: string,
) {
  const existing = await checked(supabase.from(tableName).select('id'), `read existing ${label}`) as Array<{ id: string }>;
  const current = new Set(currentIds.filter(Boolean));
  const staleIds = existing.map((row) => row.id).filter((id) => id && !current.has(id));
  if (staleIds.length) {
    await checked(supabase.from(tableName).delete().in('id', staleIds), `delete stale ${label}`);
  }
}

async function deleteStaleMapConfigs(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  currentVenueIds: string[],
) {
  const existing = await checked(supabase.from('VenueMapConfig').select('venueId'), 'read existing VenueMapConfig') as Array<{ venueId: string }>;
  const current = new Set(currentVenueIds.filter(Boolean));
  const staleVenueIds = existing.map((row) => row.venueId).filter((id) => id && !current.has(id));
  if (staleVenueIds.length) {
    await checked(supabase.from('VenueMapConfig').delete().in('venueId', staleVenueIds), 'delete stale VenueMapConfig');
  }
}

async function savePayloadBackup(supabase: ReturnType<typeof getSupabaseAdminClient>, payload: ConciergePayload) {
  try {
    await supabase.from('SiteSetting').upsert({
      key: 'concierge_payload_latest',
      value: {
        savedAt: new Date().toISOString(),
        venues: payload.venues.length,
        reservations: payload.reservations.length,
        customers: payload.customers.length,
        payload,
      },
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'key' });
  } catch {
    // Backup is best-effort and intentionally silent.
  }
}


function compactId(value: unknown, fallback: string) {
  const raw = String(value || fallback).trim();
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 86) || fallback;
}

function makeScopedId(
  venueId: string,
  rawId: unknown,
  prefix: string,
  index: number,
  used: Set<string>,
) {
  const venueKey = compactId(venueId, 'venue');
  const base = compactId(rawId, `${prefix}-${index + 1}`);
  const alreadyScoped = base.startsWith(`${venueKey}__`);
  const rawScoped = alreadyScoped ? base : `${venueKey}__${base}`;
  let candidate = rawScoped;
  let counter = 2;

  while (used.has(candidate)) {
    candidate = `${rawScoped}-${counter}`;
    counter += 1;
  }

  used.add(candidate);
  return candidate;
}

function numberOr(value: unknown, fallback: number, min = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, n);
}

function uniqueRowsById<T extends { id: string }>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (!row.id) continue;
    map.set(row.id, row);
  }
  return Array.from(map.values());
}

function uniqueRowsByVenueId<T extends { venueId: string }>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (!row.venueId) continue;
    map.set(row.venueId, row);
  }
  return Array.from(map.values());
}

export async function replaceAllData(payload: ConciergePayload) {
  const supabase = getSupabaseAdminClient();
  void savePayloadBackup(supabase, payload);

  const venueRows = payload.venues.map((venue) => ({
    id: venue.id,
    name: venue.name,
    slug: slugify(venue.name, venue.id),
    category: venue.category,
    address: venue.location,
    description: buildVenueDescription(venue),
  }));
  if (venueRows.length) {
    await checked(supabase.from('Venue').upsert(venueRows, { onConflict: 'id' }), 'upsert Venue');
  }

  const venueIds = payload.venues.map((venue) => venue.id).filter(Boolean);

  const images = payload.venues.flatMap((venue) => {
    const uniqueImages = Array.from(new Set([venue.image, ...(venue.images || [])].filter(Boolean)));
    return uniqueImages.map((imageUrl, index) => ({
      id: generateId('img', `${venue.id}-${index}`),
      imageUrl,
      venueId: venue.id,
    }));
  });
  if (images.length) await checked(supabase.from('VenueImage').upsert(images, { onConflict: 'id' }), 'upsert VenueImage');
  await deleteStaleRowsByVenue(supabase, 'VenueImage', images.map((row) => row.id), venueIds, 'VenueImage');

  const zoneIdsUsed = new Set<string>();
  const zoneIdMap = new Map<string, string>();
  const zones = uniqueRowsById(payload.venues.flatMap((venue) => (venue.tableZones || []).map((zone, index) => {
    const originalId = String(zone.id || `zone-${index + 1}`);
    const scopedId = makeScopedId(venue.id, originalId, 'zone', index, zoneIdsUsed);
    const mapKeys = [
      `${venue.id}::${originalId}`,
      `${venue.id}::${zone.name || ''}`,
      `${venue.id}::${zone.label || ''}`,
    ];
    for (const key of mapKeys) {
      if (key && !zoneIdMap.has(key)) zoneIdMap.set(key, scopedId);
    }

    return {
      id: scopedId,
      venueId: venue.id,
      name: zone.name || `Zone ${index + 1}`,
      label: zone.label || zone.name || `Zone ${index + 1}`,
      description: zone.description || null,
      minimumSpend: numberOr(zone.minimumSpend, 0),
      capacity: numberOr(zone.capacity, 1, 1),
      color: zone.color || '#D6A85F',
      sortOrder: Number(zone.order) || index + 1,
      isActive: zone.isActive !== false,
      updatedAt: new Date().toISOString(),
    };
  })));
  if (zones.length) await checked(supabase.from('VenueTableZone').upsert(zones, { onConflict: 'id' }), 'upsert VenueTableZone');
  await deleteStaleRowsByVenue(supabase, 'VenueTableZone', zones.map((row) => row.id), venueIds, 'VenueTableZone');

  const elementIdsUsed = new Set<string>();
  const mapElements = uniqueRowsById(payload.venues.flatMap((venue) => (venue.floorPlanElements || []).map((element, index) => ({
    id: makeScopedId(venue.id, element.id, 'element', index, elementIdsUsed),
    venueId: venue.id,
    type: element.type || 'CUSTOM',
    label: element.label || element.type || `Element ${index + 1}`,
    x: numberOr(element.x, 50),
    y: numberOr(element.y, 50),
    width: numberOr(element.width, 20, 2),
    height: numberOr(element.height, 5, 2),
    rotation: Number(element.rotation) || 0,
    color: element.color || '#D6A85F',
    sortOrder: Number(element.order) || index + 1,
    isActive: element.isActive !== false,
    updatedAt: new Date().toISOString(),
  }))));
  if (mapElements.length) await checked(supabase.from('VenueMapElement').upsert(mapElements, { onConflict: 'id' }), 'upsert VenueMapElement');
  await deleteStaleRowsByVenue(supabase, 'VenueMapElement', mapElements.map((row) => row.id), venueIds, 'VenueMapElement');

  const mapConfigs = uniqueRowsByVenueId(payload.venues.map((venue) => ({
    venueId: venue.id,
    style: venue.floorPlanTheme?.style || 'NIGHTCLUB',
    ratio: venue.floorPlanTheme?.ratio || 'PORTRAIT',
    backgroundColor: venue.floorPlanTheme?.backgroundColor || '#070A12',
    accentColor: venue.floorPlanTheme?.accentColor || '#D6A85F',
    surfaceColor: venue.floorPlanTheme?.surfaceColor || '#111827',
    gridColor: venue.floorPlanTheme?.gridColor || 'rgba(255,255,255,0.055)',
    texture: venue.floorPlanTheme?.texture || 'GRID',
    helperText: venue.floorPlanTheme?.helperText || null,
    showGrid: venue.floorPlanTheme?.showGrid !== false,
    updatedAt: new Date().toISOString(),
  })));
  if (mapConfigs.length) await checked(supabase.from('VenueMapConfig').upsert(mapConfigs, { onConflict: 'venueId' }), 'upsert VenueMapConfig');
  await deleteStaleMapConfigs(supabase, venueIds);

  const spotIdsUsed = new Set<string>();
  const spotIdMap = new Map<string, string>();
  const spots = uniqueRowsById(payload.venues.flatMap((venue) => (venue.preferredTables || []).map((spot, index) => {
    const originalId = String(spot.id || `spot-${index + 1}`);
    const scopedId = makeScopedId(venue.id, originalId, 'spot', index, spotIdsUsed);
    if (!spotIdMap.has(`${venue.id}::${originalId}`)) spotIdMap.set(`${venue.id}::${originalId}`, scopedId);
    if (spot.name && !spotIdMap.has(`${venue.id}::${spot.name}`)) spotIdMap.set(`${venue.id}::${spot.name}`, scopedId);

    const mappedZoneId = spot.zoneId
      ? zoneIdMap.get(`${venue.id}::${spot.zoneId}`) || spot.zoneId
      : zoneIdMap.get(`${venue.id}::${spot.area || ''}`) || null;

    return {
      id: scopedId,
      name: spot.name || `Table ${index + 1}`,
      description: spot.description || '',
      area: spot.area || 'VIP Area',
      zoneId: mappedZoneId,
      capacity: numberOr(spot.capacity, 1, 1),
      minimumSpend: numberOr(spot.minimumSpend, 0),
      status: spot.status || 'AVAILABLE',
      shape: spot.shape || 'RECT',
      bookingMode: spot.bookingMode || 'REQUEST',
      x: numberOr(spot.x, 20 + (index % 5) * 12),
      y: numberOr(spot.y, 22 + Math.floor(index / 5) * 8),
      width: numberOr(spot.width, 8, 1),
      height: numberOr(spot.height, 5, 1),
      rotation: Number(spot.rotation) || 0,
      color: spot.color || null,
      sortOrder: Number(spot.sortOrder) || index + 1,
      badge: spot.badge || 'NONE',
      venueId: venue.id,
    };
  })));
  if (spots.length) await checked(supabase.from('VenueSpot').upsert(spots, { onConflict: 'id' }), 'upsert VenueSpot');
  await deleteStaleRowsByVenue(supabase, 'VenueSpot', spots.map((row) => row.id), venueIds, 'VenueSpot');

  const customerMap = new Map<string, string>();
  const uniqueCustomers = new Map<string, Customer>();
  for (const customer of payload.customers) {
    const key = customer.phoneNumber?.replace(/\s+/g, '') || customer.fullName.toLowerCase();
    uniqueCustomers.set(key, customer);
  }
  for (const reservation of payload.reservations) {
    const key = reservation.phoneNumber?.replace(/\s+/g, '') || reservation.fullName.toLowerCase();
    if (!uniqueCustomers.has(key)) {
      uniqueCustomers.set(key, {
        id: `cust-${reservation.id}`,
        fullName: reservation.fullName,
        phoneNumber: reservation.phoneNumber || '',
        notes: reservation.notes || 'Created from reservation request.',
        vipStatus: 'VIP' as Customer['vipStatus'],
        favoriteVenueIds: [reservation.venueId],
        createdAt: reservation.createdAt || new Date().toISOString(),
      });
    }
  }

  const customers = Array.from(uniqueCustomers.values());
  const customerRows = customers.map((customer) => {
    const key = customer.phoneNumber?.replace(/\s+/g, '') || customer.fullName.toLowerCase();
    customerMap.set(key, customer.id);
    return {
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phoneNumber || null,
      email: null,
    };
  });
  if (customerRows.length) await checked(supabase.from('Customer').upsert(customerRows, { onConflict: 'id' }), 'upsert Customer');

  const validVenueIds = new Set(payload.venues.map((venue) => venue.id));
  const validSpotIds = new Set(spots.map((spot) => spot.id));
  const bookings = payload.reservations
    .filter((reservation) => validVenueIds.has(reservation.venueId))
    .map((reservation) => {
      const key = reservation.phoneNumber?.replace(/\s+/g, '') || reservation.fullName.toLowerCase();
      const customerId = customerMap.get(key) || `cust-${reservation.id}`;
      return {
        id: reservation.id,
        bookingDate: buildBookingDate(reservation.date, reservation.arrivalTime),
        guestCount: Number(reservation.guestCount) || 1,
        status: uiStatusToDb(reservation.status),
        notes: encodeBookingNotes(reservation.notes),
        customerId,
        venueId: reservation.venueId,
        spotId: (() => {
          const mappedSpotId = reservation.preferredTableId
            ? spotIdMap.get(`${reservation.venueId}::${reservation.preferredTableId}`) || reservation.preferredTableId
            : '';
          return mappedSpotId && validSpotIds.has(mappedSpotId) ? mappedSpotId : null;
        })(),
      };
    });
  if (bookings.length) await checked(supabase.from('Booking').upsert(bookings, { onConflict: 'id' }), 'upsert Booking');
  await deleteStaleRowsById(supabase, 'Booking', bookings.map((booking) => booking.id), 'Booking');

  const contacts = payload.reservations
    .filter((reservation) => bookings.some((booking) => booking.id === reservation.id))
    .map((reservation) => ({
      id: generateId('contact', reservation.id),
      channel: reservation.source === 'Web Form' ? 'MANUAL' : reservation.source === 'Telegram' ? 'LINE' : reservation.source === 'Zalo' ? 'WECHAT' : reservation.source.toUpperCase(),
      messagePreview: reservation.notes || null,
      bookingId: reservation.id,
    }));
  const uniqueContacts = uniqueRowsById(contacts);
  if (uniqueContacts.length) await checked(supabase.from('BookingContact').upsert(uniqueContacts, { onConflict: 'id' }), 'upsert BookingContact');

  await deleteStaleRowsById(supabase, 'Customer', customerRows.map((customer) => customer.id), 'Customer');
  await deleteStaleRowsById(supabase, 'Venue', venueRows.map((venue) => venue.id), 'Venue');
  invalidateConciergeCache();
}

function sourceToChannel(source: ReservationRequest['source']) {
  if (source === 'Web Form') return 'MANUAL';
  if (source === 'Telegram') return 'LINE';
  if (source === 'Zalo') return 'WECHAT';
  return source.toUpperCase();
}

function scopedSpotId(venueId: string, spotId: string) {
  const raw = compactId(spotId, 'spot');
  const venueKey = compactId(venueId, 'venue');
  return raw.startsWith(`${venueKey}__`) ? raw : `${venueKey}__${raw}`;
}

export async function customerExistsFast(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const row = await checked(
    supabase.from('Customer').select('id').eq('id', id).maybeSingle(),
    'read Customer existence',
  ) as { id: string } | null;
  return Boolean(row);
}

export async function customerHasBookingsFast(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const rows = await checked(
    supabase.from('Booking').select('id').eq('customerId', id).limit(1),
    'read Customer bookings',
  ) as Array<{ id: string }>;
  return rows.length > 0;
}

export async function upsertCustomerFast(customer: Customer): Promise<Customer> {
  const supabase = getSupabaseAdminClient();
  await checked(supabase.from('Customer').upsert({
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phoneNumber || null,
    email: null,
  }, { onConflict: 'id' }), 'upsert Customer');
  invalidateConciergeCache();
  return customer;
}

export async function deleteCustomerFast(id: string) {
  const supabase = getSupabaseAdminClient();
  await checked(supabase.from('Customer').delete().eq('id', id), 'delete Customer');
  invalidateConciergeCache();
}

export async function upsertReservationFast(
  reservation: ReservationRequest,
  current: ConciergePayload,
): Promise<ReservationRequest> {
  const supabase = getSupabaseAdminClient();
  const phoneKey = reservation.phoneNumber.replace(/[\s.()-]/g, '');
  const customer = current.customers.find((item) => item.phoneNumber.replace(/[\s.()-]/g, '') === phoneKey);
  const customerId = customer?.id || `cust-${compactId(phoneKey || reservation.id, reservation.id)}`;

  await checked(supabase.from('Customer').upsert({
    id: customerId,
    fullName: reservation.fullName,
    phone: reservation.phoneNumber || null,
    email: null,
  }, { onConflict: 'id' }), 'upsert Customer');

  const venue = current.venues.find((item) => item.id === reservation.venueId);
  const selectedTable = venue?.preferredTables.find(
    (item) => item.id === reservation.preferredTableId || item.name === reservation.preferredTableName,
  );
  const rawSpotId = selectedTable?.id || reservation.preferredTableId || '';
  const spotId = rawSpotId ? scopedSpotId(reservation.venueId, rawSpotId) : null;

  await checked(supabase.from('Booking').upsert({
    id: reservation.id,
    bookingDate: buildBookingDate(reservation.date, reservation.arrivalTime),
    guestCount: Number(reservation.guestCount) || 1,
    status: uiStatusToDb(reservation.status),
    notes: encodeBookingNotes(reservation.notes),
    customerId,
    venueId: reservation.venueId,
    spotId,
  }, { onConflict: 'id' }), 'upsert Booking');

  await checked(supabase.from('BookingContact').upsert({
    id: generateId('contact', reservation.id),
    channel: sourceToChannel(reservation.source),
    messagePreview: reservation.notes || null,
    bookingId: reservation.id,
  }, { onConflict: 'id' }), 'upsert BookingContact');

  invalidateConciergeCache();
  return {
    ...reservation,
    preferredTableId: rawSpotId,
    preferredTableName: selectedTable?.name || reservation.preferredTableName,
    preferredTableArea: selectedTable?.area || reservation.preferredTableArea,
    preferredTableMinimumSpend: selectedTable?.minimumSpend || reservation.preferredTableMinimumSpend,
    preferredTableColor: selectedTable?.color || reservation.preferredTableColor,
    preferredTableCapacity: selectedTable?.capacity || reservation.preferredTableCapacity,
  };
}

export async function updateReservationStatusFast(id: string, status: BookingStatus) {
  const supabase = getSupabaseAdminClient();
  const rows = await checked(
    supabase.from('Booking').update({ status: uiStatusToDb(status) }).eq('id', id).select('id'),
    'update Booking status',
  ) as Array<{ id: string }>;
  if (!rows.length) throw new Error('Booking not found');
  invalidateConciergeCache();
}

export async function deleteReservationFast(id: string) {
  const supabase = getSupabaseAdminClient();
  await checked(supabase.from('BookingContact').delete().eq('bookingId', id), 'delete BookingContact');
  await checked(supabase.from('Booking').delete().eq('id', id), 'delete Booking');
  invalidateConciergeCache();
}

async function syncVenueRows(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  tableName: string,
  rows: Array<Record<string, unknown> & { id: string }>,
  venueId: string,
  label: string,
) {
  if (rows.length) await checked(supabase.from(tableName).upsert(rows, { onConflict: 'id' }), `upsert ${label}`);
  await deleteStaleRowsByVenue(supabase, tableName, rows.map((row) => row.id), [venueId], label);
}

export async function venueExistsFast(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const row = await checked(
    supabase.from('Venue').select('id').eq('id', id).maybeSingle(),
    'read Venue existence',
  ) as { id: string } | null;
  return Boolean(row);
}

export async function venueHasBookingsFast(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const rows = await checked(
    supabase.from('Booking').select('id').eq('venueId', id).limit(1),
    'read Venue bookings',
  ) as Array<{ id: string }>;
  return rows.length > 0;
}

export async function deleteVenueFast(id: string) {
  const supabase = getSupabaseAdminClient();
  await Promise.all([
    checked(supabase.from('VenueImage').delete().eq('venueId', id), 'delete VenueImage'),
    checked(supabase.from('VenueSpot').delete().eq('venueId', id), 'delete VenueSpot'),
    checked(supabase.from('VenueMapElement').delete().eq('venueId', id), 'delete VenueMapElement'),
    checked(supabase.from('VenueMapConfig').delete().eq('venueId', id), 'delete VenueMapConfig'),
    checked(supabase.from('VenueTableZone').delete().eq('venueId', id), 'delete VenueTableZone'),
  ]);
  await checked(supabase.from('Venue').delete().eq('id', id), 'delete Venue');
  invalidateConciergeCache();
}

export async function incrementVenueViewCountFast(id: string) {
  const supabase = getSupabaseAdminClient();
  const row = await checked(
    supabase.from('Venue').select('id,description').eq('id', id).maybeSingle(),
    'read Venue view count',
  ) as { id: string; description?: string | null } | null;
  if (!row) throw new Error('Venue not found');

  const descriptions = splitDescription(row.description);
  const currentMeta = descriptions.meta || {};
  const description = buildVenueDescription({
    id,
    name: '',
    category: 'Nightclub',
    location: '',
    shortDescription: descriptions.shortDescription,
    longDescription: descriptions.longDescription,
    image: '',
    images: [],
    videoUrl: descriptions.videoUrl || undefined,
    reels: descriptions.reels || [],
    menuUrl: String(currentMeta.menuUrl || ''),
    menuPdfUrl: String(currentMeta.menuPdfUrl || ''),
    openingHours: (currentMeta.openingHours as Venue['openingHours']) || { open: '18:00', close: '02:00', label: '18:00 - 02:00' },
    viewCount: Math.max(0, Math.floor(Number(currentMeta.viewCount || 0))) + 1,
    preferredTables: [],
    rating: Number(currentMeta.rating) || 4.8,
    reviewsCount: Math.max(0, Number(currentMeta.reviewsCount || 0)),
  } as Venue);

  await checked(supabase.from('Venue').update({ description }).eq('id', id), 'update Venue view count');
  invalidateConciergeCache();
  return Math.max(0, Math.floor(Number(currentMeta.viewCount || 0))) + 1;
}

export async function upsertVenueFast(venue: Venue): Promise<Venue> {
  const supabase = getSupabaseAdminClient();
  await checked(supabase.from('Venue').upsert({
    id: venue.id,
    name: venue.name,
    slug: slugify(venue.name, venue.id),
    category: venue.category,
    address: venue.location,
    description: buildVenueDescription(venue),
  }, { onConflict: 'id' }), 'upsert Venue');

  const images = Array.from(new Set([venue.image, ...(venue.images || [])].filter(Boolean))).map((imageUrl, index) => ({
    id: generateId('img', `${venue.id}-${index}`),
    imageUrl,
    venueId: venue.id,
  }));

  const zoneIdsUsed = new Set<string>();
  const zoneIdMap = new Map<string, string>();
  const zones = uniqueRowsById((venue.tableZones || []).map((zone, index) => {
    const originalId = String(zone.id || `zone-${index + 1}`);
    const id = makeScopedId(venue.id, originalId, 'zone', index, zoneIdsUsed);
    for (const key of [originalId, zone.name || '', zone.label || '']) {
      if (key) zoneIdMap.set(key, id);
    }
    return {
      id,
      venueId: venue.id,
      name: zone.name || `Zone ${index + 1}`,
      label: zone.label || zone.name || `Zone ${index + 1}`,
      description: zone.description || null,
      minimumSpend: numberOr(zone.minimumSpend, 0),
      capacity: numberOr(zone.capacity, 1, 1),
      color: zone.color || '#D6A85F',
      sortOrder: Number(zone.order) || index + 1,
      isActive: zone.isActive !== false,
      updatedAt: new Date().toISOString(),
    };
  }));

  const elementIdsUsed = new Set<string>();
  const mapElements = uniqueRowsById((venue.floorPlanElements || []).map((element, index) => ({
    id: makeScopedId(venue.id, element.id, 'element', index, elementIdsUsed),
    venueId: venue.id,
    type: element.type || 'CUSTOM',
    label: element.label || element.type || `Element ${index + 1}`,
    x: numberOr(element.x, 50),
    y: numberOr(element.y, 50),
    width: numberOr(element.width, 20, 2),
    height: numberOr(element.height, 5, 2),
    rotation: Number(element.rotation) || 0,
    color: element.color || '#D6A85F',
    sortOrder: Number(element.order) || index + 1,
    isActive: element.isActive !== false,
    updatedAt: new Date().toISOString(),
  })));

  const mapConfig = {
    venueId: venue.id,
    style: venue.floorPlanTheme?.style || 'NIGHTCLUB',
    ratio: venue.floorPlanTheme?.ratio || 'PORTRAIT',
    backgroundColor: venue.floorPlanTheme?.backgroundColor || '#070A12',
    accentColor: venue.floorPlanTheme?.accentColor || '#D6A85F',
    surfaceColor: venue.floorPlanTheme?.surfaceColor || '#111827',
    gridColor: venue.floorPlanTheme?.gridColor || 'rgba(255,255,255,0.055)',
    texture: venue.floorPlanTheme?.texture || 'GRID',
    helperText: venue.floorPlanTheme?.helperText || null,
    showGrid: venue.floorPlanTheme?.showGrid !== false,
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    syncVenueRows(supabase, 'VenueImage', images, venue.id, 'VenueImage'),
    syncVenueRows(supabase, 'VenueTableZone', zones, venue.id, 'VenueTableZone'),
    syncVenueRows(supabase, 'VenueMapElement', mapElements, venue.id, 'VenueMapElement'),
    checked(supabase.from('VenueMapConfig').upsert(mapConfig, { onConflict: 'venueId' }), 'upsert VenueMapConfig'),
  ]);

  const spotIdsUsed = new Set<string>();
  const spots = uniqueRowsById((venue.preferredTables || []).map((spot, index) => ({
    id: makeScopedId(venue.id, spot.id, 'spot', index, spotIdsUsed),
    name: spot.name || `Table ${index + 1}`,
    description: spot.description || '',
    area: spot.area || 'VIP Area',
    zoneId: spot.zoneId ? zoneIdMap.get(spot.zoneId) || scopedSpotId(venue.id, spot.zoneId) : zoneIdMap.get(spot.area || '') || null,
    capacity: numberOr(spot.capacity, 1, 1),
    minimumSpend: numberOr(spot.minimumSpend, 0),
    status: spot.status || 'AVAILABLE',
    shape: spot.shape || 'RECT',
    bookingMode: spot.bookingMode || 'REQUEST',
    x: numberOr(spot.x, 20 + (index % 5) * 12),
    y: numberOr(spot.y, 22 + Math.floor(index / 5) * 8),
    width: numberOr(spot.width, 8, 1),
    height: numberOr(spot.height, 5, 1),
    rotation: Number(spot.rotation) || 0,
    color: spot.color || null,
    sortOrder: Number(spot.sortOrder) || index + 1,
    badge: spot.badge || 'NONE',
    venueId: venue.id,
  })));
  await syncVenueRows(supabase, 'VenueSpot', spots, venue.id, 'VenueSpot');

  invalidateConciergeCache();
  return venue;
}

async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const supabase = getSupabaseAdminClient();
    const venues = await checked(supabase.from('Venue').select('id,name').order('createdAt', { ascending: true }).limit(10), 'count Venue');
    const legacyDefaultNames = new Set(['The Obsidian Club', 'Azure Deck', 'The Gilded Room']);
    const venueRows = (venues || []) as Array<{ name?: string }>;
    const isLegacyDemo = Boolean(venueRows.length) && venueRows.every((venue) => legacyDefaultNames.has(String(venue.name || '')));

    if (!venueRows.length || isLegacyDemo) {
      await replaceAllData({
        venues: INITIAL_VENUES,
        customers: INITIAL_CUSTOMERS,
        reservations: INITIAL_RESERVATIONS,
      });
    }
  })().catch((error) => {
    seedPromise = null;
    throw error;
  });
  return seedPromise;
}

export async function readAllData(): Promise<ConciergePayload> {
  if (dataCache && dataCache.expiresAt > Date.now()) return dataCache.value;
  const supabase = getSupabaseAdminClient();
  await ensureSeeded();

  const [venuesDb, imagesDb, zonesDb, mapElementsDb, mapConfigsDb, spotsDb, customersDb, bookingsDb, contactsDb] = await Promise.all([
    checked(supabase.from('Venue').select('*').order('createdAt', { ascending: true }), 'read Venue'),
    checked(supabase.from('VenueImage').select('*'), 'read VenueImage'),
    checked(supabase.from('VenueTableZone').select('*').order('sortOrder', { ascending: true }), 'read VenueTableZone'),
    checked(supabase.from('VenueMapElement').select('*').order('sortOrder', { ascending: true }), 'read VenueMapElement'),
    checked(supabase.from('VenueMapConfig').select('*'), 'read VenueMapConfig'),
    checked(supabase.from('VenueSpot').select('*').order('sortOrder', { ascending: true }), 'read VenueSpot'),
    checked(supabase.from('Customer').select('*').order('createdAt', { ascending: true }), 'read Customer'),
    checked(supabase.from('Booking').select('*').order('createdAt', { ascending: false }), 'read Booking'),
    checked(supabase.from('BookingContact').select('*').order('sentAt', { ascending: false }), 'read BookingContact'),
  ]) as [DbVenue[], DbVenueImage[], DbVenueTableZone[], DbVenueMapElement[], DbVenueMapConfig[], DbVenueSpot[], DbCustomer[], DbBooking[], DbBookingContact[]];

  const imagesByVenue = new Map<string, DbVenueImage[]>();
  for (const image of imagesDb) {
    const list = imagesByVenue.get(image.venueId) || [];
    list.push(image);
    imagesByVenue.set(image.venueId, list);
  }

  const zonesByVenue = new Map<string, DbVenueTableZone[]>();
  for (const zone of zonesDb) {
    const list = zonesByVenue.get(zone.venueId) || [];
    list.push(zone);
    zonesByVenue.set(zone.venueId, list);
  }

  const mapElementsByVenue = new Map<string, DbVenueMapElement[]>();
  for (const element of mapElementsDb) {
    const list = mapElementsByVenue.get(element.venueId) || [];
    list.push(element);
    mapElementsByVenue.set(element.venueId, list);
  }

  const mapConfigByVenue = new Map<string, DbVenueMapConfig>();
  for (const config of mapConfigsDb) {
    mapConfigByVenue.set(config.venueId, config);
  }

  const spotsByVenue = new Map<string, DbVenueSpot[]>();
  for (const spot of spotsDb) {
    const list = spotsByVenue.get(spot.venueId) || [];
    list.push(spot);
    spotsByVenue.set(spot.venueId, list);
  }

  const venueById = new Map(venuesDb.map((venue) => [venue.id, venue]));
  const customerById = new Map(customersDb.map((customer) => [customer.id, customer]));
  const spotById = new Map(spotsDb.map((spot) => [spot.id, spot]));
  const latestContactByBooking = new Map<string, DbBookingContact>();
  for (const contact of contactsDb) {
    if (!latestContactByBooking.has(contact.bookingId)) latestContactByBooking.set(contact.bookingId, contact);
  }

  const bookingsByCustomer = new Map<string, DbBooking[]>();
  const bookingsByVenue = new Map<string, DbBooking[]>();
  for (const booking of bookingsDb) {
    const customerList = bookingsByCustomer.get(booking.customerId) || [];
    customerList.push(booking);
    bookingsByCustomer.set(booking.customerId, customerList);
    const venueList = bookingsByVenue.get(booking.venueId) || [];
    venueList.push(booking);
    bookingsByVenue.set(booking.venueId, venueList);
  }

  const venues: Venue[] = venuesDb.map((venue) => {
    const descriptions = splitDescription(venue.description);
    const images = (imagesByVenue.get(venue.id) || []).map((image) => image.imageUrl);
    const venueBookings = bookingsByVenue.get(venue.id) || [];
    return {
      id: venue.id,
      name: venue.name,
      category: (venue.category || 'Nightclub') as Venue['category'],
      location: venue.address || '',
      shortDescription: descriptions.shortDescription,
      longDescription: descriptions.longDescription,
      image: images[0] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
      images: images.slice(1),
      videoUrl: descriptions.videoUrl || undefined,
      reels: descriptions.reels?.map((reel, index) => ({ ...reel, venueId: reel.venueId || venue.id, order: Number(reel.order) || index + 1 })) || [],
      menuUrl: String(descriptions.meta?.menuUrl || ''),
      menuPdfUrl: String(descriptions.meta?.menuPdfUrl || ''),
      openingHours: (() => {
        const hours = descriptions.meta?.openingHours as Venue['openingHours'];
        if (hours?.open && hours?.close) return hours;
        return { open: '18:00', close: '02:00', label: '18:00 - 02:00' };
      })(),
      viewCount: Math.max(0, Number(descriptions.meta?.viewCount || 0)),
      floorPlanTheme: (() => {
        const config = mapConfigByVenue.get(venue.id);
        return config ? {
          style: config.style || 'NIGHTCLUB',
          ratio: config.ratio || 'PORTRAIT',
          backgroundColor: config.backgroundColor || '#070A12',
          accentColor: config.accentColor || '#D6A85F',
          surfaceColor: config.surfaceColor || '#111827',
          gridColor: config.gridColor || 'rgba(255,255,255,0.055)',
          texture: config.texture || 'GRID',
          helperText: config.helperText || '',
          showGrid: config.showGrid !== false,
        } : undefined;
      })(),
      floorPlanElements: (mapElementsByVenue.get(venue.id) || []).map((element, index) => ({
        id: element.id,
        type: element.type || 'CUSTOM',
        label: element.label || element.type || `Element ${index + 1}`,
        x: Number(element.x) || 50,
        y: Number(element.y) || 50,
        width: Number(element.width) || 20,
        height: Number(element.height) || 5,
        rotation: Number(element.rotation) || 0,
        color: element.color || '#D6A85F',
        order: Number(element.sortOrder) || index + 1,
        isActive: element.isActive !== false,
      })),
      tableZones: (zonesByVenue.get(venue.id) || []).map((zone, index) => ({
        id: zone.id,
        name: zone.name || `Zone ${index + 1}`,
        label: zone.label || zone.name || `Zone ${index + 1}`,
        description: zone.description || '',
        minimumSpend: Number(zone.minimumSpend) || 0,
        capacity: Number(zone.capacity) || 1,
        color: zone.color || '#D6A85F',
        order: Number(zone.sortOrder) || index + 1,
        isActive: zone.isActive !== false,
      })),
      preferredTables: (spotsByVenue.get(venue.id) || []).map((spot, index) => {
        const legacyParts = String(spot.description || '').split('—');
        const legacyArea = legacyParts.length > 1 ? legacyParts[0].trim() : 'VIP Area';
        const legacyDescription = legacyParts.length > 1 ? legacyParts.slice(1).join('—').trim() : spot.description || '';
        return {
          id: spot.id,
          name: spot.name,
          area: spot.area || legacyArea,
          zoneId: spot.zoneId || undefined,
          minimumSpend: Number(spot.minimumSpend) || 0,
          capacity: Number(spot.capacity) || 2,
          description: legacyDescription,
          status: spot.status || 'AVAILABLE',
          shape: spot.shape || 'RECT',
          bookingMode: spot.bookingMode || 'REQUEST',
          x: Number(spot.x) || 20 + (index % 5) * 12,
          y: Number(spot.y) || 22 + Math.floor(index / 5) * 8,
          width: Number(spot.width) || 8,
          height: Number(spot.height) || 5,
          rotation: Number(spot.rotation) || 0,
          color: spot.color || undefined,
          sortOrder: Number(spot.sortOrder) || index + 1,
          badge: spot.badge || 'NONE',
        };
      }),
      rating: Number(descriptions.meta?.rating) || 4.8,
      reviewsCount: Math.max(0, Number(descriptions.meta?.reviewsCount ?? Math.max(venueBookings.length * 7, 1))),
    };
  });

  const customers: Customer[] = customersDb.map((customer) => {
    const customerBookings = bookingsByCustomer.get(customer.id) || [];
    return {
      id: customer.id,
      fullName: customer.fullName,
      phoneNumber: customer.phone || '',
      notes: decodeBookingNotes(customerBookings[0]?.notes) || 'Hồ sơ khách được đồng bộ từ Supabase.',
      vipStatus: customerBookings.length >= 3 ? 'ELITE' : customerBookings.length >= 2 ? 'VVIP' : 'VIP',
      favoriteVenueIds: Array.from(new Set(customerBookings.map((booking) => booking.venueId))),
      createdAt: customer.createdAt || new Date().toISOString(),
    } as Customer;
  });

  const reservations: ReservationRequest[] = bookingsDb.map((booking) => {
    const venue = venueById.get(booking.venueId);
    const customer = customerById.get(booking.customerId);
    const spot = booking.spotId ? spotById.get(booking.spotId) : null;
    const contact = latestContactByBooking.get(booking.id);
    const bookingParts = parseBookingStorageDateTime(booking.bookingDate, booking.notes);
    return {
      id: booking.id,
      venueId: booking.venueId,
      venueName: venue?.name || 'Địa điểm chưa xác định',
      fullName: customer?.fullName || 'Khách chưa xác định',
      phoneNumber: customer?.phone || '',
      guestCount: Number(booking.guestCount) || 1,
      date: bookingParts?.date || '',
      arrivalTime: bookingParts?.time || '',
      preferredTableId: booking.spotId || '',
      preferredTableName: spot?.name || 'Bàn VIP',
      preferredTableArea: spot?.area || undefined,
      preferredTableMinimumSpend: Number(spot?.minimumSpend) || undefined,
      preferredTableColor: spot?.color || undefined,
      preferredTableCapacity: Number(spot?.capacity) || undefined,
      notes: decodeBookingNotes(booking.notes),
      status: dbStatusToUi(String(booking.status)),
      createdAt: booking.createdAt || new Date().toISOString(),
      source: contact?.channel === 'INSTAGRAM' ? 'Instagram' : contact?.channel === 'WHATSAPP' ? 'WhatsApp' : contact?.channel === 'LINE' ? 'Telegram' : contact?.channel === 'WECHAT' ? 'Zalo' : 'Web Form',
    };
  });

  const payload = { venues, customers, reservations };
  dataCache = { value: payload, expiresAt: Date.now() + READ_CACHE_TTL_MS };
  return payload;
}
