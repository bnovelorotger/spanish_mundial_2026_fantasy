import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        hostname: "crests.football-data.org",
        pathname: "/**",
        protocol: "https",
      },
      {
        hostname: "flagcdn.com",
        pathname: "/w80/**",
        protocol: "https",
      },
    ],
  },
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
