import test from "node:test";
import assert from "node:assert/strict";
import {
  addDateKeyDays,
  formatBusinessSlotLabel,
  getActualBookingDate,
  getBusinessDateForNow,
  getBusinessSlotDisableReason,
  getBusinessTimeSlots,
} from "../lib/business-session";
import {
  getTableAvailability,
  isWithinOpeningHours,
  validateReservation,
} from "../lib/booking-rules";
import {
  BookingStatus,
  type ReservationRequest,
  type Venue,
} from "../components/aurelius/types";

const openingHours = {
  open: "18:00",
  close: "02:00",
  label: "18:00 - 02:00",
};

const venue: Venue = {
  id: "venue-overnight",
  name: "ADM Overnight",
  category: "Nightclub",
  location: "Đà Nẵng",
  shortDescription: "Test",
  longDescription: "Test",
  image: "/about.jpg",
  images: ["/about.jpg"],
  openingHours,
  preferredTables: [
    {
      id: "table-301",
      name: "301",
      area: "Bar Side",
      minimumSpend: 1_200_000,
      capacity: 6,
      description: "",
      status: "AVAILABLE",
      shape: "RECT",
      bookingMode: "REQUEST",
    },
  ],
  rating: 5,
  reviewsCount: 1,
};

function reservation(
  overrides: Partial<ReservationRequest> = {},
): ReservationRequest {
  return {
    id: "res-overnight",
    venueId: venue.id,
    venueName: venue.name,
    fullName: " ",
    phoneNumber: "+84  ",
    guestCount: 4,
    date: "2026-07-23",
    arrivalTime: "23:00",
    preferredTableId: "table-301",
    preferredTableName: "301",
    preferredTableArea: "Bar Side",
    notes: "",
    status: BookingStatus.CONFIRMED,
    createdAt: "2026-07-20T00:00:00.000Z",
    source: "Web Form",
    ...overrides,
  };
}

test("overnight slots run from 18:00 through 01:30 and exclude closing time", () => {
  const slots = getBusinessTimeSlots(openingHours);
  assert.equal(slots[0], "18:00");
  assert.equal(slots.at(-1), "01:30");
  assert.equal(slots.includes("02:00"), false);
  assert.equal(slots.length, 16);
});

test("after-midnight slot is persisted on the following calendar date", () => {
  assert.equal(
    getActualBookingDate("2026-07-23", "23:30", openingHours),
    "2026-07-23",
  );
  assert.equal(
    getActualBookingDate("2026-07-23", "00:30", openingHours),
    "2026-07-24",
  );
  assert.equal(
    formatBusinessSlotLabel("2026-07-23", "00:30", openingHours),
    "00:30 · 24/07 (+1 ngày)",
  );
});

test("business date remains previous day shortly after midnight when a valid slot remains", () => {
  const now = new Date("2026-07-22T17:30:00.000Z"); // 00:30 on 23/07 in Vietnam
  assert.equal(getBusinessDateForNow(openingHours, now, 30), "2026-07-22");
});

test("business date advances when no slot remains after the public lead time", () => {
  const now = new Date("2026-07-22T18:15:00.000Z"); // 01:15 on 23/07 in Vietnam
  assert.equal(getBusinessDateForNow(openingHours, now, 30), "2026-07-23");
});

test("past and too-near slots are disabled while remaining visible", () => {
  const now = new Date("2026-07-23T12:20:00.000Z"); // 19:20 Vietnam
  assert.equal(
    getBusinessSlotDisableReason(
      "2026-07-23",
      "19:00",
      openingHours,
      now,
      30,
    ),
    "PAST",
  );
  assert.equal(
    getBusinessSlotDisableReason(
      "2026-07-23",
      "19:30",
      openingHours,
      now,
      30,
    ),
    "LEAD_TIME",
  );
  assert.equal(
    getBusinessSlotDisableReason(
      "2026-07-23",
      "20:00",
      openingHours,
      now,
      30,
    ),
    null,
  );
});

test("booking before midnight blocks the same table after midnight", () => {
  const existing = reservation({ arrivalTime: "23:00", date: "2026-07-23" });
  const availability = getTableAvailability(
    reservation({
      id: "candidate",
      date: getActualBookingDate("2026-07-23", "00:30", openingHours),
      arrivalTime: "00:30",
      status: BookingStatus.NEW,
    }),
    [existing],
    venue,
  );
  assert.equal(availability.available, false);
  assert.equal(availability.conflict?.id, existing.id);
});

test("closing time is not a valid arrival time", () => {
  assert.equal(isWithinOpeningHours("01:30", openingHours), true);
  assert.equal(isWithinOpeningHours("02:00", openingHours), false);
});

test("public booking lead time is enforced by server validation", () => {
  const result = validateReservation(
    reservation({
      id: "public-near-time",
      date: "2026-07-23",
      arrivalTime: "19:30",
      status: BookingStatus.NEW,
    }),
    [venue],
    [],
    {
      now: new Date("2026-07-23T12:20:00.000Z"),
      minimumLeadMinutes: 30,
    },
  );
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.message.includes("30 phút")));
});

test("date-key arithmetic handles month boundaries", () => {
  assert.equal(addDateKeyDays("2026-07-31", 1), "2026-08-01");
  assert.equal(addDateKeyDays("2026-03-01", -1), "2026-02-28");
});
