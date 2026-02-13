import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { getAppBaseUrl } from "@/lib/baseUrl";
import { buildSeoSlug } from "@/lib/seo/slug";

export const dynamic = "force-static";

function xmlEscape(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const siteUrl = getAppBaseUrl();
  const catalog = getCatalog();
  const now = new Date().toISOString();

  const staticUrls = [
    `${siteUrl}/`,
    `${siteUrl}/jis`,
    `${siteUrl}/jis/bolt`,
    `${siteUrl}/jis/nut`,
    `${siteUrl}/jis/washer`,
  ];

  const hubUrls = Array.from(
    new Set(
      catalog.map((v) => `${siteUrl}/jis/${v.category}/${v.size.toLowerCase()}`),
    ),
  );

  const productUrls = catalog.map((v) => `${siteUrl}/jis/${v.category}/${buildSeoSlug(v)}`);
  const urls = [...staticUrls, ...hubUrls, ...productUrls];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(u)}</loc>
    <lastmod>${xmlEscape(now)}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

