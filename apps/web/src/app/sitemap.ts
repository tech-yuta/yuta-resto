import type { MetadataRoute } from 'next';

const baseUrl = 'https://yutapro.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/solutions',
    '/solutions/avis-commentaires',
    '/integrations/google-business-profile',
    '/pour-les-restaurateurs',
    '/a-propos',
    '/contact',
    '/privacy',
    '/terms',
    '/mentions-legales',
    '/gestion-des-donnees',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority:
      route === ''
        ? 1
        : route === '/solutions' ||
            route === '/solutions/avis-commentaires'
          ? 0.8
          : 0.6,
  }));
}
