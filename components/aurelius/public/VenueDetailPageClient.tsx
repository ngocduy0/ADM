'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VenueDetailView from '../components/VenueDetailView';
import { createReservationOnServer } from '../data';
import { Locale } from '../i18n';
import { BookingStatus, ReservationRequest } from '../types';
import PublicShell from './PublicShell';
import { publicPath } from './routes';
import { usePublicVenue } from './usePublicData';

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
    void fetch(`/api/venues/${encodeURIComponent(selectedVenue.id)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewCount: nextViewCount }),
      keepalive: true,
    }).catch(() => undefined);
  }, [selectedVenue]);

  const handleRequestSubmit = async (formData: Omit<ReservationRequest, 'id' | 'venueId' | 'venueName' | 'status' | 'createdAt' | 'source'>) => {
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

    await createReservationOnServer(newRequest);
  };

  if (isLoadingData) {
    return <div className="min-h-screen bg-deep-black" aria-busy="true" />;
  }

  return (
    <PublicShell initialLocale={initialLocale} activeView="VENUE_DETAIL" logoUrl={siteSettings.logoUrl} siteSettings={siteSettings}>
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
