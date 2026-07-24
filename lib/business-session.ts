export type OpeningHoursLike = {
  open: string;
  close: string;
  label?: string;
};

export const DEFAULT_OPENING_HOURS: OpeningHoursLike = {
  open: "18:00",
  close: "02:00",
  label: "18:00 - 02:00",
};

export const BUSINESS_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const PUBLIC_BOOKING_LEAD_MINUTES = 30;
export const BOOKING_SLOT_INTERVAL_MINUTES = 30;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_KEY_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function timeToMinutes(time: string) {
  if (!TIME_KEY_RE.test(time)) return Number.NaN;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function isOvernightOpeningHours(openingHours: OpeningHoursLike) {
  const open = timeToMinutes(openingHours.open);
  const close = timeToMinutes(openingHours.close);
  return Number.isFinite(open) && Number.isFinite(close) && close <= open;
}

export function addDateKeyDays(dateKey: string, days: number) {
  if (!DATE_KEY_RE.test(dateKey)) return dateKey;
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getBusinessDateTimeParts(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return {
    date: `${map.get("year")}-${map.get("month")}-${map.get("day")}`,
    time: `${map.get("hour")}:${map.get("minute")}`,
  };
}

export function getBusinessTimeSlots(
  openingHours: OpeningHoursLike = DEFAULT_OPENING_HOURS,
  intervalMinutes = BOOKING_SLOT_INTERVAL_MINUTES,
) {
  const start = timeToMinutes(openingHours.open);
  let end = timeToMinutes(openingHours.close);
  if (![start, end].every(Number.isFinite) || intervalMinutes <= 0) return [];
  if (end <= start) end += 24 * 60;

  const result: string[] = [];
  // Closing time is exclusive: a venue closing at 02:00 accepts the final
  // arrival slot at 01:30 when using 30-minute intervals.
  for (let value = start; value < end; value += intervalMinutes) {
    const normalized = value % (24 * 60);
    result.push(
      `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`,
    );
  }
  return result;
}

export function getActualBookingDate(
  businessDate: string,
  arrivalTime: string,
  openingHours: OpeningHoursLike = DEFAULT_OPENING_HOURS,
) {
  if (!DATE_KEY_RE.test(businessDate) || !TIME_KEY_RE.test(arrivalTime)) {
    return businessDate;
  }

  if (!isOvernightOpeningHours(openingHours)) return businessDate;
  const target = timeToMinutes(arrivalTime);
  const close = timeToMinutes(openingHours.close);
  return target < close ? addDateKeyDays(businessDate, 1) : businessDate;
}

export function getBusinessSlotDateTime(
  businessDate: string,
  arrivalTime: string,
  openingHours: OpeningHoursLike = DEFAULT_OPENING_HOURS,
) {
  const actualDate = getActualBookingDate(
    businessDate,
    arrivalTime,
    openingHours,
  );
  if (!DATE_KEY_RE.test(actualDate) || !TIME_KEY_RE.test(arrivalTime)) {
    return null;
  }
  const parsed = new Date(`${actualDate}T${arrivalTime}:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isBusinessSlotNextDay(
  businessDate: string,
  arrivalTime: string,
  openingHours: OpeningHoursLike = DEFAULT_OPENING_HOURS,
) {
  return (
    getActualBookingDate(businessDate, arrivalTime, openingHours) !==
    businessDate
  );
}

export function getBusinessDateForNow(
  openingHours: OpeningHoursLike = DEFAULT_OPENING_HOURS,
  now: Date = new Date(),
  leadMinutes = PUBLIC_BOOKING_LEAD_MINUTES,
) {
  const current = getBusinessDateTimeParts(now);
  if (!isOvernightOpeningHours(openingHours)) return current.date;

  const currentMinutes = timeToMinutes(current.time);
  const closeMinutes = timeToMinutes(openingHours.close);
  if (currentMinutes >= closeMinutes) return current.date;

  const previousBusinessDate = addDateKeyDays(current.date, -1);
  const hasBookableSlot = getBusinessTimeSlots(openingHours).some((time) => {
    const slot = getBusinessSlotDateTime(
      previousBusinessDate,
      time,
      openingHours,
    );
    return Boolean(
      slot && slot.getTime() >= now.getTime() + leadMinutes * 60_000,
    );
  });

  return hasBookableSlot ? previousBusinessDate : current.date;
}

export function getFirstBookableTime(
  businessDate: string,
  openingHours: OpeningHoursLike = DEFAULT_OPENING_HOURS,
  now: Date = new Date(),
  leadMinutes = PUBLIC_BOOKING_LEAD_MINUTES,
) {
  const threshold = now.getTime() + leadMinutes * 60_000;
  return (
    getBusinessTimeSlots(openingHours).find((time) => {
      const slot = getBusinessSlotDateTime(businessDate, time, openingHours);
      return Boolean(slot && slot.getTime() >= threshold);
    }) || getBusinessTimeSlots(openingHours)[0] || openingHours.open
  );
}

export type BusinessSlotDisableReason = "PAST" | "LEAD_TIME" | null;

export function getBusinessSlotDisableReason(
  businessDate: string,
  arrivalTime: string,
  openingHours: OpeningHoursLike = DEFAULT_OPENING_HOURS,
  now: Date = new Date(),
  leadMinutes = PUBLIC_BOOKING_LEAD_MINUTES,
): BusinessSlotDisableReason {
  const slot = getBusinessSlotDateTime(
    businessDate,
    arrivalTime,
    openingHours,
  );
  if (!slot || slot.getTime() <= now.getTime()) return "PAST";
  if (slot.getTime() < now.getTime() + leadMinutes * 60_000) {
    return "LEAD_TIME";
  }
  return null;
}

export function formatDateKeyShort(dateKey: string) {
  if (!DATE_KEY_RE.test(dateKey)) return dateKey;
  const [, month, day] = dateKey.split("-");
  return `${day}/${month}`;
}

export function formatBusinessSlotLabel(
  businessDate: string,
  arrivalTime: string,
  openingHours: OpeningHoursLike = DEFAULT_OPENING_HOURS,
  nextDayLabel = "+1 ngày",
) {
  if (!isBusinessSlotNextDay(businessDate, arrivalTime, openingHours)) {
    return arrivalTime;
  }
  const actualDate = getActualBookingDate(
    businessDate,
    arrivalTime,
    openingHours,
  );
  return `${arrivalTime} · ${formatDateKeyShort(actualDate)} (${nextDayLabel})`;
}
