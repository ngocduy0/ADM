import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập quản trị',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
