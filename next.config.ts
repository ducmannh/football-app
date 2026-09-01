import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ẩn biểu tượng logo Next.js tròn tròn ở góc màn hình khi dev
  devIndicators: false,

  // Cho phép truy cập tài nguyên Dev/HMR từ thiết bị trong mạng LAN (điện thoại, tablet)
  allowedDevOrigins: [
    "192.168.1.223",
    "192.168.1.*",
    "*.local",
    "localhost",
    "localhost:2305",
    "192.168.1.223:2305",
    "192.168.1.23:2305",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.api-sports.io",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
};

export default nextConfig;
