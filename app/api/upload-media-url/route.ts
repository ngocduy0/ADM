import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { createSignedUpload, type CloudinaryResourceType } from '@/lib/cloudinary-media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FOLDERS = new Set([
  'venues',
  'venues/videos',
  'venues/menus',
  'reels',
  'reels/posters',
  'homepage/banner',
  'homepage/banner/posters',
  'brand/logo',
]);

function safeFolder(value: unknown) {
  const raw = String(value || '').trim().replace(/\\/g, '/');
  if (/^brand\/contacts\/[a-z0-9-]+$/i.test(raw)) return raw;
  return ALLOWED_FOLDERS.has(raw) ? raw : 'venues';
}

function getResourceType(contentType: string, fileName: string, folder: string): CloudinaryResourceType | null {
  if (folder === 'venues/menus') {
    return contentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf') ? 'image' : null;
  }
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return null;
}

/**
 * Legacy compatibility endpoint.
 *
 * Older admin builds requested a Supabase signed-upload token here. Every
 * supported file is now signed for direct Cloudinary upload, including PDFs.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const folder = safeFolder(body?.folder);
    const fileName = String(body?.fileName || 'media');
    const contentType = String(body?.contentType || body?.fileType || '');
    const resourceType = getResourceType(contentType, fileName, folder);

    if (!resourceType) {
      return NextResponse.json(
        { ok: false, error: 'Endpoint này chỉ ký upload ảnh, video hoặc menu PDF lên Cloudinary.' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      provider: 'cloudinary',
      deprecatedEndpoint: true,
      ...createSignedUpload({ folder, fileName, resourceType }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Không tạo được chữ ký upload Cloudinary.',
      },
      { status: 500 },
    );
  }
}
