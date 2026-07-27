import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '..');

function read(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

test('venue detail never reuses the lightweight homepage summary as full floor-plan data', () => {
  const source = read('components/aurelius/public/usePublicData.ts');

  assert.doesNotMatch(
    source,
    /venueCache\.get\(safeKey\)\s*\|\|\s*\(venuesCache\s*\?\s*findVenueLocal/,
  );
  assert.doesNotMatch(source, /nextVenues\.forEach\(cacheVenueAliases\)/);
  assert.match(source, /loadVenueFromServer\(requestKey\)/);
  assert.match(source, /const initialVenue = safeId \? venueCache\.get\(safeId\) \|\| null : null/);
});

test('public venue detail API uses the full public venue reader, not booking/customer payloads', () => {
  const source = read('app/api/venues/[id]/route.ts');

  assert.match(source, /const venues = await readPublicVenues\(\)/);
  assert.doesNotMatch(source, /const data = await readAllData\(\);\s*\n\s*const venue = findVenue\(data\.venues, id\)/);
});

test('floating contact bar is restricted to home, fits its content, and stays hidden below Concierge', () => {
  const appSource = read('components/aurelius/App.tsx');
  const shellSource = read('components/aurelius/public/PublicShell.tsx');
  const contactSource = read('components/aurelius/components/FloatingContact.tsx');
  const homepageSource = read('components/aurelius/components/HomepageView.tsx');
  const cssSource = read('app/globals.css');

  assert.match(appSource, /currentView === "HOME" \? <FloatingContact/);
  assert.match(shellSource, /activeView === 'HOME' \? <FloatingContact/);
  assert.match(homepageSource, /id="concierge-contact-trigger"/);
  assert.match(contactSource, /document\.getElementById\("concierge-contact-trigger"\)/);
  assert.match(contactSource, /rootMargin: "-68% 0px -31% 0px"/);
  assert.match(contactSource, /entry\.boundingClientRect\.top <= dockLine/);
  assert.match(contactSource, /w-fit max-w-\[calc\(100vw-20px\)\]/);
  assert.match(contactSource, /w-max max-w-full/);
  assert.doesNotMatch(contactSource, /w-\[min\(860px/);
  assert.match(cssSource, /data-panel-visible="true"[\s\S]*visibility: hidden/);
});
