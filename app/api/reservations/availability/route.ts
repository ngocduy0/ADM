import { NextResponse } from "next/server";
import { BookingStatus } from "@/components/aurelius/types";
import { getTableAvailability, isDateKey } from "@/lib/booking-rules";
import { readAllData } from "@/lib/concierge-repository";

export const dynamic = "force-dynamic";

function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function slots(open: string, close: string) {
  const start = minutes(open);
  let end = minutes(close);
  if (end <= start) end += 1440;
  const result: string[] = [];
  for (let value = start; value <= end; value += 30) {
    const normalized = value % 1440;
    result.push(
      `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`,
    );
  }
  return result;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const venueId = url.searchParams.get("venueId") || "";
  const date = url.searchParams.get("date") || "";
  const excludeId = url.searchParams.get("excludeId") || "";
  if (!venueId || !isDateKey(date))
    return NextResponse.json(
      { ok: false, error: "Thiếu địa điểm hoặc ngày hợp lệ." },
      { status: 400 },
    );

  try {
    const data = await readAllData();
    const venue = data.venues.find((item) => item.id === venueId);
    if (!venue)
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy địa điểm." },
        { status: 404 },
      );
    const active = data.reservations.filter(
      (item) =>
        item.id !== excludeId &&
        item.status !== BookingStatus.CANCELLED &&
        item.status !== BookingStatus.NO_SHOW,
    );
    const timeSlots = slots(
      venue.openingHours?.open || "18:00",
      venue.openingHours?.close || "02:00",
    );
    const tables = venue.preferredTables.map((table) => ({
      id: table.id,
      slots: Object.fromEntries(
        timeSlots.map((time) => {
          const result = getTableAvailability(
            {
              id: excludeId,
              venueId,
              preferredTableId: table.id,
              date,
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
                  reservationId: result.conflict?.id,
                  customer: result.conflict?.fullName,
                  bookedAt: result.conflict?.arrivalTime,
                  blockedUntil: result.blockedUntil?.toISOString(),
                },
          ];
        }),
      ),
    }));
    return NextResponse.json({
      ok: true,
      data: { venueId, date, timeSlots, tables },
    });
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
