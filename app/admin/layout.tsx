import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminDataProvider } from '@/components/admin/AdminDataProvider';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { COOKIE_NAME, isValidAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!isValidAdminSession(session)) redirect('/login');

  return (
    <AdminDataProvider>
      <AdminShell>{children}</AdminShell>
    </AdminDataProvider>
  );
}
