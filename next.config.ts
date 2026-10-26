import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/manifest.webmanifest', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ];
  },
  async redirects() {
    return [
      { source: '/:path*', has: [{ type: 'host', value: 'app.territory-manager.com.br' }], destination: 'https://admin.territory-manager.com.br/:path*', permanent: true },
      { source: '/:path*', has: [{ type: 'header', key: 'host', value: 'localhost:3000' }], destination: 'http://localhost:4800/:path*', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/territorio-digital.appspot.com/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/territorio-digital.appspot.com/**",
      },
    ],
  },
};

export default nextConfig;
