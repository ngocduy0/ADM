import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { getSupabaseAdminClient, writeSecurityLog } from '@/lib/concierge-repository';
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type SiteSettings } from '@/components/aurelius/siteSettings';

export const dynamic = 'force-dynamic';

const SETTINGS_KEY = 'site';

type DbSettingRow = {
  key: string;
  value: SiteSettings;
  updatedAt?: string;
};

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('SiteSetting')
      .select('key,value,updatedAt')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      source: 'supabase',
      settings: normalizeSiteSettings((data as DbSettingRow | null)?.value || DEFAULT_SITE_SETTINGS),
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      source: 'fallback',
      warning: error instanceof Error ? error.message : 'Unable to read site settings',
      settings: DEFAULT_SITE_SETTINGS,
    });
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const settings = normalizeSiteSettings(body?.settings);
  settings.updatedAt = new Date().toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('SiteSetting')
      .upsert({ key: SETTINGS_KEY, value: settings, updatedAt: settings.updatedAt }, { onConflict: 'key' });

    if (error) throw error;

    void writeSecurityLog('SITE_SETTINGS_PUT', request, {
      logoPath: settings.logoPath || null,
      heroVideoPath: settings.heroVideoPath || null,
      heroPosterPath: settings.heroPosterPath || null,
    });

    return NextResponse.json({ ok: true, source: 'supabase', settings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to save site settings' },
      { status: 503 },
    );
  }
}
