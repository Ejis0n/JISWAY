import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/baseUrl";

export const dynamic = "force-static";

export async function GET() {
  const siteUrl = getAppBaseUrl();
  const body = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /api

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

