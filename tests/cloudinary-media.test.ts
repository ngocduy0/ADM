import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  buildCloudinaryRef,
  createSignedUpload,
  parseCloudinaryRef,
  signCloudinaryParams,
} from '@/lib/cloudinary-media';

test('Cloudinary signature is stable and sorted', () => {
  const signature = signCloudinaryParams(
    { timestamp: 123, public_id: 'adm/test', overwrite: false },
    'secret',
  );
  const expected = createHash('sha1')
    .update('overwrite=false&public_id=adm/test&timestamp=123secret')
    .digest('hex');
  assert.equal(signature, expected);
});

test('Cloudinary reference round trip', () => {
  const reference = buildCloudinaryRef('video', 'adm/reels/demo');
  assert.deepEqual(parseCloudinaryRef(reference), {
    resourceType: 'video',
    publicId: 'adm/reels/demo',
  });
});

test('Signed upload never exposes API secret', () => {
  process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
  process.env.CLOUDINARY_API_KEY = '123';
  process.env.CLOUDINARY_API_SECRET = 'top-secret';

  const signed = createSignedUpload({
    folder: 'reels',
    fileName: 'Đêm vui.mp4',
    resourceType: 'video',
  });

  assert.match(signed.uploadUrl, /demo-cloud\/video\/upload$/);
  assert.match(signed.publicId, /^adm\/reels\/dem-vui-/);
  assert.equal('apiSecret' in signed, false);
  assert.equal(JSON.stringify(signed).includes('top-secret'), false);
});
