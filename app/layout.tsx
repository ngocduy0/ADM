import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DuyT Booking',
    template: '%s | DuyT Booking',
  },
  description: 'DuyT Booking - hệ thống đặt chỗ và quản trị địa điểm',
  applicationName: 'DuyT Booking Admin',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'DuyT Admin',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#F7F8FC',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
