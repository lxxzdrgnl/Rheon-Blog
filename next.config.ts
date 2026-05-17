import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
      },
      {
        protocol: "https",
        hostname: "blog.rheon.kr",
      },
      {
        protocol: "https",
        hostname: "storage.rheon.kr",
      },
      {
        protocol: "http",
        hostname: "175.208.92.8",
        port: "9000",
      },
    ],
  },
};

export default nextConfig;
