import { NextResponse } from "next/server";

/**
 * Google Search Console: HTML ファイル確認用。
 * next.config の rewrite で /googlef1f5d793c5e7ab45.html からここに飛ばす。
 */
export async function GET() {
  const body = "google-site-verification: googlef1f5d793c5e7ab45.html";
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
