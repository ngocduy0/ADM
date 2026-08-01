import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: '60mb',
    cpus: 4,
    memoryBasedWorkersCount: false,
  },

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },

  // The project only uses next/image for local admin assets. Do not allow a
  // wildcard remote image optimizer because it can turn /_next/image into an
  // unnecessary server-side fetch proxy to arbitrary hosts.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
