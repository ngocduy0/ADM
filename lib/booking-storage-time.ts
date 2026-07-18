import { isDateKey, isTimeKey } from '@/lib/booking-rules';
import { BUSINESS_TIME_ZONE } from '@/lib/date-time';

export const BOOKING_WALL_CLOCK_MARKER = '[[DUYT_BOOKING_WALL_CLOCK_V2]]';
const EXPLICIT_ZONE_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const NAIVE_BOOKING_RE = /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,6})?)?$/;

export function encodeBookingNotes(notes?: string | null) {
  const clean = String(notes || '').replace(BOOKING_WALL_CLOCK_MARKER, '').trim();
  return clean ? `${BOOKING_WALL_CLOCK_MARKER}\n${clean}` : BOOKING_WALL_CLOCK_MARKER;
}

export function decodeBookingNotes(notes?: string | null) {
  return String(notes || '').replace(BOOKING_WALL_CLOCK_MARKER, '').trim();
}

/**
 * The current Booking schema stores a timestamp without time zone. Booking
 * date/time is business wall-clock data, so persist the literal Vietnam value
 * rather than converting 19:00 to the UTC instant 12:00.
 */
export function buildBookingStorageDate(date: string, arrivalTime: string) {
  if (!isDateKey(date) || !isTimeKey(arrivalTime)) throw new Error('Invalid booking date/time');
  return `${date}T${arrivalTime}:00.000`;
}

function instantToVietnamParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return {
    date: `${map.get('year')}-${map.get('month')}-${map.get('day')}`,
    time: `${map.get('hour')}:${map.get('minute')}`,
  };
}

/**
 * V2 rows carry a marker and are read as literal Vietnam wall-clock values.
 * Legacy rows have no marker because an ISO UTC value was inserted into a
 * timestamp-without-time-zone column; its stripped UTC suffix is restored
 * before converting to Asia/Ho_Chi_Minh.
 */
export function parseBookingStorageDateTime(value: string, notes?: string | null) {
  const raw = String(value || '').trim();
  const naive = raw.match(NAIVE_BOOKING_RE);

  if (String(notes || '').includes(BOOKING_WALL_CLOCK_MARKER) && naive) {
    return { date: naive[1], time: `${naive[2]}:${naive[3]}` };
  }
  if (EXPLICIT_ZONE_RE.test(raw)) return instantToVietnamParts(raw);
  if (naive) return instantToVietnamParts(`${raw.replace(' ', 'T')}Z`);
  return null;
}
