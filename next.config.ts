import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  // Disable Serwist in development (Turbopack incompatibility)
  // Only active in production builds
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // Empty turbopack config silences the webpack/turbopack conflict warning
  turbopack: {},
};

export default withSerwist(nextConfig);
