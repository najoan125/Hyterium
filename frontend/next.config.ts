import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: isProd ? '/hyterium' : '',
  assetPrefix: isProd ? '/hyterium' : '',
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  },
};

export default nextConfig;
