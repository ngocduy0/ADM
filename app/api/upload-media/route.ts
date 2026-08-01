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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'duyt-media';
const CLOUDINARY_PROVIDER = 'cloudinary' as const;

const MAX_VIDEO_SIZE = 80 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_SIZE = 30 * 1024 * 1024;

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

function safeFileName(name: string) {
  const extension = name.split('.').pop()?.toLowerCase() || 'pdf';
  const base = name
    .replace(/\.[^/.]+$/, '')
    .replace(/[Đđ]/g, 'd')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'menu';
  return `${base}-${Date.now()}.${extension}`;
}

function getResourceType(fileType: string, folder: string): CloudinaryResourceType | null {
  if (folder === 'venues/menus') return 'raw';
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
  const resourceType = getResourceType(input.fileType, input.folder);
  if (!resourceType || resourceType === 'raw') {
    throw new Error('Chỉ ảnh và video được upload trực tiếp lên Cloudinary.');
  }

  if (resourceType === 'image' && input.fileSize > MAX_IMAGE_SIZE) {
    throw new Error('Ảnh quá nặng. Dung lượng tối đa là 10MB.');
  }
  if (resourceType === 'video' && input.fileSize > MAX_VIDEO_SIZE) {
    throw new Error('Video quá nặng. Dung lượng tối đa là 80MB.');
  }
  if (input.fileSize <= 0) throw new Error('File upload không hợp lệ.');

  return resourceType;
}

async function uploadMenuPdfToSupabase(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Thiếu cấu hình Supabase để upload menu PDF.' },
      { status: 500 },
    );
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Chưa chọn file PDF.' }, { status: 400 });
  }

  const folder = safeFolder(form.get('folder'));
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (folder !== 'venues/menus' || !isPdf) {
    return NextResponse.json(
      { ok: false, error: 'Endpoint multipart này chỉ dùng để upload menu PDF.' },
      { status: 400 },
    );
  }
  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json({ ok: false, error: 'PDF quá nặng. Dung lượng tối đa là 30MB.' }, { status: 413 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const path = `${folder}/${safeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'application/pdf',
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const oldPath = safeStoragePath(form.get('oldPath'));
  if (oldPath && oldPath !== path && !oldPath.startsWith('cloudinary://')) {
    await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => undefined);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({
    ok: true,
    provider: 'supabase',
    url: data.publicUrl,
    path,
    type: 'application/pdf',
    size: file.size,
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('multipart/form-data')) {
      return uploadMenuPdfToSupabase(request);
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

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Thiếu cấu hình Supabase để xóa media cũ.');
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;

    return NextResponse.json({ ok: true, provider: 'supabase', deleted: true });
  } catch (error) {
    console.error('[upload-media:delete]', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Không thể xóa media.' },
      { status: 500 },
    );
  }
}
