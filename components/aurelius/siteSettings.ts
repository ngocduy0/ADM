export type SiteSettings = {
  logoUrl: string;
  logoPath?: string;
  heroVideoUrl: string;
  heroVideoPath?: string;
  heroPosterUrl?: string;
  heroPosterPath?: string;
  updatedAt?: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logoUrl: '',
  logoPath: '',
  heroVideoUrl: '',
  heroVideoPath: '',
  heroPosterUrl: '',
  heroPosterPath: '',
  updatedAt: '',
};

const STORAGE_KEY = 'duyt_site_settings';

function isBrowser() {
  return typeof window !== 'undefined';
}

function normalizeSettings(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  return {
    logoUrl: String(value?.logoUrl || ''),
    logoPath: String(value?.logoPath || ''),
    heroVideoUrl: String(value?.heroVideoUrl || ''),
    heroVideoPath: String(value?.heroVideoPath || ''),
    heroPosterUrl: String(value?.heroPosterUrl || ''),
    heroPosterPath: String(value?.heroPosterPath || ''),
    updatedAt: String(value?.updatedAt || ''),
  };
}

export function loadSiteSettingsLocal(): SiteSettings {
  if (!isBrowser()) return DEFAULT_SITE_SETTINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_SETTINGS;
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function saveSiteSettingsLocal(settings: SiteSettings) {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
  } catch {
    // Không lưu video/base64 trong localStorage. Chỉ lưu URL/path nên lỗi này gần như không xảy ra.
  }
}

export async function loadSiteSettingsFromServer(): Promise<SiteSettings> {
  const response = await fetch('/api/site-settings', {
    method: 'GET',
    cache: 'no-store',
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || 'Unable to load site settings');
  }

  const settings = normalizeSettings(json.settings);
  saveSiteSettingsLocal(settings);
  return settings;
}

export async function saveSiteSettingsToServer(settings: SiteSettings): Promise<SiteSettings> {
  const safeSettings = normalizeSettings({ ...settings, updatedAt: settings.updatedAt || new Date().toISOString() });

  const response = await fetch('/api/site-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: safeSettings }),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || 'Unable to save site settings');
  }

  const nextSettings = normalizeSettings(json.settings);
  saveSiteSettingsLocal(nextSettings);
  return nextSettings;
}
