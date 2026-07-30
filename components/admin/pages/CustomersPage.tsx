"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Edit3,
  Filter,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { Customer, ReservationRequest } from "@/components/aurelius/types";
import { customerWeightedSpend, deriveCustomerTier } from "@/lib/customer-tier";
import { useAdminData } from "../AdminDataProvider";
import { CustomerFormModal } from "../forms/CustomerFormModal";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { Modal } from "../ui/Modal";
import { PageHeader } from "../ui/PageHeader";
import { Pagination } from "../ui/Pagination";
import { formatDate, statusLabels, statusTone } from "../utils";

const PAGE_SIZE = 12;

function phoneKey(value = "") {
  return value.replace(/\D/g, "");
}

function bookingDateValue(booking: ReservationRequest) {
  const date = booking.date || booking.createdAt.slice(0, 10);
  return new Date(`${date}T00:00:00`).getTime();
}

export function CustomersPage() {
  const { customers, reservations, venues, searchQuery, deleteCustomer } = useAdminData();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [history, setHistory] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [venueId, setVenueId] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const bookingByPhone = useMemo(() => {
    const map = new Map<string, ReservationRequest[]>();
    reservations.forEach((booking) => {
      const key = phoneKey(booking.phoneNumber);
      if (!key) return;
      const rows = map.get(key) || [];
      rows.push(booking);
      map.set(key, rows);
    });
    for (const rows of map.values()) {
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return map;
  }, [reservations]);

  const getHistory = (customer: Customer) => bookingByPhone.get(phoneKey(customer.phoneNumber)) || [];

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return [...customers]
      .filter((customer) => {
        if (q && ![customer.fullName, customer.phoneNumber, customer.vipStatus, customer.notes]
          .join(" ")
          .toLowerCase()
          .includes(q)) return false;

        if (venueId === "ALL" && from == null && to == null) return true;
        const historyRows = bookingByPhone.get(phoneKey(customer.phoneNumber)) || [];
        return historyRows.some((booking) => {
          if (venueId !== "ALL" && booking.venueId !== venueId) return false;
          const value = bookingDateValue(booking);
          if (from != null && value < from) return false;
          if (to != null && value > to) return false;
          return true;
        });
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookingByPhone, customers, fromDate, searchQuery, toDate, venueId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setPage(1), [searchQuery, venueId, fromDate, toDate]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetFilters = () => {
    setVenueId("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Khách hàng"
        description={`${filtered.length} / ${customers.length} hồ sơ phù hợp`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Thêm khách hàng
          </Button>
        }
      />

      <Card className="mb-5 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Filter size={17} className="text-[#1F3A8A]" />Bộ lọc khách hàng</div>
          {(venueId !== "ALL" || fromDate || toDate) ? (
            <button type="button" onClick={resetFilters} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-black text-slate-500 hover:bg-slate-100">
              <RotateCcw size={14} />Đặt lại
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px]">
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Địa điểm đã booking</span>
            <select value={venueId} onChange={(event) => setVenueId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#1F3A8A]">
              <option value="ALL">Tất cả địa điểm</option>
              {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Từ ngày</span>
            <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#1F3A8A]" />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Đến ngày</span>
            <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#1F3A8A]" />
          </label>
        </div>
      </Card>

      {rows.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((customer) => {
              const historyRows = getHistory(customer);
              const derivedTier = deriveCustomerTier(customer, reservations, venues);
              const weightedSpend = customerWeightedSpend(customer, reservations, venues);
              const favorite = venues.find((venue) => customer.favoriteVenueIds?.includes(venue.id));
              return (
                <Card key={customer.id} className="overflow-hidden p-0">
                  <div className="flex items-start gap-4 p-5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D9DFF5] text-[#1F3A8A]"><UserRound size={22} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><h3 className="truncate text-base font-black text-slate-950">{customer.fullName}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{customer.phoneNumber}</p></div>
                        <Badge tone={derivedTier === "STANDARD" ? "neutral" : derivedTier === "VIP" ? "primary" : "warning"}>{derivedTier}</Badge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{customer.notes || "Chưa có ghi chú riêng."}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 border-y border-slate-100 bg-slate-50/70 text-center">
                    <Stat value={String(historyRows.length)} label="Booking" />
                    <Stat value={new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(weightedSpend)} label="Chi tiêu quy đổi" compact />
                    <Stat value={favorite?.name || "—"} label="Yêu thích" compact />
                  </div>
                  <div className="flex items-center gap-2 p-4">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setHistory(customer)}><CalendarClock size={16} />Lịch sử</Button>
                    <button onClick={() => setEditing(customer)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700" aria-label={`Sửa ${customer.fullName}`}><Edit3 size={17} /></button>
                    <button onClick={() => setDeleteTarget(customer)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Xóa ${customer.fullName}`}><Trash2 size={17} /></button>
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination page={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="khách hàng" />
        </>
      ) : (
        <EmptyState icon={Users} title="Không tìm thấy khách hàng" description="Thử đổi từ khóa, địa điểm hoặc khoảng thời gian." action={<Button onClick={resetFilters}><RotateCcw size={18} />Xóa bộ lọc</Button>} />
      )}

      <CustomerFormModal open={createOpen || Boolean(editing)} customer={editing} onClose={() => { setCreateOpen(false); setEditing(null); }} />
      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa khách hàng?" description={`Hồ sơ ${deleteTarget?.fullName || ""} sẽ bị xóa. Lịch sử booking vẫn được giữ nguyên.`} confirmLabel="Xóa khách hàng" onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteCustomer(deleteTarget.id)} />
      <Modal open={Boolean(history)} title={`Lịch sử · ${history?.fullName || ""}`} description={history?.phoneNumber} onClose={() => setHistory(null)} size="lg" footer={<Button variant="secondary" onClick={() => setHistory(null)}>Đóng</Button>}>
        <div className="space-y-3">
          {history && getHistory(history).map((booking) => (
            <div key={booking.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center">
              <span className="h-10 w-1 rounded-full" style={{ backgroundColor: booking.preferredTableColor || "#1F3A8A" }} />
              <div className="min-w-0 flex-1"><p className="font-extrabold">{booking.venueName} · {booking.preferredTableName}</p><p className="mt-1 text-xs font-medium text-slate-500">{formatDate(booking.date)} lúc {booking.arrivalTime} · {booking.guestCount} khách</p></div>
              <Badge tone={statusTone[booking.status]}>{statusLabels[booking.status]}</Badge>
            </div>
          ))}
          {history && !getHistory(history).length ? <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">Khách hàng chưa có booking.</p> : null}
        </div>
      </Modal>
    </div>
  );
}

function Stat({ value, label, compact }: { value: string; label: string; compact?: boolean }) {
  return <div className="border-r border-slate-100 px-2 py-3 last:border-r-0"><p className={`${compact ? "truncate text-[11px]" : "text-sm"} font-black text-slate-900`}>{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p></div>;
}
