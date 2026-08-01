'use client';

import { enableAdminPush } from "@/lib/admin-push-client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  createCustomerOnServer,
  createReservationOnServer,
  createVenueOnServer,
  deleteCustomerOnServer,
  deleteReservationOnServer,
  deleteVenueOnServer,
  loadData,
  loadDataFromServer,
  saveCustomers,
  saveDataToServer,
  saveReservations,
  saveVenues,
  updateCustomerOnServer,
  updateReservationOnServer,
  updateVenueOnServer,
} from '@/components/aurelius/data';
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromServer,
  loadSiteSettingsLocal,
  saveSiteSettingsLocal,
  saveSiteSettingsToServer,
  type SiteSettings,
} from '@/components/aurelius/siteSettings';
import { getSupabaseBrowserClient } from '@/components/aurelius/supabaseBrowser';
import { BookingStatus, VipStatus, type Customer, type HomepageReel, type ReservationRequest, type Venue } from '@/components/aurelius/types';
import { getStatusTransitionDecision, validateCustomer, validateReservation, validateVenueUpdate } from '@/lib/booking-rules';
import { databaseTimestampMs, reservationEventIso, reservationEventTimestamp } from '@/lib/date-time';
import { disableAdminPush } from '@/lib/admin-push-client';
import type { AdminNotification, ConciergePayload, ToastMessage } from './types';
import { normalizePhone, slugId } from './utils';
import { ToastHost } from './ui/ToastHost';
import { isContactNotification } from './notification-utils';


interface AdminContextValue {
  venues: Venue[];
  reservations: ReservationRequest[];
  customers: Customer[];
  settings: SiteSettings;
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  saving: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  refresh: () => Promise<void>;
  saveReservation: (reservation: ReservationRequest) => Promise<void>;
  updateReservationStatus: (id: string, status: BookingStatus) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  saveCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  saveVenue: (venue: Venue) => Promise<void>;
  saveVenueReels: (venueId: string, reels: HomepageReel[]) => Promise<HomepageReel[]>;
  reorderReels: (ordered: Array<{ venueId: string; reelId: string }>) => Promise<void>;
  deleteVenue: (id: string) => Promise<void>;
  replaceData: (payload: ConciergePayload) => Promise<void>;
  resetData: () => Promise<void>;
  saveSettings: (settings: SiteSettings) => Promise<SiteSettings>;
  uploadMedia: (file: File, folder: string, oldPath?: string) => Promise<{ url: string; path: string; posterUrl?: string }>;
  deleteMedia: (path?: string) => Promise<void>;
  markNotificationsRead: (ids?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  showToast: (kind: ToastMessage['kind'], message: string) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);
const REALTIME_DISABLED = process.env.NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME === 'false';
const REALTIME_TABLES = new Set([
  'Booking', 'BookingContact', 'Reservation', 'ReservationRequest', 'Customer', 'Venue', 'VenueImage',
  'VenueSpot', 'VenueTableZone', 'VenueMapElement', 'VenueMapConfig', 'VenueReel', 'Reel', 'SiteSetting',
  'AdminNotification', 'bookings', 'booking_contacts', 'reservations', 'customers', 'venues', 'venue_images',
  'venue_spots', 'venue_table_zones', 'venue_map_elements', 'venue_map_configs', 'venue_reels', 'reels',
  'site_settings', 'admin_notifications',
]);

function buildNotification(reservation: ReservationRequest, read = false): AdminNotification {
  return {
    id: `booking-${reservation.id}`,
    reservationId: reservation.id,
    title: `Booking mới · ${reservation.fullName}`,
    message: `${reservation.venueName} · ${reservation.preferredTableName || 'Chưa chọn bàn'} · ${reservation.guestCount} khách · ${reservation.date} ${reservation.arrivalTime}`,
    createdAt: reservationEventIso(reservation),
    read,
    tableColor: reservation.preferredTableColor,
  };
}

function notificationTimestamp(notice: AdminNotification, reservation?: ReservationRequest) {
  return reservation ? reservationEventTimestamp(reservation) : databaseTimestampMs(notice.createdAt);
}

/**
 * One booking must produce exactly one row in the UI. Some older databases
 * contain both an application notification and a trigger notification for the
 * same reservation. We collapse them by reservationId and rebuild booking
 * details from the current reservation so stale 12:00 UTC text can never leak
 * into the admin UI.
 */
function normalizeNotifications(notices: AdminNotification[], reservations: ReservationRequest[]) {
  const reservationById = new Map(reservations.map((reservation) => [reservation.id, reservation]));
  const grouped = new Map<string, AdminNotification[]>();

  for (const notice of notices) {
    const key = notice.reservationId || notice.id;
    const list = grouped.get(key) || [];
    list.push(notice);
    grouped.set(key, list);
  }

  const normalized: AdminNotification[] = [];
  for (const [reservationId, group] of grouped) {
    const reservation = reservationById.get(reservationId);
    if (reservation) {
      const canonical = buildNotification(reservation, group.every((notice) => notice.read));
      const preferred = group.find((notice) => notice.id === canonical.id) || group[0];
      normalized.push({ ...canonical, id: preferred?.id || canonical.id });
    } else {
      const newest = [...group].sort((a, b) => databaseTimestampMs(b.createdAt) - databaseTimestampMs(a.createdAt))[0];
      if (newest) normalized.push({ ...newest, read: group.every((notice) => notice.read) });
    }
  }

  for (const reservation of reservations) {
    if (!grouped.has(reservation.id)) normalized.push(buildNotification(reservation));
  }

  return normalized
    .sort((a, b) => notificationTimestamp(b, reservationById.get(b.reservationId)) - notificationTimestamp(a, reservationById.get(a.reservationId)))
    .slice(0, 200);
}

function synthesizeNotifications(reservations: ReservationRequest[]) {
  return normalizeNotifications([], reservations).slice(0, 100);
}

async function loadAdminNotifications() {
  const response = await fetch('/api/admin-notifications?limit=150', { cache: 'no-store' });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok || !Array.isArray(json.notifications)) {
    throw new Error(json?.error || 'Không tải được thông báo quản trị.');
  }
  return json.notifications as AdminNotification[];
}

function playBell() {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const gain = context.createGain();
    const osc = context.createOscillator();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
    osc.frequency.setValueAtTime(880, context.currentTime);
    osc.frequency.setValueAtTime(1175, context.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.55);
    window.setTimeout(() => context.close().catch(() => undefined), 800);
  } catch {
    // Trình duyệt có thể chặn âm thanh trước tương tác đầu tiên.
  }
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const knownReservations = useRef<Set<string>>(new Set());
  const knownNotifications = useRef<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const refreshTimer = useRef<number | null>(null);
  const notificationRefreshTimer = useRef<number | null>(null);
  const localPersistTimer = useRef<number | null>(null);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const notificationRefreshInFlight = useRef<Promise<void> | null>(null);
  const lastRefreshAt = useRef(0);
  const lastMutationAt = useRef(0);
  const lastReportedErrorAt = useRef(0);

  const showToast = useCallback((kind: ToastMessage['kind'], message: string) => {
    const next = { id: Date.now(), kind, message };
    setToast(next);
    window.setTimeout(() => setToast((current) => current?.id === next.id ? null : current), 3600);
  }, []);


  const applyNotificationPayload = useCallback((rawNotices: AdminNotification[], currentReservations: ReservationRequest[], notifyNew = false) => {
    const normalized = normalizeNotifications(rawNotices, currentReservations);
    const newContactNotices = notifyNew
      ? normalized.filter((notice) => isContactNotification(notice) && !knownNotifications.current.has(notice.id))
      : [];

    setNotifications(normalized);
    knownNotifications.current = new Set(normalized.map((notice) => notice.id));

    if (newContactNotices.length) {
      playBell();
      const first = newContactNotices[0];
      const name = first.title.replace(/^Liên hệ mới\s*·\s*/i, '').trim();
      showToast('info', newContactNotices.length === 1
        ? `Có yêu cầu liên hệ mới${name ? ` từ ${name}` : ''}.`
        : `Có ${newContactNotices.length} yêu cầu liên hệ mới.`);
    }
  }, [showToast]);

  const persistLocalSoon = useCallback((payload: ConciergePayload) => {
    if (localPersistTimer.current) window.clearTimeout(localPersistTimer.current);
    localPersistTimer.current = window.setTimeout(() => {
      saveVenues(payload.venues);
      saveReservations(payload.reservations);
      saveCustomers(payload.customers);
      localPersistTimer.current = null;
    }, 40);
  }, []);

  const reportSyncError = useCallback((label: string, error: unknown) => {
    if (process.env.NODE_ENV !== 'development') return;
    const now = Date.now();
    if (now - lastReportedErrorAt.current < 30_000) return;
    lastReportedErrorAt.current = now;
    console.warn(`[Admin] ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }, []);

  const applyPayload = useCallback((payload: ConciergePayload, notifyNew = false, persistLocal = false) => {
    const newBookings = notifyNew
      ? payload.reservations.filter((reservation) => !knownReservations.current.has(reservation.id))
      : [];

    setVenues(payload.venues);
    setReservations(payload.reservations);
    setCustomers(payload.customers);
    if (persistLocal) persistLocalSoon(payload);
    knownReservations.current = new Set(payload.reservations.map((reservation) => reservation.id));

    const newNotices = newBookings.map((reservation) => buildNotification(reservation));
    setNotifications((current) => normalizeNotifications([...newNotices, ...current], payload.reservations));

    if (newBookings.length) {
      playBell();
      showToast('info', `Có ${newBookings.length} booking mới cần xử lý.`);
      fetch('/api/admin-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: newNotices }),
      }).catch(() => undefined);
    }
  }, [persistLocalSoon, showToast]);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return refreshInFlight.current;
    if (Date.now() - lastRefreshAt.current < 1_500) return;
    const task = (async () => {
      try {
        const payload = await loadDataFromServer();
        applyPayload(payload, true, false);
        lastRefreshAt.current = Date.now();
      } catch (error) {
        reportSyncError('Không thể làm mới dữ liệu', error);
      } finally {
        refreshInFlight.current = null;
      }
    })();
    refreshInFlight.current = task;
    return task;
  }, [applyPayload, reportSyncError]);

  const refreshNotifications = useCallback(async (notifyNew = true, reservationSnapshot?: ReservationRequest[]) => {
    if (notificationRefreshInFlight.current) return notificationRefreshInFlight.current;
    const task = (async () => {
      try {
        const notices = await loadAdminNotifications();
        applyNotificationPayload(notices, reservationSnapshot || reservations, notifyNew);
      } catch (error) {
        reportSyncError('Không thể làm mới thông báo', error);
      } finally {
        notificationRefreshInFlight.current = null;
      }
    })();
    notificationRefreshInFlight.current = task;
    return task;
  }, [applyNotificationPayload, reportSyncError, reservations]);

  useEffect(() => {
  let cancelled = false;

  async function registerPush() {
    try {
      await enableAdminPush();
    } catch (err) {
      console.log("Push chưa được kích hoạt:", err);
    }
  }

  if (!cancelled) {
    registerPush();
  }

  return () => {
    cancelled = true;
  };
}, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const dataPromise = loadDataFromServer()
        .then((payload) => ({ payload, server: true }))
        .catch(() => ({ payload: loadData(), server: false }));
      const settingsPromise = loadSiteSettingsFromServer().catch(() => loadSiteSettingsLocal());
      const notificationsPromise = loadAdminNotifications().catch(() => null);

      const [dataResult, nextSettings, noticeResult] = await Promise.all([dataPromise, settingsPromise, notificationsPromise]);
      if (!mounted) return;
      applyPayload(dataResult.payload, false, !dataResult.server);
      setSettings(nextSettings);
      applyNotificationPayload(noticeResult || synthesizeNotifications(dataResult.payload.reservations), dataResult.payload.reservations, false);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [applyNotificationPayload, applyPayload]);

  useEffect(() => {
    if (loading) return;

    const scheduleRefresh = () => {
      if (Date.now() - lastMutationAt.current < 2_500) return;
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => refresh(), 700);
    };

    const scheduleNotificationRefresh = () => {
      if (notificationRefreshTimer.current) window.clearTimeout(notificationRefreshTimer.current);
      notificationRefreshTimer.current = window.setTimeout(() => refreshNotifications(true), 350);
    };

    const onFocus = () => {
      scheduleRefresh();
      scheduleNotificationRefresh();
    };
    const onOnline = () => {
      scheduleRefresh();
      scheduleNotificationRefresh();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    const dataPollId = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 300_000);
    const notificationPollId = window.setInterval(() => {
      if (!document.hidden) refreshNotifications(true);
    }, 30_000);

    if (!REALTIME_DISABLED) {
      try {
        const supabase = getSupabaseBrowserClient();
        channelRef.current = supabase
          .channel('duyt-admin-routes-sync-v2')
          .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            const table = payload.table || '';
            if (table === 'AdminNotification' || table === 'admin_notifications') {
              scheduleNotificationRefresh();
              return;
            }
            if (REALTIME_TABLES.has(table)) scheduleRefresh();
          })
          .subscribe();
      } catch {
        // Polling remains available when realtime has not been enabled.
      }
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      window.clearInterval(dataPollId);
      window.clearInterval(notificationPollId);
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      if (notificationRefreshTimer.current) window.clearTimeout(notificationRefreshTimer.current);
      if (localPersistTimer.current) window.clearTimeout(localPersistTimer.current);
      if (channelRef.current) {
        try { getSupabaseBrowserClient().removeChannel(channelRef.current); } catch { /* ignore */ }
        channelRef.current = null;
      }
    };
  }, [loading, refresh, refreshNotifications]);

  const commit = useCallback(async (payload: ConciergePayload, successMessage?: string) => {
    const previous = { venues, reservations, customers };
    applyPayload(payload, false, false);
    setSaving(true);
    lastMutationAt.current = Date.now();
    try {
      const serverPayload = await saveDataToServer(payload);
      applyPayload(serverPayload, false, false);
      if (successMessage) showToast('success', successMessage);
    } catch (error) {
      applyPayload(previous, false, false);
      reportSyncError('Không thể đồng bộ dữ liệu', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể đồng bộ Supabase. Thay đổi đã được hoàn tác.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [applyPayload, customers, reportSyncError, reservations, showToast, venues]);

  const saveReservation = useCallback(async (reservation: ReservationRequest) => {
    const existing = reservations.find((item) => item.id === reservation.id) || null;
    const validation = validateReservation(reservation, venues, reservations, { existing });
    if (!validation.valid) {
      const message = validation.issues[0]?.message || 'Dữ liệu booking không hợp lệ.';
      showToast('error', message);
      throw new Error(message);
    }

    const previousReservations = reservations;
    const previousCustomers = customers;
    const nextReservations = existing
      ? reservations.map((item) => item.id === reservation.id ? reservation : item)
      : [reservation, ...reservations];
    const phone = normalizePhone(reservation.phoneNumber);
    const customerExists = customers.some((customer) => normalizePhone(customer.phoneNumber) === phone && phone);
    const nextCustomers = customerExists ? customers : [{
      id: slugId('cust'),
      fullName: reservation.fullName,
      phoneNumber: reservation.phoneNumber,
      notes: `Tự động tạo từ booking ${reservation.id}.`,
      vipStatus: VipStatus.STANDARD,
      favoriteVenueIds: reservation.venueId ? [reservation.venueId] : [],
      createdAt: new Date().toISOString(),
    }, ...customers];

    setReservations(nextReservations);
    setCustomers(nextCustomers);
    setSaving(true);
    lastMutationAt.current = Date.now();
    try {
      const saved = existing
        ? await updateReservationOnServer(reservation.id, reservation)
        : await createReservationOnServer(reservation, { adminMode: true });
      const committedReservations = nextReservations.map((item) => item.id === saved.id ? saved : item);
      setReservations(committedReservations);
      setNotifications((current) => normalizeNotifications(existing ? current : [buildNotification(saved), ...current], committedReservations));
      knownReservations.current.add(saved.id);
      showToast('success', existing ? 'Đã cập nhật booking.' : 'Đã tạo booking mới.');
    } catch (error) {
      setReservations(previousReservations);
      setCustomers(previousCustomers);
      reportSyncError('Không thể lưu booking', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể lưu booking. Thay đổi đã được hoàn tác.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [customers, reportSyncError, reservations, showToast, venues]);

  const updateReservationStatus = useCallback(async (id: string, status: BookingStatus) => {
    const existing = reservations.find((item) => item.id === id);
    if (!existing || existing.status === status) return;
    const decision = getStatusTransitionDecision(existing, status);
    if (!decision.allowed) {
      showToast('error', decision.reason || 'Không thể đổi trạng thái booking.');
      return;
    }

    const previous = reservations;
    const next = reservations.map((item) => item.id === id ? { ...item, status } : item);
    setReservations(next);
    lastMutationAt.current = Date.now();
    try {
      const saved = await updateReservationOnServer(id, { status });
      setReservations((current) => current.map((item) => item.id === id ? { ...item, status: saved.status } : item));
      showToast('success', 'Đã cập nhật trạng thái booking.');
    } catch (error) {
      setReservations(previous);
      reportSyncError('Không thể cập nhật trạng thái', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể cập nhật trạng thái. Thay đổi đã được hoàn tác.');
    }
  }, [reportSyncError, reservations, showToast]);

  const deleteReservation = useCallback(async (id: string) => {
    const previous = reservations;
    const next = reservations.filter((item) => item.id !== id);
    if (next.length === previous.length) return;
    setReservations(next);
    lastMutationAt.current = Date.now();
    try {
      await deleteReservationOnServer(id);
      showToast('success', 'Đã xóa booking.');
    } catch (error) {
      setReservations(previous);
      reportSyncError('Không thể xóa booking', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể xóa booking. Dữ liệu đã được khôi phục.');
    }
  }, [reportSyncError, reservations, showToast]);

  const saveCustomer = useCallback(async (customer: Customer) => {
    const validation = validateCustomer(customer, customers);
    if (!validation.valid) {
      const message = validation.issues[0]?.message || 'Dữ liệu khách hàng không hợp lệ.';
      showToast('error', message);
      throw new Error(message);
    }
    const exists = customers.some((item) => item.id === customer.id);
    const previous = customers;
    const next = exists ? customers.map((item) => item.id === customer.id ? customer : item) : [customer, ...customers];
    setCustomers(next);
    setSaving(true);
    lastMutationAt.current = Date.now();
    try {
      const saved = exists
        ? await updateCustomerOnServer(customer.id, customer)
        : await createCustomerOnServer(customer);
      setCustomers((current) => current.map((item) => item.id === saved.id ? saved : item));
      showToast('success', exists ? 'Đã cập nhật khách hàng.' : 'Đã thêm khách hàng.');
    } catch (error) {
      setCustomers(previous);
      reportSyncError('Không thể lưu khách hàng', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể lưu khách hàng. Thay đổi đã được hoàn tác.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [customers, reportSyncError, showToast]);

  const deleteCustomer = useCallback(async (id: string) => {
    const target = customers.find((item) => item.id === id);
    if (!target) return;
    const phone = normalizePhone(target.phoneNumber);
    const hasHistory = reservations.some((item) =>
      (phone && normalizePhone(item.phoneNumber) === phone) || item.fullName.trim().toLowerCase() === target.fullName.trim().toLowerCase(),
    );
    if (hasHistory) {
      showToast('error', 'Không thể xóa khách hàng đang có lịch sử booking.');
      return;
    }
    const previous = customers;
    setCustomers(customers.filter((item) => item.id !== id));
    lastMutationAt.current = Date.now();
    try {
      await deleteCustomerOnServer(id);
      showToast('success', 'Đã xóa khách hàng.');
    } catch (error) {
      setCustomers(previous);
      reportSyncError('Không thể xóa khách hàng', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể xóa khách hàng. Dữ liệu đã được khôi phục.');
    }
  }, [customers, reportSyncError, reservations, showToast]);

  const saveVenue = useCallback(async (venue: Venue) => {
    const existingVenue = venues.find((item) => item.id === venue.id);
    const validation = validateVenueUpdate(venue, existingVenue);
    if (!validation.valid) {
      const message = validation.issues[0]?.message || 'Dữ liệu địa điểm không hợp lệ.';
      showToast('error', message);
      throw new Error(message);
    }
    const exists = venues.some((item) => item.id === venue.id);
    const previousVenues = venues;
    const previousReservations = reservations;
    const nextVenues = exists ? venues.map((item) => item.id === venue.id ? venue : item) : [venue, ...venues];
    const nextReservations = reservations.map((item) => item.venueId === venue.id ? { ...item, venueName: venue.name } : item);
    setVenues(nextVenues);
    setReservations(nextReservations);
    setSaving(true);
    lastMutationAt.current = Date.now();
    try {
      const saved = exists ? await updateVenueOnServer(venue.id, venue) : await createVenueOnServer(venue);
      setVenues((current) => current.map((item) => item.id === saved.id ? saved : item));
      showToast('success', exists ? 'Đã cập nhật địa điểm.' : 'Đã thêm địa điểm.');
    } catch (error) {
      setVenues(previousVenues);
      setReservations(previousReservations);
      reportSyncError('Không thể lưu địa điểm', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể lưu địa điểm. Thay đổi đã được hoàn tác.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [reportSyncError, reservations, showToast, venues]);


  const saveVenueReels = useCallback(async (venueId: string, reels: HomepageReel[]) => {
    const previousVenue = venues.find((item) => item.id === venueId);
    if (!previousVenue) throw new Error('Không tìm thấy địa điểm để lưu Reel.');

    const normalized = reels.map((reel, order) => ({
      ...reel,
      venueId,
      instagramUrl: String(reel.instagramUrl || '').trim(),
      order: Number.isFinite(Number(reel.order)) ? Number(reel.order) : order,
    }));

    setVenues((current) => current.map((item) =>
      item.id === venueId ? { ...item, reels: normalized } : item
    ));
    setSaving(true);
    lastMutationAt.current = Date.now();

    try {
      const response = await fetch(`/api/venues/${encodeURIComponent(venueId)}/reels`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reels: normalized }),
        cache: 'no-store',
      });
      const json = await response.json().catch(() => null);

      if (response.status === 401) {
        throw new Error('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại rồi lưu Reel.');
      }
      if (!response.ok || !json?.ok || !Array.isArray(json?.data)) {
        throw new Error(json?.error || 'Không thể lưu Reel.');
      }

      const saved = json.data as HomepageReel[];
      setVenues((current) => current.map((item) =>
        item.id === venueId ? { ...item, reels: saved } : item
      ));
      showToast('success', 'Đã lưu Reel.');
      return saved;
    } catch (error) {
      setVenues((current) => current.map((item) =>
        item.id === venueId ? previousVenue : item
      ));
      reportSyncError('Không thể lưu Reel', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể lưu Reel.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [reportSyncError, showToast, venues]);


  const reorderReels = useCallback(async (ordered: Array<{ venueId: string; reelId: string }>) => {
    const previous = venues;
    const orderMap = new Map(ordered.map((item, order) => [`${item.venueId}::${item.reelId}`, order]));
    setVenues((current) => current.map((venue) => ({
      ...venue,
      reels: (venue.reels || []).map((reel) => ({
        ...reel,
        order: orderMap.get(`${venue.id}::${reel.id}`) ?? reel.order,
      })),
    })));
    setSaving(true);
    lastMutationAt.current = Date.now();

    try {
      const response = await fetch('/api/reels/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered }),
        cache: 'no-store',
      });
      const json = await response.json().catch(() => null);
      if (response.status === 401) throw new Error('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.');
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Không thể đổi vị trí Reel.');
      showToast('success', 'Đã cập nhật thứ tự Reels trên toàn hệ thống.');
    } catch (error) {
      setVenues(previous);
      reportSyncError('Không thể đổi vị trí Reel', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể đổi vị trí Reel.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [reportSyncError, showToast, venues]);

  const deleteVenue = useCallback(async (id: string) => {
    if (reservations.some((item) => item.venueId === id)) {
      showToast('error', 'Không thể xóa địa điểm đang có booking. Hãy chuyển hoặc xóa booking liên quan trước.');
      return;
    }
    const previous = venues;
    const next = venues.filter((item) => item.id !== id);
    setVenues(next);
    lastMutationAt.current = Date.now();
    try {
      await deleteVenueOnServer(id);
      showToast('success', 'Đã xóa địa điểm.');
    } catch (error) {
      setVenues(previous);
      reportSyncError('Không thể xóa địa điểm', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể xóa địa điểm. Dữ liệu đã được khôi phục.');
    }
  }, [reportSyncError, reservations, showToast, venues]);

  const replaceData = useCallback(async (payload: ConciergePayload) => {
    await commit(payload, 'Đã thay thế và đồng bộ dữ liệu hệ thống.');
  }, [commit]);

  const resetData = useCallback(async () => {
    const previous = { reservations, customers, notifications };
    setSaving(true);
    lastMutationAt.current = Date.now();

    try {
      const response = await fetch('/api/admin-data/reset-operational', {
        method: 'POST',
        cache: 'no-store',
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || 'Không thể xóa dữ liệu vận hành.');
      }

      setReservations([]);
      setCustomers([]);
      setNotifications([]);
      knownReservations.current = new Set();
      knownNotifications.current = new Set();
      saveReservations([]);
      saveCustomers([]);
      showToast('success', 'Đã xóa booking, khách hàng và yêu cầu. Địa điểm, hình ảnh, bàn và cấu hình vẫn được giữ nguyên.');
    } catch (error) {
      setReservations(previous.reservations);
      setCustomers(previous.customers);
      setNotifications(previous.notifications);
      reportSyncError('Không thể đặt lại dữ liệu vận hành', error);
      showToast('error', error instanceof Error ? error.message : 'Không thể đặt lại dữ liệu vận hành.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [customers, notifications, reportSyncError, reservations, showToast]);

  const saveSettings = useCallback(async (nextSettings: SiteSettings) => {
    const previousSettings = settings;
    setSaving(true);
    saveSiteSettingsLocal(nextSettings);
    setSettings(nextSettings);
    try {
      const saved = await saveSiteSettingsToServer(nextSettings);
      setSettings(saved);
      saveSiteSettingsLocal(saved);
      showToast('success', 'Đã cập nhật nhận diện DuyT Booking trên toàn hệ thống.');
      return saved;
    } catch (error) {
      setSettings(previousSettings);
      saveSiteSettingsLocal(previousSettings);
      showToast('error', error instanceof Error ? error.message : 'Không lưu được cài đặt.');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [settings, showToast]);

  const uploadMedia = useCallback(async (file: File, folder: string, oldPath?: string) => {
    const isPdf = folder === 'venues/menus' || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // Menu PDF tiếp tục đi qua Supabase Storage. Ảnh/video upload trực tiếp
    // từ trình duyệt lên Cloudinary để không đi qua giới hạn body của hosting.
    if (isPdf) {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', folder);
      if (oldPath) form.append('oldPath', oldPath);
      const response = await fetch('/api/upload-media', { method: 'POST', body: form });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok || !json?.url) throw new Error(json?.error || 'Upload PDF thất bại.');
      return { url: String(json.url), path: String(json.path || '') };
    }

    const signResponse = await fetch('/api/upload-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });
    const signed = await signResponse.json().catch(() => null);
    if (signResponse.status === 401) {
      throw new Error('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại trước khi upload video.');
    }
    if (!signResponse.ok || !signed?.ok || !signed?.uploadUrl) {
      throw new Error(signed?.error || 'Không thể chuẩn bị upload Cloudinary.');
    }

    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('api_key', String(signed.apiKey));
    cloudinaryForm.append('timestamp', String(signed.timestamp));
    cloudinaryForm.append('signature', String(signed.signature));
    cloudinaryForm.append('public_id', String(signed.publicId));
    cloudinaryForm.append('overwrite', 'false');

    const uploadResponse = await fetch(String(signed.uploadUrl), {
      method: 'POST',
      body: cloudinaryForm,
    });
    const uploaded = await uploadResponse.json().catch(() => null);
    if (!uploadResponse.ok || !uploaded?.secure_url || !uploaded?.public_id) {
      throw new Error(uploaded?.error?.message || 'Cloudinary upload thất bại.');
    }

    const resourceType = String(uploaded.resource_type || signed.resourceType || 'image');
    const originalUrl = String(uploaded.secure_url);
    const deliveryUrl = resourceType === 'image'
      ? originalUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto:eco/')
      : originalUrl;
    const posterUrl = resourceType === 'video'
      ? originalUrl
          .replace('/video/upload/', '/video/upload/so_0.6,f_jpg,q_auto:eco/')
          .replace(/\.[a-z0-9]+$/i, '.jpg')
      : undefined;
    return {
      url: deliveryUrl,
      path: `cloudinary://${resourceType}/${String(uploaded.public_id)}`,
      posterUrl,
    };
  }, []);

  const deleteMedia = useCallback(async (path?: string) => {
    const cleanPath = String(path || '').trim();
    if (!cleanPath) return;
    const response = await fetch('/api/upload-media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: cleanPath }),
    });
    const json = await response.json().catch(() => null);
    if (response.status === 401) {
      throw new Error('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại trước khi xóa media.');
    }
    if (!response.ok || !json?.ok) throw new Error(json?.error || 'Không thể xóa media cũ.');
  }, []);

  const markNotificationsRead = useCallback(async (ids?: string[]) => {
    const target = ids?.length ? new Set(ids) : null;
    const reservationIds = notifications
      .filter((notice) => !target || target.has(notice.id))
      .map((notice) => notice.reservationId)
      .filter(Boolean);
    setNotifications((current) => current.map((notice) => !target || target.has(notice.id) ? { ...notice, read: true } : notice));
    if (!target && 'clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => undefined);
    }
    try {
      await fetch('/api/admin-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ids || [], reservationIds, read: true }),
      });
    } catch {
      // Trạng thái local vẫn đủ để tránh làm gián đoạn thao tác.
    }
  }, [notifications]);

  const logout = useCallback(async () => {
    await disableAdminPush().catch(() => undefined);
    await fetch('/api/admin-logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/login');
    router.refresh();
  }, [router]);

  const value = useMemo<AdminContextValue>(() => ({
    venues, reservations, customers, settings, notifications,
    unreadCount: notifications.filter((notice) => !notice.read).length,
    loading, saving, searchQuery, setSearchQuery, refresh,
    saveReservation, updateReservationStatus, deleteReservation,
    saveCustomer, deleteCustomer, saveVenue, saveVenueReels, reorderReels, deleteVenue,
    replaceData, resetData, saveSettings, uploadMedia, deleteMedia,
    markNotificationsRead, logout, showToast,
  }), [
    venues, reservations, customers, settings, notifications, loading, saving, searchQuery, refresh,
    saveReservation, updateReservationStatus, deleteReservation, saveCustomer, deleteCustomer,
    saveVenue, saveVenueReels, reorderReels, deleteVenue, replaceData, resetData, saveSettings, uploadMedia, deleteMedia, markNotificationsRead,
    logout, showToast,
  ]);

  return (
    <AdminContext.Provider value={value}>
      {children}
      <ToastHost toast={toast} onClose={() => setToast(null)} />
    </AdminContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdminData phải được dùng bên trong AdminDataProvider.');
  return context;
}
