import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Silence Turbopack webpack-detection error in Next.js 16
  turbopack: {},
};

export default nextConfig;
