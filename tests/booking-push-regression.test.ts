import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  ADMIN_BOOKING_REQUEST_HEADER,
  isExplicitAdminBookingRequest,
} from '@/lib/reservation-request-mode';

test('public venue booking remains public even when the browser has an admin session', () => {
  const request = new Request('https://duyt.example/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  assert.equal(isExplicitAdminBookingRequest(request, true), false);
});

test('admin booking mutation requires both a valid session and the explicit admin header', () => {
  const request = new Request('https://duyt.example/api/reservations', {
    method: 'POST',
    headers: { [ADMIN_BOOKING_REQUEST_HEADER]: '1' },
  });

  assert.equal(isExplicitAdminBookingRequest(request, false), false);
  assert.equal(isExplicitAdminBookingRequest(request, true), true);
});

test('only the admin data provider opts into admin booking mode', () => {
  const provider = readFileSync('components/admin/AdminDataProvider.tsx', 'utf8');
  const publicVenue = readFileSync('components/aurelius/public/VenueDetailPageClient.tsx', 'utf8');
  const reservationsRoute = readFileSync('app/api/reservations/route.ts', 'utf8');

  assert.match(provider, /createReservationOnServer\(reservation, \{ adminMode: true \}\)/);
  assert.doesNotMatch(publicVenue, /adminMode:\s*true/);
  assert.match(reservationsRoute, /if \(!isAdminMutation\)[\s\S]*sendAdminPush\(buildBookingPushPayload\(saved\)\)/);
});
