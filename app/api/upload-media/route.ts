import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { COOKIE_NAME, isValidAdminSession } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'duyt-media';

const MAX_VIDEO_SIZE = 750 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_SIZE = 50 * 1024 * 1024;
const BANNER_KEEP_LATEST = 2;

const ALLOWED_FOLDERS = new Set([
  'venues',
  'venues/menus',
  'reels',
  'reels/posters',
  'homepage/banner',
  'homepage/banner/posters',
  'brand/logo',
]);

type ParsedUploadFile = {
  fieldName: string;
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
};

type ParsedMultipart = {
  fields: Record<string, string>;
  files: ParsedUploadFile[];
};

function safeFileName(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || 'bin';

  const base = name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${base || 'media'}-${Date.now()}.${ext}`;
}

function safeStoragePath(value: string | null | undefined) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('..') || raw.startsWith('/') || raw.includes('\\')) return '';
  return raw;
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

async function writeSecurityLog(
  supabase: SupabaseClient<any, any, any>,
  event: string,
  request: NextRequest,
  metadata: Record<string, unknown> = {}
) {
  try {
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
    console.warn(
      '[upload-media:security-log:optional]',
      error instanceof Error ? error.message : error
    );
  }
}

async function cleanupBannerFolder(
  supabase: SupabaseClient<any, any, any>,
  folder: string,
  currentPath: string,
  oldPath?: string
) {
  const removePaths = new Set<string>();

  if (oldPath && oldPath !== currentPath && oldPath.startsWith(`${folder}/`)) {
    removePaths.add(oldPath);
  }

  if (folder === 'homepage/banner' || folder === 'homepage/banner/posters') {
    const { data } = await supabase.storage.from(BUCKET).list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    const files = (data || [])
      .filter((item) => item.name && !item.name.endsWith('/'))
      .map((item) => `${folder}/${item.name}`)
      .filter((path) => path !== currentPath);

    files
      .slice(Math.max(BANNER_KEEP_LATEST - 1, 0))
      .forEach((path) => removePaths.add(path));
  }

  if (removePaths.size > 0) {
    await supabase.storage.from(BUCKET).remove(Array.from(removePaths));
  }
}

function getMultipartBoundary(contentType: string) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match?.[1] || match?.[2] || '';
}

function parseContentDisposition(value: string) {
  const nameMatch =
    value.match(/(?:^|;\s*)name="([^"]*)"/i) ||
    value.match(/(?:^|;\s*)name=([^;]*)/i);

  const fileNameMatch =
    value.match(/(?:^|;\s*)filename="([^"]*)"/i) ||
    value.match(/(?:^|;\s*)filename=([^;]*)/i);

  const encodedFileNameMatch = value.match(/(?:^|;\s*)filename\*=UTF-8''([^;]*)/i);

  let fileName = fileNameMatch?.[1]?.trim() || '';

  if (encodedFileNameMatch?.[1]) {
    try {
      fileName = decodeURIComponent(encodedFileNameMatch[1]);
    } catch {
      fileName = encodedFileNameMatch[1];
    }
  }

  return {
    name: nameMatch?.[1]?.trim() || '',
    fileName,
  };
}

function parseMultipartBody(buffer: Buffer, contentType: string): ParsedMultipart {
  const boundary = getMultipartBoundary(contentType);

  if (!boundary) {
    throw new Error('Thiếu multipart boundary. Vui lòng chọn lại file và thử upload lại.');
  }

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const headerSeparator = Buffer.from('\r\n\r\n');

  const fields: Record<string, string> = {};
  const files: ParsedUploadFile[] = [];

  let cursor = buffer.indexOf(boundaryBuffer);

  while (cursor !== -1) {
    cursor += boundaryBuffer.length;

    if (buffer[cursor] === 45 && buffer[cursor + 1] === 45) break;

    if (buffer[cursor] === 13 && buffer[cursor + 1] === 10) {
      cursor += 2;
    }

    const nextBoundary = buffer.indexOf(boundaryBuffer, cursor);
    if (nextBoundary === -1) break;

    let part = buffer.subarray(cursor, nextBoundary);

    if (part.length >= 2 && part[part.length - 2] === 13 && part[part.length - 1] === 10) {
      part = part.subarray(0, part.length - 2);
    }

    const headerEnd = part.indexOf(headerSeparator);

    if (headerEnd !== -1) {
      const rawHeaders = part.subarray(0, headerEnd).toString('latin1');
      const body = part.subarray(headerEnd + headerSeparator.length);

      const headers: Record<string, string> = {};

      rawHeaders.split('\r\n').forEach((line) => {
        const index = line.indexOf(':');
        if (index > -1) {
          const key = line.slice(0, index).trim().toLowerCase();
          const value = line.slice(index + 1).trim();
          headers[key] = value;
        }
      });

      const disposition = headers['content-disposition'] || '';
      const { name, fileName } = parseContentDisposition(disposition);

      if (name) {
        if (fileName) {
          files.push({
            fieldName: name,
            name: fileName,
            type: headers['content-type'] || 'application/octet-stream',
            size: body.length,
            buffer: body,
          });
        } else {
          fields[name] = body.toString('utf8').trim();
        }
      }
    }

    cursor = nextBoundary;
  }

  return { fields, files };
}

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get(COOKIE_NAME)?.value;

    if (!isValidAdminSession(session)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Phiên đăng nhập admin đã hết hạn. Vui lòng đăng nhập lại trước khi upload.',
        },
        { status: 401 }
      );
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Thiếu cấu hình Supabase upload. Kiểm tra NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Request upload không đúng định dạng multipart/form-data.',
        },
        { status: 400 }
      );
    }

    const rawBody = Buffer.from(await request.arrayBuffer());
    const parsed = parseMultipartBody(rawBody, contentType);

    const file = parsed.files.find((item) => item.fieldName === 'file') || parsed.files[0];

    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Chưa chọn file để upload.',
        },
        { status: 400 }
      );
    }

    const requestedFolder = parsed.fields.folder || 'uploads';
    const folder = ALLOWED_FOLDERS.has(requestedFolder) ? requestedFolder : 'venues';
    const oldPath = safeStoragePath(parsed.fields.oldPath);

    const fileName = file.name || 'upload.bin';
    const lowerName = fileName.toLowerCase();

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');

    if (folder === 'venues/menus') {
      if (!isPdf) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Menu chỉ cho phép upload file PDF.',
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_PDF_SIZE) {
        return NextResponse.json(
          {
            ok: false,
            error: 'File PDF quá nặng. Dung lượng tối đa là 50MB.',
          },
          { status: 413 }
        );
      }
    } else {
      if (!isImage && !isVideo) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Chỉ cho phép upload file ảnh hoặc video.',
          },
          { status: 400 }
        );
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Ảnh quá nặng. Dung lượng tối đa là 10MB.',
          },
          { status: 413 }
        );
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Video quá nặng. Dung lượng tối đa là 750MB.',
          },
          { status: 413 }
        );
      }
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const path = `${folder}/${safeFileName(fileName)}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer as any, {
      contentType: isPdf ? 'application/pdf' : file.type || 'application/octet-stream',
      cacheControl: '31536000',
      upsert: false,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    await cleanupBannerFolder(supabase, folder, path, oldPath || undefined);

    await writeSecurityLog(supabase, 'MEDIA_UPLOAD', request, {
      folder,
      path,
      oldPath: oldPath || null,
      fileName,
      type: file.type,
      size: file.size,
    });

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      url: data.publicUrl,
      path,
      type: isPdf ? 'application/pdf' : file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('[upload-media:error]', error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Upload thất bại.',
      },
      { status: 500 }
    );
  }
}