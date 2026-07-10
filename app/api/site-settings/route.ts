import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { COOKIE_NAME, isValidAdminSession } from '@/lib/admin-auth';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from '@/components/aurelius/siteSettings';

export const dynamic = 'force-dynamic';

const SETTINGS_KEY = 'site';

type DbSettingRow = {
  key: string;
  value: SiteSettings;
  updatedAt?: string;
};

function getSupabaseAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase API key');
  }

  return createClient(url, key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

function getCloudflareClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('true-client-ip') ||
    forwardedFor ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

async function writeSecurityLog(event: string, request: NextRequest, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = getSupabaseAdminClient() as any;
    const url = new URL(request.url);
    await supabase.from('SecurityLog' as any).insert({
      event,
      ip: getCloudflareClientIp(request),
      country: request.headers.get('cf-ipcountry') || 'unknown',
      cfRay: request.headers.get('cf-ray') || '',
      userAgent: request.headers.get('user-agent') || '',
      referer: request.headers.get('referer') || '',
      language: request.headers.get('accept-language') || '',
      method: request.method,
      path: url.pathname,
      metadata,
    });
  } catch (error) {
    console.warn('[site-settings:security-log:optional]', error instanceof Error ? error.message : error);
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from('SiteSetting')
      .select('key,value,updatedAt')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      source: 'supabase',
      settings: normalizeSettings((data as DbSettingRow | null)?.value || DEFAULT_SITE_SETTINGS),
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
  const session = request.cookies.get(COOKIE_NAME)?.value;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ ok: false, error: 'Admin session expired. Please sign in again.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const settings = normalizeSettings(body?.settings);
  settings.updatedAt = new Date().toISOString();

  try {
    const supabase = getSupabaseAdminClient() as any;
    const { error } = await supabase
      .from('SiteSetting')
      .upsert({ key: SETTINGS_KEY, value: settings, updatedAt: settings.updatedAt }, { onConflict: 'key' });

    if (error) throw error;

    await writeSecurityLog('SITE_SETTINGS_PUT', request, {
      logoPath: settings.logoPath || null,
      heroVideoPath: settings.heroVideoPath || null,
      heroPosterPath: settings.heroPosterPath || null,
    });

    return NextResponse.json({ ok: true, source: 'supabase', settings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to save site settings' },
      { status: 500 }
    );
  }
}
