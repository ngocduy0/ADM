import { BookingStatus, VipStatus, type Customer, type ReservationRequest, type Venue } from '../components/aurelius/types';

export const BUSINESS_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const NO_SHOW_GRACE_MINUTES = 30;
export const TABLE_TURNOVER_MINUTES = 120;
export const MAX_ADVANCE_BOOKING_DAYS = 730;

export type ValidationIssue = {
  field: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_KEY_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const TERMINAL_STATUSES = new Set<BookingStatus>([
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.NO_SHOW,
]);

const STATUS_TRANSITIONS: Record<BookingStatus, ReadonlySet<BookingStatus>> = {
  [BookingStatus.NEW]: new Set([BookingStatus.CONTACTED, BookingStatus.CONFIRMED, BookingStatus.CANCELLED]),
  [BookingStatus.CONTACTED]: new Set([BookingStatus.CONFIRMED, BookingStatus.CANCELLED]),
  [BookingStatus.CONFIRMED]: new Set([BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]),
  [BookingStatus.COMPLETED]: new Set(),
  [BookingStatus.CANCELLED]: new Set(),
  [BookingStatus.NO_SHOW]: new Set(),
};

export function normalizeVietnamesePhone(value: string) {
  return String(value || '').replace(/[\s.()-]/g, '');
}

export function isVietnamesePhoneNumber(value: string) {
  return /^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(normalizeVietnamesePhone(value));
}

export function isDateKey(value: string) {
  if (!DATE_KEY_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isTimeKey(value: string) {
  return TIME_KEY_RE.test(value);
}

export function bookingDateTime(date: string, time: string) {
  if (!isDateKey(date) || !isTimeKey(time)) return null;
  const parsed = new Date(`${date}T${time}:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function minutesFromMidnight(time: string) {
  if (!isTimeKey(time)) return Number.NaN;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function isWithinOpeningHours(time: string, openingHours?: Venue['openingHours']) {
  if (!openingHours?.open || !openingHours?.close) return true;
  const target = minutesFromMidnight(time);
  const open = minutesFromMidnight(openingHours.open);
  const close = minutesFromMidnight(openingHours.close);
  if (![target, open, close].every(Number.isFinite)) return false;
  if (open === close) return true;
  if (open < close) return target >= open && target <= close;
  return target >= open || target <= close;
}

export function getStatusTransitionDecision(
  reservation: ReservationRequest,
  nextStatus: BookingStatus,
  now: Date = new Date(),
): { allowed: boolean; reason?: string } {
  if (reservation.status === nextStatus) return { allowed: true };

  if (TERMINAL_STATUSES.has(reservation.status)) {
    return { allowed: false, reason: 'Booking đã ở trạng thái kết thúc nên không thể đổi ngược trạng thái.' };
  }

  if (!STATUS_TRANSITIONS[reservation.status].has(nextStatus)) {
    return { allowed: false, reason: 'Trình tự trạng thái không hợp lệ. Hãy xử lý booking theo đúng quy trình.' };
  }

  const scheduledAt = bookingDateTime(reservation.date, reservation.arrivalTime);
  if (!scheduledAt) return { allowed: false, reason: 'Ngày hoặc giờ booking không hợp lệ.' };

  if (nextStatus === BookingStatus.COMPLETED && now.getTime() < scheduledAt.getTime()) {
    return { allowed: false, reason: 'Chưa tới giờ booking nên chưa thể đánh dấu Hoàn tất.' };
  }

  if (nextStatus === BookingStatus.NO_SHOW) {
    const allowedAt = scheduledAt.getTime() + NO_SHOW_GRACE_MINUTES * 60_000;
    if (now.getTime() < allowedAt) {
      return { allowed: false, reason: `Chỉ có thể đánh dấu Không đến sau giờ booking ${NO_SHOW_GRACE_MINUTES} phút.` };
    }
  }

  return { allowed: true };
}

function sameSchedule(a?: ReservationRequest | null, b?: ReservationRequest | null) {
  return Boolean(a && b && a.date === b.date && a.arrivalTime === b.arrivalTime);
}

export function validateReservation(
  reservation: ReservationRequest,
  venues: Venue[],
  reservations: ReservationRequest[] = [],
  options: { now?: Date; existing?: ReservationRequest | null } = {},
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const now = options.now || new Date();
  const existing = options.existing || null;
  const fullName = reservation.fullName.trim();

  if (fullName.length < 2 || fullName.length > 80) {
    issues.push({ field: 'fullName', message: 'Tên khách hàng phải từ 2 đến 80 ký tự.' });
  }
  if (!isVietnamesePhoneNumber(reservation.phoneNumber)) {
    issues.push({ field: 'phoneNumber', message: 'Số điện thoại Việt Nam không hợp lệ.' });
  }
  if (!Number.isInteger(Number(reservation.guestCount)) || reservation.guestCount < 1 || reservation.guestCount > 100) {
    issues.push({ field: 'guestCount', message: 'Số khách phải là số nguyên từ 1 đến 100.' });
  }
  if (!isDateKey(reservation.date)) issues.push({ field: 'date', message: 'Ngày booking không hợp lệ.' });
  if (!isTimeKey(reservation.arrivalTime)) issues.push({ field: 'arrivalTime', message: 'Giờ booking không hợp lệ.' });

  const venue = venues.find((item) => item.id === reservation.venueId);
  if (!venue) {
    issues.push({ field: 'venueId', message: 'Địa điểm không tồn tại hoặc đã bị xóa.' });
  }

  const scheduledAt = bookingDateTime(reservation.date, reservation.arrivalTime);
  if (scheduledAt) {
    const changedSchedule = !sameSchedule(existing, reservation);
    if ((!existing || changedSchedule) && scheduledAt.getTime() < now.getTime() - 60_000) {
      issues.push({ field: 'date', message: 'Không thể tạo hoặc chuyển booking về thời điểm đã qua.' });
    }
    const maxDate = now.getTime() + MAX_ADVANCE_BOOKING_DAYS * 86_400_000;
    if (scheduledAt.getTime() > maxDate) {
      issues.push({ field: 'date', message: `Chỉ nhận booking trước tối đa ${MAX_ADVANCE_BOOKING_DAYS} ngày.` });
    }
  }

  if (venue && !isWithinOpeningHours(reservation.arrivalTime, venue.openingHours)) {
    issues.push({
      field: 'arrivalTime',
      message: `Giờ đến nằm ngoài giờ hoạt động ${venue.openingHours?.label || `${venue.openingHours?.open} - ${venue.openingHours?.close}`}.`,
    });
  }

  const table = venue?.preferredTables.find((item) => item.id === reservation.preferredTableId || item.name === reservation.preferredTableName);
  if (reservation.preferredTableId && !table) {
    issues.push({ field: 'preferredTableId', message: 'Bàn/phòng đã chọn không thuộc địa điểm này.' });
  }
  if (table) {
    if (table.status === 'HIDDEN') issues.push({ field: 'preferredTableId', message: 'Bàn/phòng này đang bị ẩn và không thể nhận booking.' });
    if (reservation.guestCount > table.capacity) {
      issues.push({ field: 'guestCount', message: `Bàn/phòng ${table.name} chỉ phù hợp tối đa ${table.capacity} khách.` });
    }
  }

  if (reservation.status === BookingStatus.COMPLETED || reservation.status === BookingStatus.NO_SHOW) {
    const base = existing || { ...reservation, status: BookingStatus.CONFIRMED };
    const decision = getStatusTransitionDecision({ ...base, status: existing?.status || BookingStatus.CONFIRMED }, reservation.status, now);
    if (!decision.allowed) issues.push({ field: 'status', message: decision.reason || 'Trạng thái chưa hợp lệ.' });
  }

  if (reservation.preferredTableId && scheduledAt && reservation.status !== BookingStatus.CANCELLED) {
    const conflict = reservations.find((item) => {
      if (item.id === reservation.id || item.status === BookingStatus.CANCELLED) return false;
      if (item.venueId !== reservation.venueId || item.preferredTableId !== reservation.preferredTableId) return false;
      const other = bookingDateTime(item.date, item.arrivalTime);
      return Boolean(other && Math.abs(other.getTime() - scheduledAt.getTime()) < TABLE_TURNOVER_MINUTES * 60_000);
    });
    if (conflict) {
      issues.push({
        field: 'preferredTableId',
        message: `Bàn/phòng đã có booking ${conflict.fullName} lúc ${conflict.arrivalTime}. Cần cách nhau ít nhất ${TABLE_TURNOVER_MINUTES} phút.`,
      });
    }
  }

  if (existing && reservation.status !== existing.status) {
    const decision = getStatusTransitionDecision(existing, reservation.status, now);
    if (!decision.allowed && !issues.some((item) => item.field === 'status')) {
      issues.push({ field: 'status', message: decision.reason || 'Không thể đổi trạng thái booking.' });
    }
  }

  return { valid: issues.length === 0, issues };
}


export function validateCustomer(customer: Customer, customers: Customer[] = []): ValidationResult {
  const issues: ValidationIssue[] = [];
  const fullName = customer.fullName.trim();
  if (fullName.length < 2 || fullName.length > 80) {
    issues.push({ field: 'fullName', message: 'Tên khách hàng phải từ 2 đến 80 ký tự.' });
  }
  if (!isVietnamesePhoneNumber(customer.phoneNumber)) {
    issues.push({ field: 'phoneNumber', message: 'Số điện thoại Việt Nam không hợp lệ.' });
  }
  if (!Object.values(VipStatus).includes(customer.vipStatus)) {
    issues.push({ field: 'vipStatus', message: 'Phân hạng khách hàng không hợp lệ.' });
  }
  if ((customer.notes || '').length > 1_000) {
    issues.push({ field: 'notes', message: 'Ghi chú khách hàng không được vượt quá 1.000 ký tự.' });
  }
  const phone = normalizeVietnamesePhone(customer.phoneNumber);
  const duplicate = customers.find((item) => item.id !== customer.id && normalizeVietnamesePhone(item.phoneNumber) === phone);
  if (phone && duplicate) {
    issues.push({ field: 'phoneNumber', message: `Số điện thoại đã thuộc khách hàng ${duplicate.fullName}.` });
  }
  return { valid: issues.length === 0, issues };
}

export function validateVenue(venue: Venue): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (venue.name.trim().length < 2 || venue.name.trim().length > 100) issues.push({ field: 'name', message: 'Tên địa điểm phải từ 2 đến 100 ký tự.' });
  if (venue.location.trim().length < 3 || venue.location.trim().length > 240) issues.push({ field: 'location', message: 'Địa chỉ phải từ 3 đến 240 ký tự.' });
  if (!['Nightclub', 'Karaoke'].includes(venue.category)) issues.push({ field: 'category', message: 'Danh mục địa điểm không hợp lệ.' });
  if (venue.rating < 0 || venue.rating > 5) issues.push({ field: 'rating', message: 'Đánh giá phải nằm trong khoảng 0 đến 5.' });
  if (venue.openingHours && (!isTimeKey(venue.openingHours.open) || !isTimeKey(venue.openingHours.close))) issues.push({ field: 'openingHours', message: 'Giờ mở cửa hoặc đóng cửa không hợp lệ.' });

  const tableIds = new Set<string>();
  const tableNames = new Set<string>();
  for (const table of venue.preferredTables || []) {
    const id = table.id.trim();
    const name = table.name.trim().toLowerCase();
    if (!id || tableIds.has(id)) issues.push({ field: 'preferredTables', message: 'Mã bàn/phòng không được để trống hoặc trùng nhau.' });
    if (!name || tableNames.has(name)) issues.push({ field: 'preferredTables', message: 'Tên bàn/phòng không được để trống hoặc trùng nhau.' });
    tableIds.add(id);
    tableNames.add(name);
    if (table.capacity < 1 || table.capacity > 200) issues.push({ field: 'preferredTables', message: `Sức chứa bàn ${table.name || id} phải từ 1 đến 200.` });
    if (table.minimumSpend < 0) issues.push({ field: 'preferredTables', message: `Minimum spend của bàn ${table.name || id} không được âm.` });
    for (const [key, value] of Object.entries({ x: table.x, y: table.y, width: table.width, height: table.height })) {
      if (value != null && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
        issues.push({ field: 'preferredTables', message: `Tọa độ/kích thước ${key} của bàn ${table.name || id} phải trong khoảng 0–100.` });
      }
    }
  }
  return { valid: issues.length === 0, issues };
}
