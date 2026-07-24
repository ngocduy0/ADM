'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VenueDetailView from '../components/VenueDetailView';
import { createReservationOnServer } from '../data';
import { Locale } from '../i18n';
import { BookingStatus, ReservationRequest } from '../types';
import PublicShell from './PublicShell';
import { publicPath, venuePublicSlug } from './routes';
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
    const canonicalSlug = venuePublicSlug(selectedVenue);
    if (decodeURIComponent(venueId).toLowerCase() !== canonicalSlug.toLowerCase()) {
      router.replace(publicPath(initialLocale, 'VENUE_DETAIL', canonicalSlug));
    }
  }, [initialLocale, router, selectedVenue, venueId]);

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


  const missingCopy = ({
    vi: { title: 'Không tìm thấy địa điểm', text: 'Địa điểm này có thể đã bị ẩn hoặc đường dẫn đã thay đổi.', back: 'Quay lại danh sách địa điểm' },
    en: { title: 'Venue not found', text: 'This venue may be hidden or its public address may have changed.', back: 'Back to venues' },
    ko: { title: '장소를 찾을 수 없습니다', text: '이 장소가 숨김 처리되었거나 공개 주소가 변경되었을 수 있습니다.', back: '장소 목록으로 돌아가기' },
    zh: { title: '未找到场地', text: '该场地可能已隐藏，或公开地址已更改。', back: '返回地点列表' },
    th: { title: 'ไม่พบสถานที่', text: 'สถานที่นี้อาจถูกซ่อนหรือที่อยู่สาธารณะถูกเปลี่ยนแล้ว', back: 'กลับไปยังรายการสถานที่' },
    ja: { title: '会場が見つかりません', text: 'この会場は非表示になったか、公開URLが変更された可能性があります。', back: '会場一覧へ戻る' },
    hi: { title: 'स्थान नहीं मिला', text: 'यह स्थान छिपा हुआ हो सकता है या उसका सार्वजनिक पता बदल गया है।', back: 'स्थान सूची पर वापस जाएँ' },
  } as const)[initialLocale];

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
          <h1 className="mb-3 text-3xl text-white">{missingCopy.title}</h1>
          <p className="mb-8 text-sm text-on-surface-variant">{missingCopy.text}</p>
          <button
            type="button"
            onClick={() => router.push(publicPath(initialLocale, 'VENUES'))}
            className="rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-dark-navy"
          >
            {missingCopy.back}
          </button>
        </div>
      )}
    </PublicShell>
  );
}
