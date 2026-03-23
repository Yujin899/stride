import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  // Silence Turbopack webpack-detection error in Next.js 16
  turbopack: {},
};

// Only wrap with PWA in production to avoid Turbopack development conflicts
export default process.env.NODE_ENV === "development" ? nextConfig : withPWA(nextConfig);
