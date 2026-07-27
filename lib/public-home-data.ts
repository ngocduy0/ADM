import { INITIAL_VENUES } from '@/components/aurelius/data';
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type SiteSettings,
} from '@/components/aurelius/siteSettings';
import type { Venue } from '@/components/aurelius/types';
import { getSupabaseAdminClient, readHomepageVenues } from '@/lib/concierge-repository';

type PublicHomeData = {
  venues: Venue[];
  siteSettings: SiteSettings;
};

type SiteSettingRow = {
  value?: Partial<SiteSettings> | null;
};

let publicHomeCache: { expiresAt: number; value: PublicHomeData } | null = null;
const CACHE_TTL_MS = 30_000;

async function readPublicSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('SiteSetting')
    .select('value')
    .eq('key', 'site')
    .maybeSingle();

  if (error) throw error;
  return normalizeSiteSettings((data as SiteSettingRow | null)?.value || DEFAULT_SITE_SETTINGS);
}

/**
 * Server-side homepage bootstrap. Returning real data in the first HTML avoids
 * the blank black screen and duplicate client request waterfall seen on slow
 * mobile connections.
 */
export async function loadPublicHomeData(): Promise<PublicHomeData> {
  if (publicHomeCache && publicHomeCache.expiresAt > Date.now()) return publicHomeCache.value;

  const [venuesResult, settingsResult] = await Promise.allSettled([
    readHomepageVenues(),
    readPublicSiteSettings(),
  ]);

  const value: PublicHomeData = {
    venues: venuesResult.status === 'fulfilled' ? venuesResult.value : INITIAL_VENUES,
    siteSettings:
      settingsResult.status === 'fulfilled' ? settingsResult.value : DEFAULT_SITE_SETTINGS,
  };

  publicHomeCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}
