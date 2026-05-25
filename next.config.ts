import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        destination: "/home",
        permanent: false,
        source: "/dashboard",
      },
      {
        destination: "/matches",
        permanent: false,
        source: "/calendar",
      },
    ];
  },
  async rewrites() {
    return [
      {
        destination: "/dashboard",
        source: "/home",
      },
      {
        destination: "/calendar",
        source: "/matches",
      },
    ];
  },
};

export default nextConfig;
