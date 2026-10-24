import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/:path*', has: [{ type: 'host', value: 'app.territory-manager.com.br' }], destination: 'https://admin.territory-manager.com.br/:path*', permanent: true }];
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
