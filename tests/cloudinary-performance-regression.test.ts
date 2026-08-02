import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

test('Cloudinary upload is signed server-side and sent directly from the admin browser', () => {
  const route = read('app/api/upload-media/route.ts');
  const provider = read('components/admin/AdminDataProvider.tsx');
  const helper = read('lib/cloudinary-media.ts');

  assert.match(route, /createSignedUpload/);
  assert.match(route, /CLOUDINARY/);
  assert.match(provider, /signed\.uploadUrl/);
  assert.match(provider, /cloudinaryForm\.append\('file', file\)/);
  assert.match(provider, /cloudinary:\/\//);
  assert.match(helper, /CLOUDINARY_API_SECRET/);
  assert.doesNotMatch(provider, /CLOUDINARY_API_SECRET/);
});

test('hero typewriter, contact CTA and mobile autoplay safeguards are present', () => {
  const homepage = read('components/aurelius/components/HomepageView.tsx');

  assert.match(homepage, /DUYT Booking ĐÀ NẴNG/);
  assert.match(homepage, /delay = 3000/);
  assert.match(homepage, /onNavigate\("CONTACT"\)/);
  assert.match(homepage, /Book Now/);
  assert.match(homepage, /autoPlay/);
  assert.match(homepage, /muted/);
  assert.match(homepage, /playsInline/);
  assert.match(homepage, /preload="metadata"/);
  assert.match(homepage, /duyt-hero-title-face/);
  assert.match(homepage, /duyt-hero-book-halo/);
});

test('public reels load on first visibility, stay mounted, pause offscreen and use posters first', () => {
  const homepage = read('components/aurelius/components/HomepageView.tsx');
  const detail = read('components/aurelius/components/VenueDetailView.tsx');

  assert.match(detail, /getReelPermalink\(reel\.instagramUrl\)/);
  assert.doesNotMatch(detail, /reel\.instagramUrl\s*\|\|\s*reel\.videoUrl/);

  for (const source of [homepage, detail]) {
    assert.match(source, /IntersectionObserver/);
    assert.match(source, /intersectionRatio >= 0\.45/);
    assert.match(source, /setHasLoaded\(true\)/);
    assert.match(source, /hasLoaded/);
    assert.match(source, /preload="none"/);
    assert.match(source, /\.pause\(\)/);
    assert.match(source, /loading="lazy"/);
  }
});

test('reels are limited to ten and old Cloudinary media is cleaned after save', () => {
  const editor = read('components/admin/pages/ReelEditorPage.tsx');
  const list = read('components/admin/pages/ReelsPage.tsx');
  const banners = read('components/admin/pages/BannersPage.tsx');

  const reelRoute = read('app/api/venues/[id]/reels/route.ts');
  const provider = read('components/admin/AdminDataProvider.tsx');

  assert.match(editor, /const MAX_REELS = 10/);
  assert.match(editor, /totalReels >= MAX_REELS/);
  assert.match(editor, /result\.posterUrl/);
  assert.match(editor, /không bắt buộc/);
  assert.match(editor, /DEFAULT_INSTAGRAM_URL/);
  assert.doesNotMatch(editor, /posterInput/);
  assert.match(list, /totalReelCount < 10/);
  assert.match(list, /saveVenueReels/);
  assert.match(list, /deleteMedia\(deleteTarget\.reel\.videoPath\)/);
  assert.match(provider, /so_0\.6,f_jpg,q_auto:eco/);
  assert.match(reelRoute, /updateVenueReelsFast/);
  assert.doesNotMatch(reelRoute, /validateVenue/);
  assert.match(banners, /stalePaths\.map\(\(path\) => deleteMedia\(path\)\)/);
});


test('global reel reorder, legacy media cleanup, graffiti hero and lightning CTA are present', () => {
  const list = read('components/admin/pages/ReelsPage.tsx');
  const provider = read('components/admin/AdminDataProvider.tsx');
  const reorderRoute = read('app/api/reels/reorder/route.ts');
  const cleanupRoute = read('app/api/admin-data/clear-supabase-media/route.ts');
  const repository = read('lib/concierge-repository.ts');
  const css = read('app/globals.css');
  const homepage = read('components/aurelius/components/HomepageView.tsx');

  assert.match(list, /reorderReels\(ordered\)/);
  assert.match(provider, /\/api\/reels\/reorder/);
  assert.match(reorderRoute, /reorderVenueReelsFast/);
  assert.match(cleanupRoute, /clearLegacySupabaseMediaFast/);
  assert.match(repository, /delete legacy VenueImage/);
  assert.match(repository, /homepage\/banner\/posters/);
  assert.match(css, /font-family: "Bungee"/);
  assert.match(css, /duytLightningFlash/);
  assert.match(homepage, /duyt-lightning-bolt--four/);
});


test('public homepage preserves reel order zero so dashboard and website stay aligned', () => {
  const homepage = read('components/aurelius/components/HomepageView.tsx');
  const detail = read('components/aurelius/components/VenueDetailView.tsx');
  const admin = read('components/admin/pages/ReelsPage.tsx');

  assert.match(admin, /Number\(a\.reel\.order \?\? 0\)/);
  assert.doesNotMatch(homepage, /Number\(a\.order\) \|\| 9999/);
  assert.doesNotMatch(detail, /Number\(a\.order\) \|\| 999/);
  assert.match(homepage, /Number\.isFinite\(aOrder\)/);
  assert.match(detail, /Number\.isFinite\(aOrder\)/);
});

test('Supabase Storage is delete-only and menu PDFs upload to Cloudinary raw assets', () => {
  const route = read('app/api/upload-media/route.ts');
  const provider = read('components/admin/AdminDataProvider.tsx');
  const venueForm = read('components/admin/forms/VenueFormModal.tsx');
  const repository = read('lib/concierge-repository.ts');

  assert.match(route, /folder === 'venues\/menus'/);
  assert.match(route, /return isPdfFile\(fileType, fileName\) \? 'raw' : null/);
  assert.doesNotMatch(route, /\.upload\(path, buffer/);
  assert.doesNotMatch(route, /getPublicUrl/);
  assert.match(provider, /fileType = isPdf \? 'application\/pdf'/);
  assert.doesNotMatch(provider, /form\.append\('oldPath'/);
  assert.match(venueForm, /uploadMedia\(file, 'venues\/menus'\)/);
  assert.match(venueForm, /Menu PDF \(Cloudinary\)/);
  assert.match(repository, /uploadRemoteAssetToCloudinary/);
  assert.match(repository, /migratedToCloudinary/);
});
