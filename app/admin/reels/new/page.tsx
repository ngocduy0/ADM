import { ReelEditorPage } from '@/components/admin/pages/ReelEditorPage';
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string; venueId?: string }> }) {
  const params = await searchParams;
  return <ReelEditorPage reelId={params.id} initialVenueId={params.venueId} />;
}
