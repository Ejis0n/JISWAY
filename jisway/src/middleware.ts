import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const GOOGLE_VERIFICATION_PATH = "/googlef1f5d793c5e7ab45.html";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Google Search Console: HTML ファイル確認用
  if (pathname === GOOGLE_VERIFICATION_PATH) {
    return NextResponse.rewrite(new URL("/api/google-site-verification", req.url));
  }

  // Canonical host redirect (production)
  const canonicalHost = process.env.CANONICAL_HOST?.trim();
  if (
    canonicalHost &&
    process.env.NODE_ENV === "production" &&
    req.headers.get("host") &&
    req.headers.get("host") !== canonicalHost
  ) {
    const url = req.nextUrl.clone();
    url.host = canonicalHost;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminRoute && !isAdminApi) return NextResponse.next();

  // allow login page + nextauth endpoints
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/googlef1f5d793c5e7ab45.html",
  ],
};

