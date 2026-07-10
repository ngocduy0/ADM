'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VenueDetailView from '../components/VenueDetailView';
import {
  createReservationOnServer,
  loadData,
  saveCustomers,
  saveReservations,
  updateVenueOnServer,
} from '../data';
import { Locale } from '../i18n';
import { BookingStatus, Customer, ReservationRequest, Venue, VipStatus } from '../types';
import PublicShell from './PublicShell';
import { publicPath } from './routes';
import { usePublicVenue } from './usePublicData';

type AdminNotificationPayload = {
  id: string;
  reservationId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  tableColor?: string;
};

async function createAdminNotificationFromBooking(booking: ReservationRequest): Promise<void> {
  const notice: AdminNotificationPayload = {
    id: `notice-${booking.id}`,
    reservationId: booking.id,
    title: `Đặt chỗ mới · ${booking.preferredTableName || 'Chưa chọn bàn'}`,
    message: `${booking.fullName} · ${booking.venueName} · ${booking.preferredTableArea || 'Concierge chọn khu'} · ${booking.guestCount} khách`,
    createdAt: booking.createdAt || new Date().toISOString(),
    read: false,
    tableColor: booking.preferredTableColor || '#0066ff',
  };

  await fetch('/api/admin-notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'same-origin',
    body: JSON.stringify({ notifications: [notice] }),
  });
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim();
}

function buildOptimisticCustomerList(
  customers: Customer[],
  selectedVenueId: string,
  formData: any,
): Customer[] {
  const clientExists = customers.some((customer) => normalizePhone(customer.phoneNumber) === normalizePhone(formData.phoneNumber));

  if (!clientExists) {
    return [
      {
        id: `cust-${Date.now()}`,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        notes: `Yêu cầu đặt chỗ từ website ngày ${formData.date}. Bàn/phòng: ${formData.preferredTableName}.`,
        vipStatus: VipStatus.VIP,
        favoriteVenueIds: [selectedVenueId],
        createdAt: new Date().toISOString(),
      },
      ...customers,
    ];
  }

  return customers.map((customer) => {
    if (normalizePhone(customer.phoneNumber) !== normalizePhone(formData.phoneNumber)) return customer;
    const favoriteVenueIds = customer.favoriteVenueIds.includes(selectedVenueId)
      ? customer.favoriteVenueIds
      : [...customer.favoriteVenueIds, selectedVenueId];
    return { ...customer, favoriteVenueIds };
  });
}

function saveBookingLocally(reservation: ReservationRequest, venue: Venue, formData: any) {
  const localData = loadData();
  const nextReservations = [reservation, ...localData.reservations.filter((item) => item.id !== reservation.id)];
  const nextCustomers = buildOptimisticCustomerList(localData.customers, venue.id, formData);

  saveReservations(nextReservations);
  saveCustomers(nextCustomers);
}

export default function VenueDetailPageClient({
  initialLocale = 'vi',
  venueId,
}: {
  initialLocale?: Locale;
  venueId: string;
}) {
  const router = useRouter();
  const { venue: selectedVenue, siteSettings, isLoadingData } = usePublicVenue(venueId);

  useEffect(() => {
    if (!selectedVenue) return;

    const storageKey = `duyt-view-counted:${selectedVenue.id}`;
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, '1');
    }

    const nextViewCount = Math.max(0, Number(selectedVenue.viewCount || 0)) + 1;
    updateVenueOnServer(selectedVenue.id, { viewCount: nextViewCount }).catch((error) => {
      console.warn('[DuyT] Venue view sync failed. View is kept locally.', error);
    });
  }, [selectedVenue?.id]);

  const handleRequestSubmit = (formData: any) => {
    if (!selectedVenue) return;

    const selectedTable = selectedVenue.preferredTables.find(
      (table) => table.id === formData.preferredTableId || table.name === formData.preferredTableName,
    );

    const newRequest: ReservationRequest = {
      id: `res-${Date.now()}`,
      venueId: selectedVenue.id,
      venueName: selectedVenue.name,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      guestCount: formData.guestCount,
      date: formData.date,
      arrivalTime: formData.arrivalTime,
      preferredTableId: formData.preferredTableId,
      preferredTableName: formData.preferredTableName,
      preferredTableArea: selectedTable?.area,
      preferredTableMinimumSpend: selectedTable?.minimumSpend,
      preferredTableColor: selectedTable?.color,
      preferredTableCapacity: selectedTable?.capacity,
      referenceCode: formData.referenceCode,
      notes: formData.notes,
      status: BookingStatus.NEW,
      createdAt: new Date().toISOString(),
      source: 'Web Form',
    };

    createReservationOnServer(newRequest)
      .then((serverData) => {
        saveReservations(serverData.reservations);
        saveCustomers(serverData.customers);
      })
      .catch((error) => {
        console.warn('[DuyT] Reservation API failed. Booking is kept locally.', error);
        saveBookingLocally(newRequest, selectedVenue, formData);
      });

    createAdminNotificationFromBooking(newRequest).catch((error) => {
      console.warn('[DuyT] Could not create admin notification', error);
    });
  };

  if (isLoadingData) {
    return <div className="min-h-screen bg-deep-black" aria-busy="true" />;
  }

  return (
    <PublicShell initialLocale={initialLocale} activeView="VENUE_DETAIL" logoUrl={siteSettings.logoUrl}>
      {selectedVenue ? (
        <VenueDetailView
          venue={selectedVenue}
          onBack={() => router.push(publicPath(initialLocale, 'VENUES'))}
          onSubmitRequest={handleRequestSubmit}
        />
      ) : (
        <div className="mx-auto max-w-[900px] px-6 py-24 text-center md:px-16">
          <h1 className="mb-3 text-3xl text-white">Không tìm thấy địa điểm</h1>
          <p className="mb-8 text-sm text-on-surface-variant">Địa điểm này có thể đã bị ẩn hoặc đã được đổi mã.</p>
          <button
            type="button"
            onClick={() => router.push(publicPath(initialLocale, 'VENUES'))}
            className="rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-dark-navy"
          >
            Quay lại danh sách địa điểm
          </button>
        </div>
      )}
    </PublicShell>
  );
}
