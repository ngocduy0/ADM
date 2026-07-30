'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TableMapManagerModal from '@/components/aurelius/components/TableMapManagerModal';
import type { Venue } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';

export function VenueFloorPlanPage() {
  const params = useParams<{ venueId: string }>();
  const router = useRouter();
  const { venues } = useAdminData();
  const venueId = decodeURIComponent(String(params.venueId || ''));
  const venue = venues.find((item) => item.id === venueId) || null;

  if (!venue) {
    return (
      <div className="grid h-full place-items-center bg-[#F5F5F7] p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-black text-slate-950">Không tìm thấy địa điểm</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Địa điểm có thể đã bị xóa hoặc đường dẫn không còn hợp lệ.</p>
          <button onClick={() => router.replace('/admin/venues')} className="mt-5 rounded-2xl bg-[#1F3A8A] px-5 py-3 text-sm font-black text-white">Quay lại địa điểm</button>
        </div>
      </div>
    );
  }

  return <VenueFloorPlanEditor key={venue.id} venue={venue} />;
}

function VenueFloorPlanEditor({ venue }: { venue: Venue }) {
  const router = useRouter();
  const { saveVenue, saving, showToast } = useAdminData();
  const [draft, setDraft] = useState<Venue>(() => structuredClone(venue));

  const save = async () => {
    try {
      await saveVenue(draft);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thể lưu sơ đồ.');
    }
  };

  return (
    <TableMapManagerModal
      embedded
      venueName={draft.name}
      venueCategory={draft.category}
      zones={draft.tableZones || []}
      tables={draft.preferredTables || []}
      elements={draft.floorPlanElements || []}
      theme={draft.floorPlanTheme}
      baseMinimumSpend={draft.preferredTables[0]?.minimumSpend || 3000000}
      baseCapacity={draft.preferredTables[0]?.capacity || 4}
      onChangeZones={(tableZones) => setDraft((current) => ({ ...current, tableZones }))}
      onChangeTables={(preferredTables) => setDraft((current) => ({ ...current, preferredTables }))}
      onChangeElements={(floorPlanElements) => setDraft((current) => ({ ...current, floorPlanElements }))}
      onChangeTheme={(floorPlanTheme) => setDraft((current) => ({ ...current, floorPlanTheme }))}
      onSave={save}
      saving={saving}
      onClose={() => router.push('/admin/venues')}
    />
  );
}
