import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/preview/'],
    },
    sitemap: 'https://yutapro.fr/sitemap.xml',
    host: 'https://yutapro.fr',
  };
}
