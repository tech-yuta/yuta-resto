import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output bundles only what's needed (~150 MB vs ~800 MB).
  // Required for the Docker production image.
  output: 'standalone',
  transpilePackages: ['@yuta/ui', '@yuta/core'],
  allowedDevOrigins: ['192.168.1.122'],
};

export default nextConfig;
