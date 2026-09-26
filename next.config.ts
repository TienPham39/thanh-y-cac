import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    // Keep dev and production artifacts separate so a build cannot corrupt HMR.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    output: "standalone",
    poweredByHeader: false,
    async rewrites() {
      return {
        beforeFiles: [{ source: "/uploads/:filename", destination: "/api/uploads/:filename" }],
      };
    },
  };
}
