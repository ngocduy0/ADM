import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#F7F8FC] px-6 text-center text-slate-950">
      <section className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600"><WifiOff size={30} /></span>
        <h1 className="mt-5 text-xl font-black">Không có kết nối mạng</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Dữ liệu quản trị không được lưu ngoại tuyến để bảo vệ thông tin khách hàng. Hãy kết nối Internet rồi thử lại.</p>
        <Link href="/admin" className="mt-6 flex h-12 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white">Thử kết nối lại</Link>
      </section>
    </main>
  );
}
