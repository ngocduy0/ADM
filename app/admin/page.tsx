import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminPortal from '@/components/aurelius/AdminPortal';
import { COOKIE_NAME, isValidAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;

  if (!isValidAdminSession(session)) {
    redirect('/login');
  }

  return <AdminPortal />;
}
