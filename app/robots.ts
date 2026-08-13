import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.duyt.com.vn';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/login', '/api/', '/offline'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}