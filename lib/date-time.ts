export const BUSINESS_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const NAIVE_DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,6})?)?$/;
const EXPLICIT_ZONE_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const RESERVATION_TIMESTAMP_RE = /(?:^|-)res-(\d{13})(?:-|$)/i;

/**
 * Supabase/Postgres timestamp-without-time-zone values are returned without a
 * suffix. createdAt/updatedAt values in this project are written from
 * new Date().toISOString(), so a suffix-less database value must be treated as
 * UTC rather than as the browser's local time.
 */
export function parseDatabaseTimestamp(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = EXPLICIT_ZONE_RE.test(raw) ? raw : NAIVE_DATE_TIME_RE.test(raw) ? `${raw.replace(' ', 'T')}Z` : raw;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function databaseTimestampMs(value?: string | Date | null) {
  return parseDatabaseTimestamp(value)?.getTime() ?? 0;
}

export function normalizeDatabaseTimestampIso(value?: string | Date | null) {
  return parseDatabaseTimestamp(value)?.toISOString() || new Date(0).toISOString();
}

export function reservationIdTimestamp(id?: string | null) {
  if (!id) return 0;
  const match = String(id).match(RESERVATION_TIMESTAMP_RE) || String(id).match(/(?:^|[^\d])(\d{13})(?:[^\d]|$)/);
  if (!match) return 0;
  const timestamp = Number(match[1]);
  const lowerBound = Date.UTC(2020, 0, 1);
  const upperBound = Date.UTC(2100, 0, 1);
  return Number.isFinite(timestamp) && timestamp >= lowerBound && timestamp <= upperBound ? timestamp : 0;
}

export function reservationEventTimestamp(reservation: { id?: string; createdAt?: string | null }) {
  return reservationIdTimestamp(reservation.id) || databaseTimestampMs(reservation.createdAt);
}

export function reservationEventIso(reservation: { id?: string; createdAt?: string | null }) {
  const timestamp = reservationEventTimestamp(reservation);
  return timestamp ? new Date(timestamp).toISOString() : normalizeDatabaseTimestampIso(reservation.createdAt);
}

export function businessDateTimeParts(value?: string | Date | null) {
  const date = parseDatabaseTimestamp(value);
  if (!date) return null;
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

export function formatDateOnly(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!DATE_ONLY_RE.test(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat('vi-VN', {
    ...(options || { day: '2-digit', month: '2-digit', year: 'numeric' }),
    timeZone: 'UTC',
  }).format(date);
}
