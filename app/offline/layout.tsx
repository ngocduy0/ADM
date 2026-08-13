import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ngoại tuyến',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
