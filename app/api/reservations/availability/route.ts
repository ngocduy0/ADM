import { NextResponse } from "next/server";
import { BookingStatus } from "@/components/aurelius/types";
import { getTableAvailability, isDateKey } from "@/lib/booking-rules";
import {
  DEFAULT_OPENING_HOURS,
  getActualBookingDate,
  getBusinessTimeSlots,
} from "@/lib/business-session";
import { readAllData } from "@/lib/concierge-repository";
import { consumeRateLimit, getClientIp } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rate = consumeRateLimit(`availability:${getClientIp(request)}`, 120, 5 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Bạn đang kiểm tra tình trạng bàn quá nhanh. Vui lòng thử lại sau." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const venueId = url.searchParams.get("venueId") || "";
  // `businessDate` is the date on which the venue opens. Keep `date` as a
  // backwards-compatible alias for older clients.
  const businessDate =
    url.searchParams.get("businessDate") || url.searchParams.get("date") || "";
  const excludeId = url.searchParams.get("excludeId") || "";
  if (!venueId || !isDateKey(businessDate)) {
    return NextResponse.json(
      { ok: false, error: "Thiếu địa điểm hoặc ngày hoạt động hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const data = await readAllData();
    const venue = data.venues.find((item) => item.id === venueId);
    if (!venue) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy địa điểm." },
        { status: 404 },
      );
    }

    const active = data.reservations.filter(
      (item) =>
        item.id !== excludeId &&
        item.status !== BookingStatus.CANCELLED &&
        item.status !== BookingStatus.NO_SHOW,
    );
    const openingHours = venue.openingHours || DEFAULT_OPENING_HOURS;
    const timeSlots = getBusinessTimeSlots(openingHours);
    const slotDates = Object.fromEntries(
      timeSlots.map((time) => [
        time,
        getActualBookingDate(businessDate, time, openingHours),
      ]),
    );

    const tables = venue.preferredTables.map((table) => ({
      id: table.id,
      status: table.status || "AVAILABLE",
      slots: Object.fromEntries(
        timeSlots.map((time) => {
          const actualDate = slotDates[time];
          const result = getTableAvailability(
            {
              id: excludeId,
              venueId,
              preferredTableId: table.id,
              date: actualDate,
              arrivalTime: time,
            },
            active,
            venue,
          );
          return [
            time,
            result.available
              ? null
              : {
                  blocked: true,
                },
          ];
        }),
      ),
    }));

    return NextResponse.json({
      ok: true,
      data: {
        venueId,
        businessDate,
        timeSlots,
        slotDates,
        tables,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Không kiểm tra được tình trạng bàn.",
      },
      { status: 503 },
    );
  }
}
