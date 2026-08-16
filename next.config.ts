import type { NextConfig } from "next";

/**
 * API proxy: the ASP.NET Core backend (aspnet-backend/) now owns every
 * /api/* route. Instead of changing the UI, Next.js rewrites those same-origin
 * requests to the backend, so the browser keeps talking to this origin and the
 * apex_erp_session cookie flows through unchanged.
 *
 * Point the proxy elsewhere with API_PROXY_TARGET, e.g.:
 *   API_PROXY_TARGET=http://192.168.1.50:5199 npm run dev
 */
const apiTarget =
  process.env.API_PROXY_TARGET?.replace(/\/+$/, "") || "http://localhost:5199";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ["192.168.29.254"],
  async rewrites() {
    // beforeFiles: checked BEFORE the filesystem, so these take priority over
    // the local src/app/api/* route handlers. A plain array of rewrites would
    // be checked AFTER the filesystem and the Next.js API routes would win.
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${apiTarget}/api/:path*`,
          basePath: false,
        },
      ],
    };
  },
};

console.log(`[api] proxying /api/* → ${apiTarget}`);

export default nextConfig;
