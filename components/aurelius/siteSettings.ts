export type ContactChannel = {
  id: string;
  name: string;
  label: string;
  href: string;
  icon: string;
  iconPath?: string;
  isActive: boolean;
  order: number;
};

export type HomepageSectionId =
  | 'HERO'
  | 'FEATURED_VENUES'
  | 'REELS_FEED'
  | 'CONCIERGE'
  | 'WHY_DUYT'
  | 'TESTIMONIALS'
  | 'FAQ';

export type HomepageSectionConfig = {
  id: HomepageSectionId;
  title: string;
  subtitle: string;
  enabled: boolean;
  order: number;
  venueIds?: string[];
};

export type SiteSettings = {
  brandName: string;
  logoUrl: string;
  logoPath?: string;
  heroVideoUrl: string;
  heroVideoPath?: string;
  heroPosterUrl?: string;
  heroPosterPath?: string;
  contactChannels: ContactChannel[];
  homepageSections: HomepageSectionConfig[];
  updatedAt?: string;
};

export const DEFAULT_CONTACT_CHANNELS: ContactChannel[] = [
  { id: 'phone', name: 'Gọi điện', label: '0865251125', href: 'tel:0865251125', icon: '/brand-icons/phone.svg', isActive: true, order: 0 },
  { id: 'whatsapp', name: 'WhatsApp', label: '0865251125', href: 'https://wa.me/84865251125', icon: '/brand-icons/whatsapp.svg', isActive: true, order: 1 },
  { id: 'zalo', name: 'Zalo', label: '0865251125', href: 'https://zalo.me/0865251125', icon: '/brand-icons/zalo.svg', isActive: true, order: 2 },
  { id: 'telegram', name: 'Telegram', label: '@duytadm', href: 'https://t.me/duytadm', icon: '/brand-icons/telegram.svg', isActive: true, order: 3 },
  { id: 'instagram', name: 'Instagram', label: 'duytadm', href: 'https://instagram.com/duytadm', icon: '/brand-icons/instagram.svg', isActive: true, order: 4 },
  { id: 'facebook', name: 'Facebook', label: 'Duy Thái', href: 'https://www.facebook.com/duy.thai.977475', icon: '/brand-icons/facebook.svg', isActive: true, order: 5 },
  { id: 'email', name: 'Email', label: 'duythai519@gmail.com', href: 'mailto:duythai519@gmail.com', icon: '/brand-icons/email.svg', isActive: true, order: 6 },
];

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  { id: 'HERO', title: 'Hero Banner', subtitle: 'Video hoặc hình ảnh mở đầu', enabled: true, order: 0 },
  { id: 'FEATURED_VENUES', title: 'Địa điểm nổi bật', subtitle: 'Danh sách địa điểm được ưu tiên', enabled: true, order: 1, venueIds: [] },
  { id: 'REELS_FEED', title: 'Reels nổi bật', subtitle: 'Video ngắn trên homepage', enabled: true, order: 2 },
  { id: 'CONCIERGE', title: 'Dịch vụ Concierge', subtitle: 'Khối nội dung giới thiệu concierge', enabled: true, order: 3 },
  { id: 'WHY_DUYT', title: 'Vì sao chọn DuyT', subtitle: 'Lợi ích và tiêu chuẩn dịch vụ', enabled: true, order: 4 },
  { id: 'TESTIMONIALS', title: 'Đánh giá khách hàng', subtitle: 'Cảm nhận và trải nghiệm', enabled: true, order: 5 },
  { id: 'FAQ', title: 'Câu hỏi thường gặp', subtitle: 'Thông tin hỗ trợ đặt chỗ', enabled: true, order: 6 },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: 'DuyT Booking',
  logoUrl: '',
  logoPath: '',
  heroVideoUrl: '',
  heroVideoPath: '',
  heroPosterUrl: '',
  heroPosterPath: '',
  contactChannels: DEFAULT_CONTACT_CHANNELS,
  homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
  updatedAt: '',
};

const STORAGE_KEY = 'duyt_site_settings';

function isBrowser() {
  return typeof window !== 'undefined';
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function normalizeSiteSettings(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  const contactsById = new Map(DEFAULT_CONTACT_CHANNELS.map((item) => [item.id, item]));
  const contacts = safeArray<Partial<ContactChannel>>(value?.contactChannels).map((item, index) => {
    const fallback = contactsById.get(String(item.id || '').toLowerCase()) || DEFAULT_CONTACT_CHANNELS[index] || DEFAULT_CONTACT_CHANNELS[0];
    return {
      id: String(item.id || fallback.id || `contact-${index}`),
      name: String(item.name || fallback.name || 'Liên hệ'),
      label: String(item.label || ''),
      href: String(item.href || ''),
      icon: String(item.icon || fallback.icon || ''),
      iconPath: String(item.iconPath || ''),
      isActive: item.isActive !== false,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
    };
  });

  const mergedContacts = contacts.length ? [...contacts] : DEFAULT_CONTACT_CHANNELS.map((item) => ({ ...item }));
  const hasPhoneChannel = mergedContacts.some((item) => item.id === 'phone' || item.href.startsWith('tel:'));
  if (!hasPhoneChannel) {
    const phoneSource = mergedContacts.find((item) => item.id === 'whatsapp' || item.id === 'zalo');
    const phone = String(phoneSource?.label || '0865251125').replace(/[^0-9+]/g, '') || '0865251125';
    mergedContacts.unshift({
      id: 'phone',
      name: 'Gọi điện',
      label: phone,
      href: `tel:${phone}`,
      icon: '/brand-icons/phone.svg',
      iconPath: '',
      isActive: true,
      order: 0,
    });
  }
  const inputSections = safeArray<Partial<HomepageSectionConfig>>(value?.homepageSections);
  const sectionMap = new Map(inputSections.map((item) => [item.id, item]));
  const sections = DEFAULT_HOMEPAGE_SECTIONS.map((fallback, index) => {
    const item = sectionMap.get(fallback.id);
    return {
      id: fallback.id,
      title: String(item?.title || fallback.title),
      subtitle: String(item?.subtitle || fallback.subtitle),
      enabled: item?.enabled !== false,
      order: Number.isFinite(Number(item?.order)) ? Number(item?.order) : index,
      venueIds: Array.isArray(item?.venueIds) ? item!.venueIds!.map(String) : (fallback.venueIds || []),
    };
  }).sort((a, b) => a.order - b.order).map((item, order) => ({ ...item, order }));

  return {
    brandName: String(value?.brandName || 'DuyT Booking'),
    logoUrl: String(value?.logoUrl || ''),
    logoPath: String(value?.logoPath || ''),
    heroVideoUrl: String(value?.heroVideoUrl || ''),
    heroVideoPath: String(value?.heroVideoPath || ''),
    heroPosterUrl: String(value?.heroPosterUrl || ''),
    heroPosterPath: String(value?.heroPosterPath || ''),
    contactChannels: mergedContacts.sort((a, b) => a.order - b.order).map((item, order) => ({ ...item, order })),
    homepageSections: sections,
    updatedAt: String(value?.updatedAt || ''),
  };
}

export function loadSiteSettingsLocal(): SiteSettings {
  if (!isBrowser()) return DEFAULT_SITE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_SETTINGS;
    return normalizeSiteSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function saveSiteSettingsLocal(settings: SiteSettings) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSiteSettings(settings)));
  } catch {
    // Chỉ lưu metadata và URL, không lưu file/base64.
  }
}

async function fetchSiteSettingsApi(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Kết nối cài đặt hệ thống quá thời gian chờ.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loadSiteSettingsFromServer(): Promise<SiteSettings> {
  const response = await fetchSiteSettingsApi('/api/site-settings', { method: 'GET', cache: 'no-store' });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) throw new Error(json?.error || 'Unable to load site settings');
  const settings = normalizeSiteSettings(json.settings);
  saveSiteSettingsLocal(settings);
  return settings;
}

export async function saveSiteSettingsToServer(settings: SiteSettings): Promise<SiteSettings> {
  const safeSettings = normalizeSiteSettings({ ...settings, updatedAt: settings.updatedAt || new Date().toISOString() });
  const response = await fetchSiteSettingsApi('/api/site-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: safeSettings }),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) throw new Error(json?.error || 'Unable to save site settings');
  const nextSettings = normalizeSiteSettings(json.settings);
  saveSiteSettingsLocal(nextSettings);
  return nextSettings;
}
