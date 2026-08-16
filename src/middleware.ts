import { NextResponse, type NextRequest } from "next/server";

/**
 * The /api/* rewrite proxies browser requests to the ASP.NET backend. The
 * browser's Origin header (e.g. https://app.vercel.app) gets forwarded along,
 * but the backend's CSRF origin-check only allows known origins, so every
 * state-changing call through the proxy would be rejected as
 * "Cross-origin request blocked".
 *
 * The browser -> Next.js hop is same-origin (SameSite=Lax cookies already
 * protect it), so the Origin header is meaningless by the time the request is
 * proxied. Stripping it here makes proxied calls look like the server-to-server
 * calls they are; direct cross-origin API calls still hit the backend's check
 * and are blocked.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const headers = new Headers(request.headers);
    headers.delete("origin");
    headers.delete("referer");
    return NextResponse.next({ request: { headers } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
