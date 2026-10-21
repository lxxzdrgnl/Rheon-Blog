import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // dev 서버를 같은 공유기의 폰·다른 PC(192.168.x.x)에서 열 때 HMR·개발용 JS가 막혀 hydration이 안 되는 것 방지. 프로덕션 빌드엔 영향 없음.
  allowedDevOrigins: ["192.168.*.*"],
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
