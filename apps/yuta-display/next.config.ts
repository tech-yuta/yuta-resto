import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@yuta/ui', '@yuta/core'],
  allowedDevOrigins: ['192.168.1.122'],
};

export default nextConfig;
