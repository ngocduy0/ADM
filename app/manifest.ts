import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/admin',
    name: 'DuyT Booking Admin',
    short_name: 'DuyT Admin',
    description: 'Ứng dụng quản trị đặt chỗ, khách hàng và địa điểm DuyT Booking.',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F8FC',
    theme_color: '#F7F8FC',
    orientation: 'portrait-primary',
    lang: 'vi-VN',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
