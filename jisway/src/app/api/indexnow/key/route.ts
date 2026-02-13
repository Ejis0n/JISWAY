import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) return NextResponse.json({ error: "Not configured" }, { status: 404 });
  return new NextResponse(key, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

