import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/clients/:path*',
        destination: '/visibilite-reputation/:path*',
        permanent: true,
      },
      {
        source: '/operations/reservations',
        destination: '/reservations',
        permanent: true,
      },
      {
        source: '/operations/reservations/:path*',
        destination: '/reservations/:path*',
        permanent: true,
      },
      {
        source: '/operations/tables',
        destination: '/etablissement/salles-tables',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
