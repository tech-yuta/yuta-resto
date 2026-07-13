import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@yuta/ui', '@yuta/core', '@yuta/db'],
};

export default nextConfig;
