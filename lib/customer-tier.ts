import {
  BookingStatus,
  VipStatus,
  type Customer,
  type ReservationRequest,
  type Venue,
} from "@/components/aurelius/types";

export const CUSTOMER_TIER_THRESHOLDS = {
  VIP: 10_000_000,
  VVIP: 30_000_000,
  ELITE: 80_000_000,
} as const;

function areaWeight(area = "") {
  const value = area.toLowerCase();
  if (value.includes("svip") || value.includes("elite")) return 1.5;
  if (value.includes("vip") || value.includes("ktv")) return 1.25;
  if (value.includes("bar")) return 1.1;
  return 1;
}

export function customerWeightedSpend(
  customer: Customer,
  reservations: ReservationRequest[],
  venues: Venue[],
) {
  const phone = customer.phoneNumber.replace(/\D/g, "");
  return reservations
    .filter(
      (item) =>
        item.status === BookingStatus.COMPLETED &&
        item.phoneNumber.replace(/\D/g, "") === phone,
    )
    .reduce((total, item) => {
      const venue = venues.find((entry) => entry.id === item.venueId);
      const table = venue?.preferredTables.find(
        (entry) => entry.id === item.preferredTableId,
      );
      const spend = Number(
        item.preferredTableMinimumSpend ?? table?.minimumSpend ?? 0,
      );
      return total + spend * areaWeight(item.preferredTableArea || table?.area);
    }, 0);
}

export function deriveCustomerTier(
  customer: Customer,
  reservations: ReservationRequest[],
  venues: Venue[],
) {
  const spend = customerWeightedSpend(customer, reservations, venues);
  if (spend >= CUSTOMER_TIER_THRESHOLDS.ELITE) return VipStatus.ELITE;
  if (spend >= CUSTOMER_TIER_THRESHOLDS.VVIP) return VipStatus.VVIP;
  if (spend >= CUSTOMER_TIER_THRESHOLDS.VIP) return VipStatus.VIP;
  return VipStatus.STANDARD;
}
