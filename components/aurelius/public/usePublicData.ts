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
import { venuePublicSlug } from './routes';

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

function findVenueLocal(venues: Venue[], venueKey: string) {
  const safeKey = normalizeVenueKey(venueKey).toLowerCase();
  return venues.find(
    (venue) => venue.id.toLowerCase() === safeKey || venuePublicSlug(venue) === safeKey,
  ) || null;
}

function cacheVenueAliases(venue: Venue) {
  venueCache.set(venue.id, venue);
  venueCache.set(venuePublicSlug(venue), venue);
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
      .catch(() => {
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
        venues.forEach(cacheVenueAliases);
        return venues;
      })
      .catch(() => {
        const fallback = loadData().venues;
        venuesCache = fallback;
        fallback.forEach(cacheVenueAliases);
        return fallback;
      })
      .finally(() => {
        venuesPromise = null;
      });
  }
  return venuesPromise;
}

async function getPublicVenue(venueKey: string) {
  const safeKey = normalizeVenueKey(venueKey).toLowerCase();

  // Only venueCache contains full venue-detail payloads. venuesCache can be
  // populated by the server-rendered homepage and intentionally contains a
  // lightweight summary without floor-plan tables.
  const cached = venueCache.get(safeKey);
  if (cached) return cached;

  const existingPromise = venuePromiseCache.get(safeKey);
  if (existingPromise) return existingPromise;

  const promise = (async () => {
    let requestKey = safeKey;

    // Resolve a human-readable slug from the lightweight list, but always load
    // the full venue by id before rendering its floor plan.
    if (!/^venue-[a-z0-9_-]+$/i.test(safeKey)) {
      const allVenues = await getPublicVenues();
      const bySlug = findVenueLocal(allVenues, safeKey);
      if (bySlug) requestKey = bySlug.id;
    }

    try {
      const venue = await loadVenueFromServer(requestKey);
      cacheVenueAliases(venue);
      return venue;
    } catch (error) {
      const localVenue = findVenueLocal(loadData().venues, safeKey);
      if (localVenue) {
        cacheVenueAliases(localVenue);
        return localVenue;
      }

      const allVenues = await getPublicVenues();
      const fallback = findVenueLocal(allVenues, safeKey);
      if (fallback) return fallback;
      throw error;
    }
  })().finally(() => {
    venuePromiseCache.delete(safeKey);
  });

  venuePromiseCache.set(safeKey, promise);
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

export function usePublicVenues(
  initialVenues?: Venue[],
  initialSiteSettings?: SiteSettings,
): PublicVenuesState {
  const hasInitialData = Boolean(initialSiteSettings);
  const [venues, setVenues] = useState<Venue[]>(initialVenues || venuesCache || []);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(
    initialSiteSettings || settingsCache || DEFAULT_SITE_SETTINGS,
  );
  const [isLoadingData, setIsLoadingData] = useState(
    !hasInitialData && (!venuesCache || !settingsCache),
  );

  useEffect(() => {
    let isMounted = true;

    if (initialSiteSettings) {
      const nextVenues = initialVenues || [];
      venuesCache = nextVenues;
      settingsCache = initialSiteSettings;
      // Homepage summaries must not enter venueCache because detail pages rely
      // on that cache containing complete floor-plan data.
      setIsLoadingData(false);
      return () => {
        isMounted = false;
      };
    }

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
  }, [initialVenues, initialSiteSettings]);

  return { venues, siteSettings, isLoadingData };
}

export function usePublicVenue(venueId: string): PublicVenueState {
  const safeId = normalizeVenueKey(venueId);
  // Never render a lightweight homepage summary as a venue-detail payload.
  const initialVenue = safeId ? venueCache.get(safeId) || null : null;
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
    payload.venues.forEach(cacheVenueAliases);
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
      } catch {
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
      .catch(() => {
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
