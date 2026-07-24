"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookingStatus,
  type ReservationRequest,
} from "@/components/aurelius/types";
import {
  getStatusTransitionDecision,
  getTableAvailability,
  validateReservation,
} from "@/lib/booking-rules";
import { useAdminData } from "../AdminDataProvider";
import { localDateKey, slugId, statusLabels } from "../utils";
import { Button } from "../ui/Button";
import { FormField, inputClass, textareaClass } from "../ui/FormField";
import { Modal } from "../ui/Modal";

const sources: ReservationRequest["source"][] = [
  "Web Form",
  "WhatsApp",
  "Zalo",
  "Telegram",
  "Instagram",
];
const countryCodes = [
  "+84",
  "+1",
  "+44",
  "+33",
  "+49",
  "+61",
  "+65",
  "+66",
  "+81",
  "+82",
  "+86",
];

function splitPhone(value: string) {
  const normalized = value.replace(/[\s().-]/g, "");
  const code = countryCodes.find((item) => normalized.startsWith(item));
  if (code) return { code, number: normalized.slice(code.length) };
  if (normalized.startsWith("0"))
    return { code: "+84", number: normalized.slice(1) };
  return { code: "+84", number: normalized };
}

export function BookingFormModal({
  open,
  booking,
  onClose,
}: {
  open: boolean;
  booking?: ReservationRequest | null;
  onClose: () => void;
}) {
  const { venues, reservations, saveReservation, saving, showToast } =
    useAdminData();
  const [phoneCode, setPhoneCode] = useState("+84");
  const [draft, setDraft] = useState({
    fullName: "",
    phoneNumber: "",
    venueId: "",
    guestCount: 2,
    date: localDateKey(),
    arrivalTime: "21:00",
    preferredTableId: "",
    notes: "",
    status: BookingStatus.NEW,
    source: "Web Form" as ReservationRequest["source"],
  });

  useEffect(() => {
    if (!open) return;
    const venueId = booking?.venueId || venues[0]?.id || "";
    const venue = venues.find((item) => item.id === venueId) || venues[0];
    // Reset the editable form whenever a different record is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const phone = splitPhone(booking?.phoneNumber || "");
    setPhoneCode(phone.code);
    setDraft({
      fullName: booking?.fullName || "",
      phoneNumber: phone.number,
      venueId,
      guestCount: booking?.guestCount || 2,
      date: booking?.date || localDateKey(),
      arrivalTime: booking?.arrivalTime || venue?.openingHours?.open || "21:00",
      preferredTableId:
        booking?.preferredTableId || venue?.preferredTables[0]?.id || "",
      notes: booking?.notes || "",
      status: booking?.status || BookingStatus.NEW,
      source: booking?.source || "Web Form",
    });
  }, [booking, open, venues]);

  const venue = useMemo(
    () => venues.find((item) => item.id === draft.venueId),
    [draft.venueId, venues],
  );
  const selectedTable = venue?.preferredTables.find(
    (table) => table.id === draft.preferredTableId,
  );
  const tableAvailability = useMemo(
    () =>
      new Map(
        (venue?.preferredTables || []).map((table) => [
          table.id,
          getTableAvailability(
            {
              id: booking?.id || "",
              venueId: draft.venueId,
              preferredTableId: table.id,
              date: draft.date,
              arrivalTime: draft.arrivalTime,
            },
            reservations,
            venue,
          ),
        ]),
      ),
    [
      booking?.id,
      draft.arrivalTime,
      draft.date,
      draft.venueId,
      reservations,
      venue,
    ],
  );

  useEffect(() => {
    if (!venue || !draft.date || !draft.arrivalTime) return;
    const current = tableAvailability.get(draft.preferredTableId);
    if (current?.available) return;
    const currentArea = venue.preferredTables.find(
      (table) => table.id === draft.preferredTableId,
    )?.area;
    const next =
      venue.preferredTables.find(
        (table) =>
          table.status !== "HIDDEN" &&
          table.area === currentArea &&
          tableAvailability.get(table.id)?.available,
      ) ||
      venue.preferredTables.find(
        (table) =>
          table.status !== "HIDDEN" &&
          tableAvailability.get(table.id)?.available,
      );
    if (next && next.id !== draft.preferredTableId)
      setDraft((value) => ({ ...value, preferredTableId: next.id }));
  }, [
    draft.arrivalTime,
    draft.date,
    draft.preferredTableId,
    tableAvailability,
    venue,
  ]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!venue) return showToast("error", "Vui lòng chọn địa điểm.");

    const candidate: ReservationRequest = {
      id: booking?.id || slugId("res"),
      venueId: venue.id,
      venueName: venue.name,
      fullName: draft.fullName.trim(),
      phoneNumber: `${phoneCode}${draft.phoneNumber.replace(/\D/g, "").replace(/^0+/, "")}`,
      guestCount: Number(draft.guestCount),
      date: draft.date,
      arrivalTime: draft.arrivalTime,
      preferredTableId: selectedTable?.id || "",
      preferredTableName: selectedTable?.name || "Chưa chọn bàn",
      preferredTableArea: selectedTable?.area,
      preferredTableMinimumSpend: selectedTable?.minimumSpend,
      preferredTableColor: selectedTable?.color,
      preferredTableCapacity: selectedTable?.capacity,
      notes: draft.notes.trim(),
      status: draft.status,
      source: draft.source,
      createdAt: booking?.createdAt || new Date().toISOString(),
      referenceCode:
        booking?.referenceCode || `DT-${Date.now().toString().slice(-7)}`,
    };

    const validation = validateReservation(candidate, venues, reservations, {
      existing: booking || null,
    });
    if (!validation.valid)
      return showToast(
        "error",
        validation.issues[0]?.message || "Dữ liệu booking không hợp lệ.",
      );

    try {
      await saveReservation(candidate);
      onClose();
    } catch {
      // Provider already restores optimistic state and displays a clear error.
    }
  };

  return (
    <Modal
      open={open}
      title={booking ? "Chỉnh sửa booking" : "Tạo booking mới"}
      description="Thông tin được đồng bộ ngay với hệ thống đặt chỗ."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="booking-form" disabled={saving}>
            {saving ? "Đang lưu..." : booking ? "Lưu thay đổi" : "Tạo booking"}
          </Button>
        </>
      }
    >
      <form
        id="booking-form"
        onSubmit={submit}
        className="grid gap-5 md:grid-cols-2"
      >
        <FormField label="Họ và tên" required>
          <input
            className={inputClass}
            value={draft.fullName}
            onChange={(event) =>
              setDraft({ ...draft, fullName: event.target.value })
            }
            placeholder="Nguyễn Văn A"
          />
        </FormField>
        <FormField label="Số điện thoại" required>
          <div className="flex gap-2">
            <select
              className={`${inputClass} w-28 shrink-0`}
              value={phoneCode}
              onChange={(event) => setPhoneCode(event.target.value)}
            >
              {countryCodes.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
            <input
              className={inputClass}
              value={draft.phoneNumber}
              onChange={(event) =>
                setDraft({ ...draft, phoneNumber: event.target.value })
              }
              placeholder="901 234 567"
            />
          </div>
        </FormField>
        <FormField label="Địa điểm" required>
          <select
            className={inputClass}
            value={draft.venueId}
            onChange={(event) => {
              const nextVenue = venues.find(
                (item) => item.id === event.target.value,
              );
              setDraft({
                ...draft,
                venueId: event.target.value,
                preferredTableId: nextVenue?.preferredTables[0]?.id || "",
                arrivalTime: nextVenue?.openingHours?.open || draft.arrivalTime,
              });
            }}
          >
            {venues.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label={booking ? "Đổi bàn / khu vực" : "Bàn / khu vực"}
          hint="Bàn đã có lịch vẫn hiển thị nhưng không thể chọn. Hệ thống tự chuyển sang bàn trống cùng khu trước."
        >
          <select
            className={inputClass}
            value={draft.preferredTableId}
            onChange={(event) =>
              setDraft({ ...draft, preferredTableId: event.target.value })
            }
          >
            <option value="">Chưa chọn bàn</option>
            {venue?.preferredTables.map((table) => {
              const availability = tableAvailability.get(table.id);
              const disabled =
                table.status === "HIDDEN" || !availability?.available;
              return (
                <option key={table.id} value={table.id} disabled={disabled}>
                  {table.name} · {table.area} · {table.capacity} khách
                  {disabled ? " · ĐÃ CÓ LỊCH" : ""}
                </option>
              );
            })}
          </select>
        </FormField>
        <FormField label="Ngày đến" required>
          <input
            type="date"
            min={localDateKey()}
            className={inputClass}
            value={draft.date}
            onChange={(event) =>
              setDraft({ ...draft, date: event.target.value })
            }
          />
        </FormField>
        <FormField
          label="Giờ đến"
          required
          hint={
            venue?.openingHours?.label
              ? `Giờ hoạt động: ${venue.openingHours.label}`
              : undefined
          }
        >
          <input
            type="time"
            className={inputClass}
            value={draft.arrivalTime}
            onChange={(event) =>
              setDraft({ ...draft, arrivalTime: event.target.value })
            }
          />
        </FormField>
        <FormField label="Số khách" required>
          <input
            type="number"
            min={1}
            max={50}
            className={inputClass}
            value={draft.guestCount}
            onChange={(event) =>
              setDraft({ ...draft, guestCount: Number(event.target.value) })
            }
          />
        </FormField>
        <FormField label="Nguồn booking">
          <select
            className={inputClass}
            value={draft.source}
            onChange={(event) =>
              setDraft({
                ...draft,
                source: event.target.value as ReservationRequest["source"],
              })
            }
          >
            {sources.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Trạng thái"
          hint={
            booking
              ? "Các trạng thái kết thúc chỉ mở khi đã tới giờ booking."
              : "Booking mới không được tạo ở trạng thái kết thúc trước giờ đến."
          }
        >
          <select
            className={inputClass}
            value={draft.status}
            onChange={(event) =>
              setDraft({
                ...draft,
                status: event.target.value as BookingStatus,
              })
            }
          >
            {Object.values(BookingStatus).map((status) => {
              const decision = booking
                ? getStatusTransitionDecision(booking, status)
                : {
                    allowed:
                      status !== BookingStatus.COMPLETED &&
                      status !== BookingStatus.NO_SHOW,
                  };
              return (
                <option
                  key={status}
                  value={status}
                  disabled={status !== draft.status && !decision.allowed}
                >
                  {statusLabels[status]}
                </option>
              );
            })}
          </select>
        </FormField>
        <FormField label="Ghi chú" className="md:col-span-2">
          <textarea
            className={textareaClass}
            value={draft.notes}
            onChange={(event) =>
              setDraft({ ...draft, notes: event.target.value })
            }
            placeholder="Sinh nhật, setup bàn, yêu cầu đặc biệt..."
          />
        </FormField>
      </form>
    </Modal>
  );
}
