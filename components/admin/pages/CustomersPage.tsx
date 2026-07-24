"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Edit3,
  Plus,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { Customer } from "@/components/aurelius/types";
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
import { formatDate, statusLabels, statusTone } from "../utils";

export function CustomersPage() {
  const { customers, reservations, venues, searchQuery, deleteCustomer } =
    useAdminData();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [history, setHistory] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...customers]
      .filter(
        (item) =>
          !q ||
          [item.fullName, item.phoneNumber, item.vipStatus, item.notes]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [customers, searchQuery]);

  const getHistory = (customer: Customer) =>
    reservations
      .filter(
        (item) =>
          item.phoneNumber.replace(/\s/g, "") ===
          customer.phoneNumber.replace(/\s/g, ""),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

  return (
    <div className="pb-10">
      <PageHeader
        title="Khách hàng"
        description={`${filtered.length} hồ sơ khách hàng trong hệ thống`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Thêm khách hàng
          </Button>
        }
      />
      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer) => {
            const historyRows = getHistory(customer);
            const derivedTier = deriveCustomerTier(
              customer,
              reservations,
              venues,
            );
            const weightedSpend = customerWeightedSpend(
              customer,
              reservations,
              venues,
            );
            const favorite = venues.find((venue) =>
              customer.favoriteVenueIds?.includes(venue.id),
            );
            return (
              <Card key={customer.id} className="p-0 overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D9DFF5] text-[#1F3A8A]">
                    <UserRound size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="truncate text-base font-black text-slate-950">
                          {customer.fullName}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {customer.phoneNumber}
                        </p>
                      </div>
                      <Badge
                        tone={
                          derivedTier === "STANDARD"
                            ? "neutral"
                            : derivedTier === "VIP"
                              ? "primary"
                              : "warning"
                        }
                      >
                        {derivedTier}
                      </Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
                      {customer.notes || "Chưa có ghi chú riêng."}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 border-y border-slate-100 bg-slate-50/70 text-center">
                  <Stat value={String(historyRows.length)} label="Booking" />
                  <Stat
                    value={new Intl.NumberFormat("vi-VN", {
                      notation: "compact",
                    }).format(weightedSpend)}
                    label="Chi tiêu quy đổi"
                    compact
                  />
                  <Stat
                    value={favorite?.name || "—"}
                    label="Yêu thích"
                    compact
                  />
                </div>
                <div className="flex items-center gap-2 p-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setHistory(customer)}
                  >
                    <CalendarClock size={16} />
                    Lịch sử
                  </Button>
                  <button
                    onClick={() => setEditing(customer)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(customer)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Không tìm thấy khách hàng"
          description="Thử đổi từ khóa tìm kiếm hoặc thêm khách hàng mới."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={18} />
              Thêm khách hàng
            </Button>
          }
        />
      )}

      <CustomerFormModal
        open={createOpen || Boolean(editing)}
        customer={editing}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa khách hàng?"
        description={`Hồ sơ ${deleteTarget?.fullName || ""} sẽ bị xóa. Lịch sử booking vẫn được giữ nguyên.`}
        confirmLabel="Xóa khách hàng"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteCustomer(deleteTarget.id)}
      />
      <Modal
        open={Boolean(history)}
        title={`Lịch sử · ${history?.fullName || ""}`}
        description={history?.phoneNumber}
        onClose={() => setHistory(null)}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setHistory(null)}>
            Đóng
          </Button>
        }
      >
        <div className="space-y-3">
          {history &&
            getHistory(history).map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center"
              >
                <span
                  className="h-10 w-1 rounded-full"
                  style={{
                    backgroundColor: booking.preferredTableColor || "#1F3A8A",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">
                    {booking.venueName} · {booking.preferredTableName}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {formatDate(booking.date)} lúc {booking.arrivalTime} ·{" "}
                    {booking.guestCount} khách
                  </p>
                </div>
                <Badge tone={statusTone[booking.status]}>
                  {statusLabels[booking.status]}
                </Badge>
              </div>
            ))}
          {history && !getHistory(history).length ? (
            <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
              Khách hàng chưa có booking.
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function Stat({
  value,
  label,
  compact,
}: {
  value: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="border-r border-slate-100 px-2 py-3 last:border-r-0">
      <p
        className={`${compact ? "truncate text-[11px]" : "text-sm"} font-black text-slate-900`}
      >
        {value}
      </p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}
