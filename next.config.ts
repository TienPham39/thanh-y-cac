import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    // Keep dev and production artifacts separate so a build cannot corrupt HMR.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    ...(phase === PHASE_DEVELOPMENT_SERVER ? {} : { output: "export" as const }),
    trailingSlash: true,
    // Old local builds cached the opposite redirect; accept both forms in dev.
    skipTrailingSlashRedirect: phase === PHASE_DEVELOPMENT_SERVER,
    images: { unoptimized: true },
    poweredByHeader: false,
    ...(phase === PHASE_DEVELOPMENT_SERVER ? { async rewrites() {
      return {
        beforeFiles: [
          { source: "/api/:path*", destination: `${process.env.PHP_API_ORIGIN || 'http://127.0.0.1:8787'}/api/:path*` },
          { source: "/uploads/:path*", destination: `${process.env.PHP_API_ORIGIN || 'http://127.0.0.1:8787'}/uploads/:path*` },
        ],
      };
    } } : {}),
  };
}
