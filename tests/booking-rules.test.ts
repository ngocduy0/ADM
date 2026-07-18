import test from 'node:test';
import assert from 'node:assert/strict';
import { BookingStatus, VipStatus, type Customer, type ReservationRequest, type Venue } from '../components/aurelius/types';
import {
  bookingDateTime,
  getStatusTransitionDecision,
  isWithinOpeningHours,
  validateCustomer,
  validateReservation,
  validateVenue,
} from '../lib/booking-rules';

const venue: Venue = {
  id: 'venue-test',
  name: 'ADM Test',
  category: 'Nightclub',
  location: 'Đà Nẵng',
  shortDescription: 'Test venue',
  longDescription: 'Test venue description',
  image: '/about.jpg',
  images: ['/about.jpg'],
  openingHours: { open: '18:00', close: '02:00', label: '18:00 - 02:00' },
  preferredTables: [{
    id: 'table-1', name: 'V01', area: 'VIP', minimumSpend: 1_000_000, capacity: 6,
    description: '', status: 'AVAILABLE', shape: 'RECT', bookingMode: 'REQUEST',
  }],
  rating: 5,
  reviewsCount: 1,
};

function reservation(overrides: Partial<ReservationRequest> = {}): ReservationRequest {
  return {
    id: 'res-test', venueId: venue.id, venueName: venue.name, fullName: 'Nguyễn Văn A',
    phoneNumber: '0901234567', guestCount: 4, date: '2026-07-20', arrivalTime: '21:00',
    preferredTableId: 'table-1', preferredTableName: 'V01', preferredTableArea: 'VIP',
    notes: '', status: BookingStatus.NEW, createdAt: '2026-07-18T00:00:00.000Z', source: 'Web Form',
    ...overrides,
  };
}

test('Vietnam booking time is converted with UTC+7', () => {
  assert.equal(bookingDateTime('2026-07-20', '21:00')?.toISOString(), '2026-07-20T14:00:00.000Z');
});

test('overnight opening hours accept evening and early morning', () => {
  assert.equal(isWithinOpeningHours('23:30', venue.openingHours), true);
  assert.equal(isWithinOpeningHours('01:30', venue.openingHours), true);
  assert.equal(isWithinOpeningHours('12:00', venue.openingHours), false);
});

test('cannot complete before booking time', () => {
  const item = reservation({ status: BookingStatus.CONFIRMED });
  const decision = getStatusTransitionDecision(item, BookingStatus.COMPLETED, new Date('2026-07-20T13:59:00.000Z'));
  assert.equal(decision.allowed, false);
  assert.match(decision.reason || '', /Chưa tới giờ/);
});

test('can complete at or after booking time', () => {
  const item = reservation({ status: BookingStatus.CONFIRMED });
  assert.equal(getStatusTransitionDecision(item, BookingStatus.COMPLETED, new Date('2026-07-20T14:00:00.000Z')).allowed, true);
});

test('no-show requires the configured grace period', () => {
  const item = reservation({ status: BookingStatus.CONFIRMED });
  assert.equal(getStatusTransitionDecision(item, BookingStatus.NO_SHOW, new Date('2026-07-20T14:20:00.000Z')).allowed, false);
  assert.equal(getStatusTransitionDecision(item, BookingStatus.NO_SHOW, new Date('2026-07-20T14:31:00.000Z')).allowed, true);
});

test('terminal booking cannot be reopened', () => {
  const item = reservation({ status: BookingStatus.COMPLETED });
  assert.equal(getStatusTransitionDecision(item, BookingStatus.CONFIRMED, new Date('2026-07-21T00:00:00.000Z')).allowed, false);
});

test('new booking rejects past time, invalid phone and over-capacity', () => {
  const result = validateReservation(
    reservation({ phoneNumber: '123', guestCount: 10, date: '2026-07-17' }),
    [venue],
    [],
    { now: new Date('2026-07-18T00:00:00.000Z') },
  );
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.field === 'phoneNumber'));
  assert.ok(result.issues.some((issue) => issue.field === 'guestCount'));
  assert.ok(result.issues.some((issue) => issue.field === 'date'));
});

test('table conflict inside turnover window is rejected', () => {
  const existing = reservation({ id: 'res-existing', status: BookingStatus.CONFIRMED, arrivalTime: '21:30' });
  const result = validateReservation(reservation(), [venue], [existing], { now: new Date('2026-07-18T00:00:00.000Z') });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.message.includes('cách nhau')));
});

test('valid future booking passes all rules', () => {
  const result = validateReservation(reservation(), [venue], [], { now: new Date('2026-07-18T00:00:00.000Z') });
  assert.equal(result.valid, true, JSON.stringify(result.issues));
});

test('venue validation rejects duplicate table names', () => {
  const result = validateVenue({ ...venue, preferredTables: [venue.preferredTables[0], { ...venue.preferredTables[0], id: 'table-2' }] });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.field === 'preferredTables'));
});

test('status workflow prevents skipping directly from new to completed', () => {
  const item = reservation({ status: BookingStatus.NEW });
  const decision = getStatusTransitionDecision(item, BookingStatus.COMPLETED, new Date('2026-07-21T00:00:00.000Z'));
  assert.equal(decision.allowed, false);
  assert.match(decision.reason || '', /Trình tự trạng thái/);
});

test('new booking can be contacted or confirmed before arrival', () => {
  const item = reservation({ status: BookingStatus.NEW });
  const now = new Date('2026-07-18T00:00:00.000Z');
  assert.equal(getStatusTransitionDecision(item, BookingStatus.CONTACTED, now).allowed, true);
  assert.equal(getStatusTransitionDecision(item, BookingStatus.CONFIRMED, now).allowed, true);
});

test('confirmed booking cannot move backward to contacted', () => {
  const item = reservation({ status: BookingStatus.CONFIRMED });
  assert.equal(getStatusTransitionDecision(item, BookingStatus.CONTACTED, new Date('2026-07-18T00:00:00.000Z')).allowed, false);
});

test('booking outside venue opening hours is rejected', () => {
  const result = validateReservation(
    reservation({ arrivalTime: '12:00' }),
    [venue],
    [],
    { now: new Date('2026-07-18T00:00:00.000Z') },
  );
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.field === 'arrivalTime'));
});

test('booking for an unknown venue or table is rejected', () => {
  const unknownVenue = validateReservation(
    reservation({ venueId: 'missing' }),
    [venue],
    [],
    { now: new Date('2026-07-18T00:00:00.000Z') },
  );
  assert.ok(unknownVenue.issues.some((issue) => issue.field === 'venueId'));

  const unknownTable = validateReservation(
    reservation({ preferredTableId: 'missing-table', preferredTableName: 'Missing table' }),
    [venue],
    [],
    { now: new Date('2026-07-18T00:00:00.000Z') },
  );
  assert.ok(unknownTable.issues.some((issue) => issue.field === 'preferredTableId'));
});

test('hidden table cannot receive a booking', () => {
  const hiddenVenue: Venue = {
    ...venue,
    preferredTables: [{ ...venue.preferredTables[0], status: 'HIDDEN' }],
  };
  const result = validateReservation(
    reservation(),
    [hiddenVenue],
    [],
    { now: new Date('2026-07-18T00:00:00.000Z') },
  );
  assert.ok(result.issues.some((issue) => issue.message.includes('đang bị ẩn')));
});

test('cancelled booking does not block the same table slot', () => {
  const cancelled = reservation({ id: 'res-cancelled', status: BookingStatus.CANCELLED, arrivalTime: '21:30' });
  const result = validateReservation(
    reservation(),
    [venue],
    [cancelled],
    { now: new Date('2026-07-18T00:00:00.000Z') },
  );
  assert.equal(result.valid, true, JSON.stringify(result.issues));
});

test('booking more than the maximum advance window is rejected', () => {
  const result = validateReservation(
    reservation({ date: '2029-01-01' }),
    [venue],
    [],
    { now: new Date('2026-07-18T00:00:00.000Z') },
  );
  assert.ok(result.issues.some((issue) => issue.field === 'date' && issue.message.includes('tối đa')));
});

test('editing an unchanged historical schedule remains possible', () => {
  const existing = reservation({ date: '2026-07-17', status: BookingStatus.CONTACTED });
  const edited = { ...existing, notes: 'Đã gọi lại khách.' };
  const result = validateReservation(
    edited,
    [venue],
    [existing],
    { now: new Date('2026-07-18T00:00:00.000Z'), existing },
  );
  assert.equal(result.valid, true, JSON.stringify(result.issues));
});

test('venue validation rejects invalid hours, capacity, spend and coordinates', () => {
  const result = validateVenue({
    ...venue,
    openingHours: { open: '25:00', close: '02:00', label: 'invalid' },
    preferredTables: [{
      ...venue.preferredTables[0],
      capacity: 0,
      minimumSpend: -1,
      x: 101,
    }],
  });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.field === 'openingHours'));
  assert.ok(result.issues.filter((issue) => issue.field === 'preferredTables').length >= 3);
});


function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-test',
    fullName: 'Nguyễn Văn A',
    phoneNumber: '0901234567',
    notes: '',
    vipStatus: VipStatus.STANDARD,
    favoriteVenueIds: [],
    createdAt: '2026-07-18T00:00:00.000Z',
    ...overrides,
  };
}

test('customer validation accepts a valid Vietnamese profile', () => {
  assert.equal(validateCustomer(customer()).valid, true);
});

test('customer validation rejects duplicate phone, invalid tier and oversized notes', () => {
  const existing = customer({ id: 'cust-existing', fullName: 'Khách cũ' });
  const invalid = customer({
    vipStatus: 'INVALID' as VipStatus,
    notes: 'x'.repeat(1_001),
  });
  const result = validateCustomer(invalid, [existing]);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.field === 'phoneNumber'));
  assert.ok(result.issues.some((issue) => issue.field === 'vipStatus'));
  assert.ok(result.issues.some((issue) => issue.field === 'notes'));
});
