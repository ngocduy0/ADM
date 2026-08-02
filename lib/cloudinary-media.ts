import { createHash, randomBytes } from 'node:crypto';

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export type CloudinaryReference = {
  resourceType: CloudinaryResourceType;
  publicId: string;
};

function getCloudinaryConfig() {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Thiếu cấu hình Cloudinary. Hãy thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET vào .env.local.',
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function signatureValue(value: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function signCloudinaryParams(
  params: Record<string, string | number | boolean | null | undefined>,
  apiSecret: string,
) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${signatureValue(value as string | number | boolean)}`)
    .join('&');

  return createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
}

function safeBaseName(fileName: string) {
  return String(fileName || 'media')
    .replace(/\.[^/.]+$/, '')
    .replace(/[Đđ]/g, 'd')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 52) || 'media';
}

export function createCloudinaryPublicId(
  folder: string,
  fileName: string,
  resourceType: CloudinaryResourceType = 'image',
) {
  const suffix = randomBytes(4).toString('hex');
  const extension = resourceType === 'raw'
    ? `.${String(fileName).split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'}`
    : '';
  return `adm/${folder}/${safeBaseName(fileName)}-${Date.now()}-${suffix}${extension}`;
}


export function buildCloudinaryRef(resourceType: CloudinaryResourceType, publicId: string) {
  return `cloudinary://${resourceType}/${publicId}`;
}

export function parseCloudinaryRef(value?: string | null): CloudinaryReference | null {
  const raw = String(value || '').trim();
  if (!raw.startsWith('cloudinary://')) return null;

  const body = raw.slice('cloudinary://'.length);
  const separator = body.indexOf('/');
  if (separator <= 0) return null;

  const resourceType = body.slice(0, separator) as CloudinaryResourceType;
  const publicId = body.slice(separator + 1);

  if (!['image', 'video', 'raw'].includes(resourceType) || !publicId) return null;
  return { resourceType, publicId };
}

export function createSignedUpload(input: {
  folder: string;
  fileName: string;
  resourceType: CloudinaryResourceType;
}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = createCloudinaryPublicId(input.folder, input.fileName, input.resourceType);
  const params = {
    overwrite: false,
    public_id: publicId,
    timestamp,
  } as const;

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${input.resourceType}/upload`,
    cloudName,
    apiKey,
    timestamp,
    publicId,
    resourceType: input.resourceType,
    overwrite: false,
    signature: signCloudinaryParams(params, apiSecret),
    path: buildCloudinaryRef(input.resourceType, publicId),
  };
}

export async function destroyCloudinaryAsset(reference: CloudinaryReference) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    invalidate: true,
    public_id: reference.publicId,
    timestamp,
    type: 'upload',
  } as const;

  const form = new FormData();
  form.append('api_key', apiKey);
  form.append('invalidate', 'true');
  form.append('public_id', reference.publicId);
  form.append('signature', signCloudinaryParams(params, apiSecret));
  form.append('timestamp', String(timestamp));
  form.append('type', 'upload');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${reference.resourceType}/destroy`,
    { method: 'POST', body: form, cache: 'no-store' },
  );
  const json = await response.json().catch(() => null);

  if (!response.ok || !json || !['ok', 'not found'].includes(String(json.result || '').toLowerCase())) {
    throw new Error(String(json?.error?.message || json?.result || 'Không thể xóa media Cloudinary.'));
  }

  return json;
}

export async function uploadRemoteAssetToCloudinary(input: {
  sourceUrl: string;
  folder: string;
  fileName: string;
  resourceType: CloudinaryResourceType;
}) {
  const signed = createSignedUpload({
    folder: input.folder,
    fileName: input.fileName,
    resourceType: input.resourceType,
  });
  const form = new FormData();
  form.append('file', input.sourceUrl);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('signature', signed.signature);
  form.append('public_id', signed.publicId);
  form.append('overwrite', 'false');

  const response = await fetch(signed.uploadUrl, {
    method: 'POST',
    body: form,
    cache: 'no-store',
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.secure_url || !json?.public_id) {
    throw new Error(String(json?.error?.message || 'Cloudinary không thể nhập media cũ từ Supabase.'));
  }

  const resourceType = String(json.resource_type || input.resourceType) as CloudinaryResourceType;
  const originalUrl = String(json.secure_url);
  const isPdf = String(json.format || '').toLowerCase() === 'pdf' || /\.pdf(?:$|[?#])/i.test(originalUrl);
  const url = resourceType === 'image' && !isPdf
    ? originalUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto:eco/')
    : originalUrl;
  const posterUrl = resourceType === 'video'
    ? originalUrl
        .replace('/video/upload/', '/video/upload/so_0.6,f_jpg,q_auto:eco/')
        .replace(/\.[a-z0-9]+$/i, '.jpg')
    : undefined;

  return {
    url,
    path: buildCloudinaryRef(resourceType, String(json.public_id)),
    posterUrl,
    resourceType,
  };
}
