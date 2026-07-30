import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBookingStorageDate, encodeBookingNotes, parseBookingStorageDateTime } from '../lib/booking-storage-time';
import {
  businessDateTimeParts,
  databaseTimestampMs,
  parseDatabaseTimestamp,
  reservationEventTimestamp,
} from '../lib/date-time';

test('database UTC timestamp without suffix is not interpreted as browser local time', () => {
  const parsed = parseDatabaseTimestamp('2026-07-18T11:28:00');
  assert.equal(parsed?.toISOString(), '2026-07-18T11:28:00.000Z');
  assert.deepEqual(businessDateTimeParts('2026-07-18T11:28:00'), {
    date: '2026-07-18',
    time: '18:28',
  });
});

test('explicit timezone timestamp converts to Vietnam time', () => {
  assert.deepEqual(businessDateTimeParts('2026-07-18T12:00:00.000Z'), {
    date: '2026-07-18',
    time: '19:00',
  });
});

test('reservation id timestamp is authoritative for notification ordering', () => {
  const older = { id: 'res-1784360350343', createdAt: '2026-07-18T14:39:00' };
  const newer = { id: 'res-1784374132846', createdAt: '2026-07-18T11:28:00' };
  assert.ok(reservationEventTimestamp(newer) > reservationEventTimestamp(older));
  assert.ok(databaseTimestampMs(newer.createdAt) > 0);
});


test('legacy booking stored as stripped UTC is restored from 12:00 to 19:00 Vietnam time', () => {
  assert.deepEqual(parseBookingStorageDateTime('2026-07-18T12:00:00'), {
    date: '2026-07-18',
    time: '19:00',
  });
});

test('V2 booking preserves literal 19:00 wall-clock time', () => {
  const notes = encodeBookingNotes('Sinh nhật');
  const stored = buildBookingStorageDate('2026-07-18', '19:00');
  assert.equal(stored, '2026-07-18T19:00:00.000');
  assert.deepEqual(parseBookingStorageDateTime(stored, notes), {
    date: '2026-07-18',
    time: '19:00',
  });
});
