import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  Send,
  Users,
} from "lucide-react";
import { Venue, ReservationRequest, PreferredTable } from "../types";
import { useI18n } from "../i18n";
import {
  buildReservationMessage,
  buildContactUrl,
  getContactChannels,
} from "../contactConfig";
import { usePublicSettings } from "../public/usePublicData";

interface ReservationFormProps {
  venue: Venue;
  onSubmit: (
    formData: Omit<
      ReservationRequest,
      "id" | "venueId" | "venueName" | "status" | "createdAt" | "source"
    >,
  ) => Promise<void> | void;
  onClose?: () => void;
  initialPreferredTableId?: string;
}

type SubmittedReservation = Omit<
  ReservationRequest,
  "id" | "venueId" | "venueName" | "status" | "createdAt" | "source"
> & {
  venueName: string;
  area: string;
  minSpend: number;
  referenceCode: string;
};

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

function isValidPhone(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s().-]/g, ""));
}

function getLocalDateInputValue(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeOptionsForOpeningHours(open = "18:00", close = "02:00") {
  const start = toMinutes(open);
  let end = toMinutes(close);
  if (end <= start) end += 24 * 60;
  const result: string[] = [];
  for (let value = start; value <= end; value += 30) {
    const normalized = value % (24 * 60);
    const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
    const minutes = String(normalized % 60).padStart(2, "0");
    result.push(`${hours}:${minutes}`);
  }
  return result;
}

function getDefaultArrivalTime(open = "18:00") {
  return open;
}

function isTimeWithinOpeningHours(
  time: string,
  open = "18:00",
  close = "02:00",
) {
  const options = timeOptionsForOpeningHours(open, close);
  return options.includes(time);
}

function isArrivalValid(
  date: string,
  time: string,
  open = "18:00",
  close = "02:00",
) {
  if (!date || !time || !/^\d{2}:\d{2}$/.test(time)) return false;
  if (!isTimeWithinOpeningHours(time, open, close)) return false;
  const bookingDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(bookingDate.getTime())) return false;
  if (date === getLocalDateInputValue())
    return bookingDate.getTime() - Date.now() >= 30 * 60 * 1000;
  return bookingDate >= new Date(`${getLocalDateInputValue()}T00:00:00`);
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function colorText(hex = "") {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#FFFFFF";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 170 ? "#111827" : "#FFFFFF";
}

function bookingModeText(table?: PreferredTable) {
  if (table?.bookingMode === "BIDDING") return "Bidding · DuyT hỗ trợ giữ giá";
  if (table?.bookingMode === "LOTTERY")
    return "Lottery · cần xác nhận cùng venue";
  if (table?.bookingMode === "MESSAGE_ONLY")
    return "Cần xác nhận trực tiếp trước khi giữ chỗ";
  return "Request · Concierge kiểm tra rồi xác nhận";
}

export default function ReservationForm({
  venue,
  onSubmit,
  onClose,
  initialPreferredTableId,
}: ReservationFormProps) {
  const { siteSettings } = usePublicSettings();
  const { t } = useI18n();
  const availableTables = useMemo(
    () => venue.preferredTables.filter((table) => table.status !== "HIDDEN"),
    [venue.preferredTables],
  );
  const initialTable =
    availableTables.find((table) => table.id === initialPreferredTableId) ||
    availableTables[0];
  const [fullName, setFullName] = useState("");
  const [phoneCode, setPhoneCode] = useState("+84");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [guestCount, setGuestCount] = useState(
    Math.min(Math.max(2, initialTable?.capacity || 2), 12),
  );
  const [date, setDate] = useState(getLocalDateInputValue());
  const openingHours = venue.openingHours || {
    open: "18:00",
    close: "02:00",
    label: "18:00 - 02:00",
  };
  const arrivalOptions = useMemo(
    () => timeOptionsForOpeningHours(openingHours.open, openingHours.close),
    [openingHours.open, openingHours.close],
  );
  const [arrivalTime, setArrivalTime] = useState(
    getDefaultArrivalTime(openingHours.open),
  );
  const [preferredTableId, setPreferredTableId] = useState(
    initialTable?.id || "",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submittedData, setSubmittedData] =
    useState<SubmittedReservation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<
    Record<
      string,
      Record<
        string,
        null | { customer?: string; bookedAt?: string; blockedUntil?: string }
      >
    >
  >({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const selectedTable =
    availableTables.find((table) => table.id === preferredTableId) ||
    availableTables[0];
  const isTableBlocked = (tableId: string, time = arrivalTime) =>
    Boolean(availability[tableId]?.[time]);
  const maxGuests = Math.max(1, selectedTable?.capacity || 12);
  const guestOptions = Array.from(
    { length: Math.min(maxGuests, 12) },
    (_, index) => index + 1,
  );

  useEffect(() => {
    const nextTable =
      availableTables.find((table) => table.id === initialPreferredTableId) ||
      availableTables[0];
    const timer = window.setTimeout(
      () => setPreferredTableId(nextTable?.id || ""),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [initialPreferredTableId, availableTables]);

  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setGuestCount((current) => Math.min(Math.max(1, current), maxGuests)),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [maxGuests]);

  useEffect(() => {
    if (!date || !venue.id) return;
    const controller = new AbortController();
    setCheckingAvailability(true);
    fetch(
      `/api/reservations/availability?venueId=${encodeURIComponent(venue.id)}&date=${encodeURIComponent(date)}`,
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.ok)
          throw new Error(payload?.error || "Không kiểm tra được lịch bàn.");
        const next = Object.fromEntries(
          (payload.data.tables || []).map(
            (table: {
              id: string;
              slots: Record<
                string,
                null | {
                  customer?: string;
                  bookedAt?: string;
                  blockedUntil?: string;
                }
              >;
            }) => [table.id, table.slots],
          ),
        );
        setAvailability(next);
      })
      .catch((fetchError) => {
        if (fetchError?.name !== "AbortError")
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Không kiểm tra được lịch bàn.",
          );
      })
      .finally(() => setCheckingAvailability(false));
    return () => controller.abort();
  }, [date, venue.id]);

  useEffect(() => {
    if (!preferredTableId || !isTableBlocked(preferredTableId)) return;
    const currentArea = availableTables.find(
      (table) => table.id === preferredTableId,
    )?.area;
    const next =
      availableTables.find(
        (table) => table.area === currentArea && !isTableBlocked(table.id),
      ) || availableTables.find((table) => !isTableBlocked(table.id));
    if (next) setPreferredTableId(next.id);
  }, [arrivalTime, availability, availableTables, preferredTableId]);

  const copyMessage = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setNotice(
        "Đã copy nội dung. Nếu app không tự điền, hãy dán tin nhắn vừa copy.",
      );
    } catch {
      setNotice(
        "Không thể copy tự động. Bạn có thể copy thủ công trong ô tin nhắn.",
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (fullName.trim().length < 2)
      return setError("Vui lòng nhập tên khách ít nhất 2 ký tự.");
    const fullPhone = `${phoneCode}${phoneNumber.replace(/\D/g, "").replace(/^0+/, "")}`;
    if (!isValidPhone(fullPhone))
      return setError("Số điện thoại không hợp lệ. Vui lòng kiểm tra mã vùng và số điện thoại.");
    if (selectedTable && isTableBlocked(selectedTable.id))
      return setError("Bàn này vừa có lịch trong khung giờ đã chọn. Vui lòng chọn bàn hoặc giờ khác.");
    if (
      !isArrivalValid(date, arrivalTime, openingHours.open, openingHours.close)
    )
      return setError(
        `Vui lòng chọn giờ đến trong khung hoạt động của địa điểm (${openingHours.label || `${openingHours.open} - ${openingHours.close}`}). Nếu đặt hôm nay, giờ đến cần cách hiện tại ít nhất 30 phút.`,
      );
    if (guestCount < 1 || guestCount > maxGuests)
      return setError(
        `Số khách vượt quá sức chứa của bàn ${selectedTable?.name || ""}.`,
      );
    if (notes.length > 500) return setError("Ghi chú nên dưới 500 ký tự.");

    const referenceCode = `DUYT-${Date.now().toString().slice(-6)}`;
    const payload = {
      fullName: fullName.trim(),
      phoneNumber: fullPhone,
      guestCount,
      date,
      arrivalTime,
      preferredTableId: selectedTable?.id || "",
      preferredTableName: selectedTable?.name || "Concierge chọn bàn phù hợp",
      notes: notes.trim(),
      referenceCode,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      setSubmittedData({
        ...payload,
        venueName: venue.name,
        area: selectedTable?.area || "VIP Area",
        minSpend: selectedTable?.minimumSpend || 0,
        referenceCode,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể gửi booking. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedData) {
    const message = buildReservationMessage({
      fullName: submittedData.fullName,
      phoneNumber: submittedData.phoneNumber,
      venueName: submittedData.venueName,
      date: submittedData.date,
      arrivalTime: submittedData.arrivalTime,
      guestCount: submittedData.guestCount,
      preferredTableName: submittedData.preferredTableName,
      notes: submittedData.notes,
      referenceCode: submittedData.referenceCode,
    });
    const socialChannels = getContactChannels(siteSettings);

    return (
      <div className="mx-auto max-w-xl overflow-hidden rounded-[28px] border border-gold/20 bg-[#101217] text-on-surface shadow-2xl shadow-black/35">
        <div className="bg-gradient-to-r from-[#6F1D1B] via-[#A7312D] to-[#6F1D1B] px-6 py-6 text-center text-white">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-gold" />
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">
            Yêu cầu đã tạo
          </p>
          <h3 className="mt-1 text-2xl font-black">
            {submittedData.preferredTableName}
          </h3>
          <p className="mt-1 text-xs text-white/70">
            Mã tham chiếu: {submittedData.referenceCode}
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Khách" value={submittedData.fullName} />
            <Info label="Địa điểm" value={submittedData.venueName} />
            <Info
              label="Ngày / giờ"
              value={`${submittedData.date} · ${submittedData.arrivalTime}`}
            />
            <Info
              label="Số khách"
              value={`${submittedData.guestCount} khách`}
            />
            <div className="col-span-2">
              <Info
                label="Chi tiêu tối thiểu dự kiến"
                value={`${submittedData.preferredTableName} · ${formatMoney(submittedData.minSpend)}`}
                gold
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gold/15 bg-gold/10 p-4 text-xs leading-relaxed text-on-surface-variant">
            Hãy chọn kênh liên hệ. Hệ thống sẽ copy sẵn nội dung; với
            WhatsApp/Email/Telegram có thể mở kèm nội dung, còn
            Zalo/Instagram/Facebook sẽ mở kênh và bạn chỉ cần dán nếu app không
            tự điền.
          </div>

          <div className="rounded-2xl border border-gold/15 bg-deep-black/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                Prepared message
              </span>
              <button
                type="button"
                onClick={() => copyMessage(message)}
                className="rounded-full border border-gold/20 px-3 py-1 text-[10px] font-bold text-gold hover:bg-gold/10"
              >
                <Copy className="mr-1 inline h-3 w-3" />
                Copy
              </button>
            </div>
            <textarea
              readOnly
              value={message}
              rows={6}
              className="w-full resize-none rounded-xl border border-gold/10 bg-deep-black/80 p-3 text-xs leading-relaxed text-on-surface-variant outline-none"
            />
          </div>

          {notice && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-100">
              {notice}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {socialChannels.map((channel) => {
              const href = buildContactUrl(
                channel.name,
                message,
                socialChannels,
              );
              return (
                <a
                  key={channel.name}
                  href={href}
                  target={channel.name === "Email" ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  onClick={() => copyMessage(message)}
                  className="flex min-h-[92px] flex-col items-center justify-center rounded-2xl border border-gold/10 bg-deep-black/30 p-3 transition hover:border-gold/40 hover:bg-gold/5"
                >
                  <img
                    src={channel.icon}
                    alt={channel.name}
                    className="mb-2 h-9 w-9 rounded-full object-contain"
                  />
                  <span className="text-xs font-bold text-on-surface">
                    {channel.name}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-gold">
                    Mở kênh <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              );
            })}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-gold/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition hover:border-gold hover:text-gold"
            >
              Quay lại chi tiết địa điểm
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full min-h-[0] flex-col overflow-hidden bg-[#101217] text-left font-sans text-on-surface"
    >
      <div className="border-b border-gold/15 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">
              Thông tin đặt chỗ
            </p>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold/80">
                {selectedTable?.area || venue.name}
              </p>
              <h2
                id="reservation-modal-title"
                className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl"
              >
                {selectedTable?.name || "Chọn bàn"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
                Đặt chỗ nhanh tại địa điểm đã chọn. Thông tin giờ, khách và yêu cầu đặc biệt được gửi trực tiếp tới concierge.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-gold/15 bg-[#11151E] p-4 text-sm text-on-surface-variant">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/80">
              Thông tin bàn
            </p>
            <div className="mt-3 space-y-3">
              <Info label="Chi tiêu tối thiểu" value={formatMoney(selectedTable?.minimumSpend || 0)} gold />
              <Info label="Sức chứa" value={`Tối đa ${maxGuests}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gold/80">
              Thông tin bàn
            </h3>
            <div className="rounded-3xl border border-white/10 bg-[#0D1118] p-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                Chọn bàn / khu
              </label>
              <select
                value={preferredTableId}
                onChange={(e) => setPreferredTableId(e.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-[#0B0F17] px-4 py-3 text-sm font-semibold text-on-surface outline-none transition duration-150 focus:border-gold focus:ring-2 focus:ring-gold/10"
              >
                {availableTables.map((table) => {
                  const blocked = isTableBlocked(table.id);
                  return (
                    <option
                      key={table.id}
                      value={table.id}
                      disabled={blocked}
                      className="bg-[#0B0F17] text-on-surface"
                    >
                      {table.name} · {table.area} · {formatMoney(table.minimumSpend)} · max {table.capacity}
                      {blocked ? " · ĐÃ CÓ LỊCH" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gold/80">
              Thời gian đặt chỗ
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                  <CalendarDays className="mr-1 inline h-4 w-4" />
                  Ngày
                </label>
                <input
                  type="date"
                  required
                  min={getLocalDateInputValue()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                  Giờ đến
                </label>
                <select
                  required
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className={inputClass}
                >
                  {arrivalOptions.map((option) => {
                    const blocked = selectedTable
                      ? isTableBlocked(selectedTable.id, option)
                      : false;
                    return (
                      <option
                        key={option}
                        value={option}
                        disabled={blocked}
                        className="bg-[#0B0F17] text-on-surface"
                      >
                        {option}
                        {blocked ? " · BÀN ĐÃ CÓ LỊCH" : ""}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                  Giờ hoạt động: {openingHours.label || `${openingHours.open} - ${openingHours.close}`}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gold/80">
              Số lượng khách
            </h3>
            <div className="rounded-3xl border border-white/10 bg-[#0D1118] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                Số khách · {guestCount}
              </p>
              <div className="flex flex-wrap gap-3">
                {guestOptions.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`min-w-[3rem] rounded-full border px-3 py-2 text-sm font-semibold transition ${guestCount === num ? "border-gold bg-gold text-dark-navy" : "border-white/10 bg-[#0B0F17] text-on-surface hover:border-gold/40"}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gold/80">
              Thông tin liên hệ
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                  Tên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Minh A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                  Số điện thoại
                </label>
                <div className="grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                  <select
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className={`${inputClass} w-full`}
                  >
                    {countryCodes.map((code) => (
                      <option key={code} className="bg-[#0B0F17]">
                        {code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="901 234 567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gold/80">
              Yêu cầu đặc biệt
            </h3>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Ví dụ: setup sinh nhật, cần góc riêng, yêu cầu đồ uống..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} min-h-[120px] resize-none leading-relaxed`}
            />
            <p className="text-right text-[11px] text-on-surface-variant/70">
              {notes.length}/500
            </p>
          </section>

          {error && (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          <div className="rounded-3xl border border-gold/15 bg-[#0A0D12] p-4 text-sm leading-relaxed text-on-surface-variant">
            <p>
              🔒 Bàn đã có lịch vẫn được hiển thị nhưng không thể chọn. Hệ thống
              ưu tiên tự chuyển sang bàn trống cùng khu. Concierge sẽ xác nhận lại
              trước khi giữ chỗ chính thức.
            </p>
            {checkingAvailability ? (
              <p className="mt-2 text-xs text-on-surface-variant/80">
                Đang kiểm tra lịch bàn…
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-gold/15 bg-[#101217]/95 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[860px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Giữ nguyên điều kiện hoạt động và giờ phục vụ. Nút gửi luôn hiển thị.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-gold px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-dark-navy transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Đang gửi..." : t("requestReservation")}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-2xl border border-gold/10 bg-deep-black/80 px-4 py-3 text-sm font-semibold text-on-surface outline-none transition focus:border-gold";

function Info({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gold/10 bg-deep-black/45 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-black ${gold ? "text-gold" : "text-on-surface"}`}
      >
        {value}
      </p>
    </div>
  );
}
