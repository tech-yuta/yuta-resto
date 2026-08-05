import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@yuta/ui', '@yuta/contracts'],
};

export default nextConfig;
