'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ConciergeDataPayload,
  loadData,
  loadDataFromServer,
  loadVenueFromServer,
  loadVenuesFromServer,
  saveCustomers,
  saveDataToServer,
  saveReservations,
  saveVenues,
} from '../data';
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromServer,
  loadSiteSettingsLocal,
  saveSiteSettingsLocal,
  SiteSettings,
} from '../siteSettings';
import { Venue } from '../types';

type PublicVenuesState = {
  venues: Venue[];
  siteSettings: SiteSettings;
  isLoadingData: boolean;
};

type PublicVenueState = {
  venue: Venue | null;
  siteSettings: SiteSettings;
  isLoadingData: boolean;
};

let venuesCache: Venue[] | null = null;
let venuesPromise: Promise<Venue[]> | null = null;
let settingsCache: SiteSettings | null = null;
let settingsPromise: Promise<SiteSettings> | null = null;
const venueCache = new Map<string, Venue>();
const venuePromiseCache = new Map<string, Promise<Venue>>();

function normalizeVenueKey(venueId: string) {
  return decodeURIComponent(venueId || '').trim();
}

function findVenueLocal(venues: Venue[], venueId: string) {
  const safeId = normalizeVenueKey(venueId);
  return venues.find(
    (venue) => venue.id === safeId || venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === safeId,
  ) || null;
}

async function getPublicSettings() {
  if (settingsCache) return settingsCache;
  if (!settingsPromise) {
    settingsPromise = loadSiteSettingsFromServer()
      .then((settings) => {
        settingsCache = settings;
        saveSiteSettingsLocal(settings);
        return settings;
      })
      .catch((error) => {
        console.warn('[DuyT] Site settings unavailable, using local/default fallback.', error);
        const fallback = loadSiteSettingsLocal();
        settingsCache = fallback;
        return fallback;
      })
      .finally(() => {
        settingsPromise = null;
      });
  }
  return settingsPromise;
}

async function getPublicVenues() {
  if (venuesCache) return venuesCache;
  if (!venuesPromise) {
    venuesPromise = loadVenuesFromServer()
      .then((venues) => {
        venuesCache = venues;
        saveVenues(venues);
        venues.forEach((venue) => venueCache.set(venue.id, venue));
        return venues;
      })
      .catch((error) => {
        console.warn('[DuyT] Venue API unavailable, using local fallback.', error);
        const fallback = loadData().venues;
        venuesCache = fallback;
        fallback.forEach((venue) => venueCache.set(venue.id, venue));
        return fallback;
      })
      .finally(() => {
        venuesPromise = null;
      });
  }
  return venuesPromise;
}

async function getPublicVenue(venueId: string) {
  const safeId = normalizeVenueKey(venueId);
  const cachedById = venueCache.get(safeId) || (venuesCache ? findVenueLocal(venuesCache, safeId) : null);
  if (cachedById) return cachedById;

  const existingPromise = venuePromiseCache.get(safeId);
  if (existingPromise) return existingPromise;

  const promise = loadVenueFromServer(safeId)
    .then((venue) => {
      venueCache.set(venue.id, venue);
      return venue;
    })
    .catch(async (error) => {
      console.warn('[DuyT] Venue detail API unavailable, using local fallback.', error);
      const localVenue = findVenueLocal(loadData().venues, safeId);
      if (localVenue) return localVenue;
      const allVenues = await getPublicVenues();
      const fallback = findVenueLocal(allVenues, safeId);
      if (fallback) return fallback;
      throw error;
    })
    .finally(() => {
      venuePromiseCache.delete(safeId);
    });

  venuePromiseCache.set(safeId, promise);
  return promise;
}

export function usePublicSettings() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(settingsCache || DEFAULT_SITE_SETTINGS);
  const [isLoadingData, setIsLoadingData] = useState(!settingsCache);

  useEffect(() => {
    let isMounted = true;
    getPublicSettings()
      .then((settings) => {
        if (isMounted) setSiteSettings(settings);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { siteSettings, isLoadingData };
}

export function usePublicVenues(): PublicVenuesState {
  const [venues, setVenues] = useState<Venue[]>(venuesCache || []);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(settingsCache || DEFAULT_SITE_SETTINGS);
  const [isLoadingData, setIsLoadingData] = useState(!venuesCache || !settingsCache);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getPublicVenues(), getPublicSettings()])
      .then(([nextVenues, nextSettings]) => {
        if (!isMounted) return;
        setVenues(nextVenues);
        setSiteSettings(nextSettings);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { venues, siteSettings, isLoadingData };
}

export function usePublicVenue(venueId: string): PublicVenueState {
  const safeId = normalizeVenueKey(venueId);
  const initialVenue = safeId ? venueCache.get(safeId) || (venuesCache ? findVenueLocal(venuesCache, safeId) : null) : null;
  const [venue, setVenue] = useState<Venue | null>(initialVenue);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(settingsCache || DEFAULT_SITE_SETTINGS);
  const [isLoadingData, setIsLoadingData] = useState(!initialVenue || !settingsCache);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getPublicVenue(safeId), getPublicSettings()])
      .then(([nextVenue, nextSettings]) => {
        if (!isMounted) return;
        setVenue(nextVenue);
        setSiteSettings(nextSettings);
      })
      .catch(() => {
        if (isMounted) setVenue(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [safeId]);

  return { venue, siteSettings, isLoadingData };
}

// Giữ lại hook cũ cho các phần admin/legacy còn phụ thuộc dạng payload tổng.
export function usePublicData() {
  const [data, setData] = useState<ConciergeDataPayload>({ venues: [], customers: [], reservations: [] });
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const cacheData = useCallback((payload: ConciergeDataPayload) => {
    venuesCache = payload.venues;
    payload.venues.forEach((venue) => venueCache.set(venue.id, venue));
    saveVenues(payload.venues);
    saveCustomers(payload.customers);
    saveReservations(payload.reservations);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateData() {
      try {
        const [serverData, settings] = await Promise.all([loadDataFromServer(), getPublicSettings()]);
        if (!isMounted) return;
        setData(serverData);
        setSiteSettings(settings);
        cacheData(serverData);
      } catch (error) {
        console.warn('[DuyT] Supabase unavailable, using local fallback.', error);
        const localData = loadData();
        if (!isMounted) return;
        setData(localData);
        setSiteSettings(loadSiteSettingsLocal());
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    hydrateData();
    return () => {
      isMounted = false;
    };
  }, [cacheData]);

  const commitData = useCallback((payload: ConciergeDataPayload) => {
    setData(payload);
    cacheData(payload);

    return saveDataToServer(payload)
      .then((serverData) => {
        setData(serverData);
        cacheData(serverData);
        return serverData;
      })
      .catch((error) => {
        console.warn('[DuyT] Supabase sync failed. Changes are kept locally.', error);
        return payload;
      });
  }, [cacheData]);

  return {
    venues: data.venues,
    customers: data.customers,
    reservations: data.reservations,
    setData,
    commitData,
    siteSettings,
    isLoadingData,
  };
}
