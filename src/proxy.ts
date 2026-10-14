import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/*
 * Proxy (Next.js 16's renamed Middleware). Serves the admin at BOTH:
 *   - admin.loopsoop.in/…  (subdomain — bare paths mapped onto /admin/*)
 *   - loopsoop.in/admin/…  (path fallback)
 * Optimistic auth gate; real authorization is re-checked in every Server Action.
 */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  const isAdminSubdomain = host.startsWith("admin.");

  // Admin subdomain → map bare paths onto the /admin/* routes.
  if (isAdminSubdomain) {
    const adminPath = url.pathname.startsWith("/admin")
      ? url.pathname
      : url.pathname === "/"
        ? "/admin/dashboard"
        : `/admin${url.pathname}`;
    return gate(request, adminPath, true, true);
  }

  // Direct /admin/* on the main domain.
  if (url.pathname.startsWith("/admin")) {
    return gate(request, url.pathname, false, false);
  }

  return NextResponse.next();
}

async function gate(
  request: NextRequest,
  adminPath: string,
  rewrite: boolean,
  isSubdomain: boolean,
) {
  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const isLogin = adminPath === "/admin/login";
  // On the subdomain the user-facing paths are bare (/login, /dashboard).
  const loginPath = isSubdomain ? "/login" : "/admin/login";
  const dashboardPath = isSubdomain ? "/dashboard" : "/admin/dashboard";

  if (!session && !isLogin) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }
  return rewrite
    ? NextResponse.rewrite(new URL(adminPath, request.url))
    : NextResponse.next();
}

// Run on everything except static assets so the admin subdomain's bare paths
// are matched. Non-admin requests early-return above.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)$).*)",
  ],
};
