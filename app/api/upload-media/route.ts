import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminApi } from '@/lib/admin-api';
import {
  createSignedUpload,
  destroyCloudinaryAsset,
  parseCloudinaryRef,
  type CloudinaryResourceType,
} from '@/lib/cloudinary-media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Supabase is only retained here to delete legacy Storage objects. New files are
// never uploaded to Supabase Storage from this route.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'duyt-media';
const CLOUDINARY_PROVIDER = 'cloudinary' as const;

const MAX_VIDEO_SIZE = 80 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_SIZE = 10 * 1024 * 1024;

const FIXED_ALLOWED_FOLDERS = new Set([
  'venues',
  'venues/videos',
  'venues/menus',
  'reels',
  'reels/posters',
  'homepage/banner',
  'homepage/banner/posters',
  'brand/logo',
]);

function isAllowedFolder(value: string) {
  return FIXED_ALLOWED_FOLDERS.has(value) || /^brand\/contacts\/[a-z0-9-]+$/i.test(value);
}

function safeFolder(value: unknown) {
  const raw = String(value || '').trim().replace(/\\/g, '/');
  if (!raw || raw.startsWith('/') || raw.includes('..')) return 'venues';
  return isAllowedFolder(raw) ? raw : 'venues';
}

function safeStoragePath(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('/') || raw.includes('..') || raw.includes('\\')) return '';
  return raw;
}

function isPdfFile(fileType: string, fileName: string) {
  return fileType.toLowerCase() === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
}

function getResourceType(fileType: string, fileName: string, folder: string): CloudinaryResourceType | null {
  // Cloudinary recommends uploading normal PDFs as image assets. This keeps
  // the original PDF deliverable and also supports PDF page transformations.
  if (folder === 'venues/menus') return isPdfFile(fileType, fileName) ? 'image' : null;
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  return null;
}

function validateSignedUpload(input: {
  folder: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}) {
  const resourceType = getResourceType(input.fileType, input.fileName, input.folder);
  if (!resourceType) {
    throw new Error('Chỉ hỗ trợ ảnh, video hoặc menu PDF hợp lệ.');
  }
  if (input.fileSize <= 0) throw new Error('File upload không hợp lệ.');

  const menuPdf = input.folder === 'venues/menus' && isPdfFile(input.fileType, input.fileName);
  if (menuPdf && input.fileSize > MAX_PDF_SIZE) {
    throw new Error('PDF quá nặng. Dung lượng tối đa là 10MB.');
  }
  if (!menuPdf && resourceType === 'image' && input.fileSize > MAX_IMAGE_SIZE) {
    throw new Error('Ảnh quá nặng. Dung lượng tối đa là 10MB.');
  }
  if (resourceType === 'video' && input.fileSize > MAX_VIDEO_SIZE) {
    throw new Error('Video quá nặng. Dung lượng tối đa là 80MB.');
  }

  return resourceType;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Upload multipart lên Supabase đã bị tắt. Hãy dùng signed upload trực tiếp lên Cloudinary.',
        },
        { status: 415 },
      );
    }

    const body = await request.json().catch(() => null);
    const folder = safeFolder(body?.folder);
    const fileName = String(body?.fileName || 'media');
    const fileType = String(body?.fileType || '');
    const fileSize = Number(body?.fileSize || 0);
    const resourceType = validateSignedUpload({ folder, fileName, fileType, fileSize });
    const signed = createSignedUpload({ folder, fileName, resourceType });

    return NextResponse.json({
      ok: true,
      provider: CLOUDINARY_PROVIDER,
      ...signed,
    });
  } catch (error) {
    console.error('[upload-media:sign]', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Không thể ký request upload Cloudinary.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const path = safeStoragePath(body?.path);
    if (!path) return NextResponse.json({ ok: true, deleted: false });

    const cloudinaryRef = parseCloudinaryRef(path);
    if (cloudinaryRef) {
      await destroyCloudinaryAsset(cloudinaryRef);
      return NextResponse.json({ ok: true, provider: CLOUDINARY_PROVIDER, deleted: true });
    }

    // Delete-only compatibility for old Supabase Storage paths. This operation
    // does not deliver public media and therefore cannot create Cached Egress.
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Thiếu cấu hình Supabase để xóa media cũ.');
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;

    return NextResponse.json({ ok: true, provider: 'supabase-delete-only', deleted: true });
  } catch (error) {
    console.error('[upload-media:delete]', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Không thể xóa media.' },
      { status: 500 },
    );
  }
}
