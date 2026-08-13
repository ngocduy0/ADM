import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DuyT Booking',
    template: '%s | DuyT Booking',
  },
  description: 'DuyT Booking - Booking Đà Nẵng',
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
    icon: [{ url: '/icon.png?v=black-2', type: 'image/png' }],
    shortcut: '/favicon.ico?v=black-2',
    apple: '/apple-icon.png?v=black-2',
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
