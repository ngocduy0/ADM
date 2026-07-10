'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
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

const REALTIME_TABLES = [
  'Booking',
  'BookingContact',
  'Customer',
  'Venue',
  'VenueImage',
  'VenueSpot',
  'VenueTableZone',
  'VenueMapElement',
  'VenueMapConfig',
  'SiteSetting',
];

const VISIBLE_FALLBACK_POLL_MS = 60_000;
const HIDDEN_FALLBACK_POLL_MS = 5 * 60_000;
const REFRESH_DEBOUNCE_MS = 650;
const REALTIME_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME === 'true';

function createRealtimeClient() {
  if (!REALTIME_ENABLED) return null;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const url = rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

  if (!url || !anonKey.trim()) return null;

  return createClient(url, anonKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 2 } },
  });
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
  const lastRefreshAtRef = useRef(0);
  const mountedRef = useRef(false);

  const applyPayload = useCallback((data: ConciergeDataPayload) => {
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
        console.warn('[AdminPortal] Refresh skipped.', error);
      } finally {
        refreshInFlightRef.current = false;
      }
    },
    [applyPayload],
  );

  const scheduleRefresh = useCallback(
    (reason: string) => {
      if (refreshDebounceRef.current) {
        window.clearTimeout(refreshDebounceRef.current);
      }

      refreshDebounceRef.current = window.setTimeout(() => {
        refreshDebounceRef.current = null;
        refreshFromServer(reason);
      }, REFRESH_DEBOUNCE_MS);
    },
    [refreshFromServer],
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
        console.warn('[AdminPortal] Supabase unavailable, using local fallback.', error);
        const data = loadData();
        if (cancelled || !mountedRef.current) return;
        applyPayload(data);
      } finally {
        if (!cancelled && mountedRef.current) setIsLoading(false);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (refreshDebounceRef.current) {
        window.clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
    };
  }, [applyPayload]);

  useEffect(() => {
    if (isLoading) return undefined;

    const supabase = createRealtimeClient();
    let channel: RealtimeChannel | null = null;
    let fallbackTimer: number | null = null;

    const clearFallbackTimer = () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const scheduleFallbackPolling = () => {
      clearFallbackTimer();
      const delay = document.hidden ? HIDDEN_FALLBACK_POLL_MS : VISIBLE_FALLBACK_POLL_MS;

      fallbackTimer = window.setTimeout(async () => {
        if (!document.hidden || Date.now() - lastRefreshAtRef.current >= HIDDEN_FALLBACK_POLL_MS) {
          await refreshFromServer(document.hidden ? 'fallback-hidden' : 'fallback-visible');
        }
        scheduleFallbackPolling();
      }, delay);
    };

    const handleVisibilityChange = () => {
      scheduleFallbackPolling();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleFallbackPolling();

    if (supabase) {
      channel = supabase.channel(`duyt-admin-concierge-sync-v1-${Date.now()}`);
      REALTIME_TABLES.forEach((table) => {
        channel?.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => scheduleRefresh(`realtime:${table}`),
        );
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') return;
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(
            `[AdminPortal] Supabase Realtime ${status}. The admin will keep syncing by polling every 60s. ` +
              'Enable Realtime tables in Supabase, or keep NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME=false.',
          );
        }
      });
    } else if (REALTIME_ENABLED) {
      console.warn('[AdminPortal] Missing public Supabase env. Using 60s fallback refresh only.');
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearFallbackTimer();
      if (refreshDebounceRef.current) {
        window.clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
      if (channel) {
        supabase?.removeChannel(channel);
      }
    };
  }, [isLoading, refreshFromServer, scheduleRefresh]);

  const commitData = (payload: ConciergeDataPayload) => {
    applyPayload(payload);

    syncInFlightRef.current = true;
    saveDataToServer(payload)
      .then((serverData) => {
        applyPayload(serverData);
      })
      .catch((error) => {
        console.warn('[AdminPortal] Supabase sync failed. Changes are kept locally.', error);
      })
      .finally(() => {
        syncInFlightRef.current = false;
      });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#F5F5F7]" aria-busy="true" />;
  }

  return (
    <>
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
    </>
  );
}
