import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the Docker image
  // used on the VPS. Vercel ignores this, so the existing deploy is unaffected.
  output: "standalone",
};

export default nextConfig;
