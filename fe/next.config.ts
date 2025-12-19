import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // added
  },
  typescript: {
    ignoreBuildErrors: true, // added
  },
  reactStrictMode: false, // ⭐ 개발 중 임시로 끄기 (2번 호출 방지)
};

export default nextConfig;
