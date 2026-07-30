import { BookingStatus, type ReservationRequest, type Venue } from '@/components/aurelius/types';
import { BUSINESS_TIME_ZONE, formatDateOnly, parseDatabaseTimestamp } from '@/lib/date-time';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatVnd(value: number | undefined | null) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function localDateKey(value: Date = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(value?: string | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDateOnly(value, options);
  const date = parseDatabaseTimestamp(value);
  if (!date) return String(value);
  return new Intl.DateTimeFormat('vi-VN', {
    ...(options || { day: '2-digit', month: '2-digit', year: 'numeric' }),
    timeZone: BUSINESS_TIME_ZONE,
  }).format(date);
}

export function formatDateTime(value?: string | Date | null) {
  return formatDate(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

export function getVenueForReservation(reservation: ReservationRequest, venues: Venue[]) {
  return venues.find((venue) => venue.id === reservation.venueId);
}

export function getTableForReservation(reservation: ReservationRequest, venues: Venue[]) {
  const venue = getVenueForReservation(reservation, venues);
  return venue?.preferredTables.find((table) => table.id === reservation.preferredTableId);
}

export function reservationMinimumSpend(reservation: ReservationRequest, venues: Venue[]) {
  return Number(
    reservation.preferredTableMinimumSpend ||
      getTableForReservation(reservation, venues)?.minimumSpend ||
      0,
  );
}

export const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.NEW]: 'Mới',
  [BookingStatus.CONTACTED]: 'Đã liên hệ',
  [BookingStatus.CONFIRMED]: 'Đã xác nhận',
  [BookingStatus.COMPLETED]: 'Hoàn tất',
  [BookingStatus.CANCELLED]: 'Đã hủy',
  [BookingStatus.NO_SHOW]: 'Không đến',
};

export const statusTone: Record<BookingStatus, 'primary' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  [BookingStatus.NEW]: 'warning',
  [BookingStatus.CONTACTED]: 'primary',
  [BookingStatus.CONFIRMED]: 'success',
  [BookingStatus.COMPLETED]: 'neutral',
  [BookingStatus.CANCELLED]: 'danger',
  [BookingStatus.NO_SHOW]: 'danger',
};

export function normalizePhone(value: string) {
  return value.replace(/[\s.-]/g, '');
}

export function isVietnamesePhone(value: string) {
  return /^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(normalizePhone(value));
}

export function downloadText(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function slugId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getMonday(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
