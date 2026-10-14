import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the Docker image
  // used on the VPS. NOT on Vercel: with Next 16's Turbopack build, standalone
  // output breaks Vercel's `onBuildComplete` step (it can't find the trace file
  // `.next/next-server.js.nft.json`), failing the deploy. Vercel produces its
  // own optimized serverless output, so standalone is unnecessary there.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
