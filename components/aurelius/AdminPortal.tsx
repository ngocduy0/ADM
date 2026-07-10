'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from './supabaseBrowser';
import LuxuryDashboard from './components/LuxuryDashboard';
import {
  ConciergeDataPayload,
  loadData,
  loadDataFromServer,
  saveCustomers,
  saveDataToServer,
  saveReservations,
  saveVenues,
} from './data';
import { Customer, ReservationRequest, Venue } from './types';

const REALTIME_TABLES = new Set([
  // Current / possible Prisma-style table names
  'Booking',
  'BookingContact',
  'Reservation',
  'ReservationRequest',
  'Customer',
  'Venue',
  'VenueImage',
  'VenueSpot',
  'VenueTableZone',
  'VenueMapElement',
  'VenueMapConfig',
  'VenueReel',
  'Reel',
  'SiteSetting',
  'AdminNotification',

  // Current / possible SQL lowercase table names
  'bookings',
  'booking_contacts',
  'reservations',
  'customers',
  'venues',
  'venue_images',
  'venue_spots',
  'venue_table_zones',
  'venue_map_elements',
  'venue_map_configs',
  'venue_reels',
  'reels',
  'site_settings',
  'admin_notifications',
]);

const VISIBLE_FALLBACK_POLL_MS = 60_000;
const HIDDEN_FALLBACK_POLL_MS = 5 * 60_000;
const REFRESH_DEBOUNCE_MS = 450;
const MIN_REFRESH_GAP_MS = 900;

// Realtime bật mặc định.
// Chỉ tắt khi set NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME=false trên Vercel.
const REALTIME_DISABLED =
  process.env.NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME === 'false';

function createRealtimeClient() {
  if (REALTIME_DISABLED) return null;

  try {
    return getSupabaseBrowserClient();
  } catch (error) {
    console.warn('[AdminPortal] Supabase realtime client unavailable.', error);
    return null;
  }
}

export default function AdminPortal() {
  const router = useRouter();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const knownReservationIdsRef = useRef<Set<string>>(new Set());
  const syncInFlightRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const refreshDebounceRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const lastRefreshAtRef = useRef(0);
  const mountedRef = useRef(false);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  const clearRefreshDebounce = useCallback(() => {
    if (refreshDebounceRef.current) {
      window.clearTimeout(refreshDebounceRef.current);
      refreshDebounceRef.current = null;
    }
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const applyPayload = useCallback((data: ConciergeDataPayload) => {
    if (!mountedRef.current) return;

    setVenues(data.venues);
    setReservations(data.reservations);
    setCustomers(data.customers);

    knownReservationIdsRef.current = new Set(
      data.reservations.map((reservation) => reservation.id),
    );

    saveVenues(data.venues);
    saveReservations(data.reservations);
    saveCustomers(data.customers);

    lastRefreshAtRef.current = Date.now();
  }, []);

  const refreshFromServer = useCallback(
    async (reason = 'manual') => {
      if (refreshInFlightRef.current || syncInFlightRef.current) return;

      const now = Date.now();
      if (now - lastRefreshAtRef.current < MIN_REFRESH_GAP_MS) return;

      refreshInFlightRef.current = true;

      try {
        const data = await loadDataFromServer();
        if (!mountedRef.current) return;

        const knownIds = knownReservationIdsRef.current;
        const hasNewBooking = data.reservations.some(
          (reservation) => !knownIds.has(reservation.id),
        );

        applyPayload(data);

        if (hasNewBooking) {
          window.dispatchEvent(
            new CustomEvent('duyt-admin-bookings-refreshed', {
              detail: { reason },
            }),
          );
        }
      } catch (error) {
        console.warn(`[AdminPortal] Refresh skipped: ${reason}`, error);
      } finally {
        refreshInFlightRef.current = false;
      }
    },
    [applyPayload],
  );

  const scheduleRefresh = useCallback(
    (reason: string) => {
      if (!mountedRef.current) return;

      clearRefreshDebounce();

      refreshDebounceRef.current = window.setTimeout(() => {
        refreshDebounceRef.current = null;
        refreshFromServer(reason);
      }, REFRESH_DEBOUNCE_MS);
    },
    [clearRefreshDebounce, refreshFromServer],
  );

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function hydrate() {
      try {
        const data = await loadDataFromServer();

        if (cancelled || !mountedRef.current) return;

        applyPayload(data);
      } catch (error) {
        console.warn(
          '[AdminPortal] Supabase unavailable, using local fallback.',
          error,
        );

        const data = loadData();

        if (cancelled || !mountedRef.current) return;

        applyPayload(data);
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearRefreshDebounce();
      clearFallbackTimer();
    };
  }, [applyPayload, clearFallbackTimer, clearRefreshDebounce]);

  useEffect(() => {
    if (isLoading) return undefined;

    const supabase = createRealtimeClient();

    const scheduleFallbackPolling = () => {
      clearFallbackTimer();

      const delay =
        typeof document !== 'undefined' && document.hidden
          ? HIDDEN_FALLBACK_POLL_MS
          : VISIBLE_FALLBACK_POLL_MS;

      fallbackTimerRef.current = window.setTimeout(async () => {
        if (!mountedRef.current) return;

        const isHidden =
          typeof document !== 'undefined' && document.hidden;

        if (
          !isHidden ||
          Date.now() - lastRefreshAtRef.current >= HIDDEN_FALLBACK_POLL_MS
        ) {
          await refreshFromServer(
            isHidden ? 'fallback-hidden' : 'fallback-visible',
          );
        }

        scheduleFallbackPolling();
      }, delay);
    };

    const handleVisibilityChange = () => {
      scheduleFallbackPolling();

      if (!document.hidden) {
        scheduleRefresh('tab-visible');
      }
    };

    const handleFocus = () => {
      scheduleRefresh('window-focus');
    };

    const handleOnline = () => {
      scheduleRefresh('network-online');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    scheduleFallbackPolling();

    if (supabase) {
      const channel = supabase
        .channel('duyt-admin-concierge-sync-v2')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
          },
          (payload) => {
            const tableName = payload.table;

            if (!tableName || !REALTIME_TABLES.has(tableName)) {
              return;
            }

            scheduleRefresh(`realtime:${tableName}:${payload.eventType}`);
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[AdminPortal] Supabase Realtime subscribed.');
            return;
          }

          if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            console.warn(
              `[AdminPortal] Supabase Realtime ${status}. ` +
                'Admin will keep syncing by fallback polling every 60s. ' +
                'Check Supabase publication and Vercel public env keys.',
            );
          }
        });

      realtimeChannelRef.current = channel;
    } else if (!REALTIME_DISABLED) {
      console.warn(
        '[AdminPortal] Realtime client missing. Admin will use fallback polling.',
      );
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);

      clearFallbackTimer();
      clearRefreshDebounce();

      if (realtimeChannelRef.current) {
        supabase?.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [
    clearFallbackTimer,
    clearRefreshDebounce,
    isLoading,
    refreshFromServer,
    scheduleRefresh,
  ]);

  const commitData = (payload: ConciergeDataPayload) => {
    applyPayload(payload);

    syncInFlightRef.current = true;

    saveDataToServer(payload)
      .then((serverData) => {
        applyPayload(serverData);
      })
      .catch((error) => {
        console.warn(
          '[AdminPortal] Supabase sync failed. Changes are kept locally.',
          error,
        );
      })
      .finally(() => {
        syncInFlightRef.current = false;
      });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#F5F5F7]" aria-busy="true" />;
  }

  return (
    <LuxuryDashboard
      coreVenues={venues}
      coreReservations={reservations}
      coreCustomers={customers}
      onUpdateReservations={(nextReservations) =>
        commitData({ venues, reservations: nextReservations, customers })
      }
      onUpdateCustomers={(nextCustomers) =>
        commitData({ venues, reservations, customers: nextCustomers })
      }
      onUpdateVenues={(nextVenues) =>
        commitData({ venues: nextVenues, reservations, customers })
      }
      onReplaceData={commitData}
      onExit={async () => {
        await fetch('/api/admin-logout', { method: 'POST' });
        router.replace('/login');
      }}
    />
  );
}