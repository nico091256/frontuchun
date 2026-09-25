import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'backenduchun-production.up.railway.app',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    const backendHost = process.env.BACKEND_INTERNAL_URL || 'http://localhost:5050';
    return [
      {
        source: '/api/:path*',
        destination: `${backendHost}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendHost}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
