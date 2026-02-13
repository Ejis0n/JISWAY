import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppBaseUrl } from "@/lib/baseUrl";

const BodySchema = z.object({
  urls: z.array(z.string().min(1)).min(1).max(1000),
});

export async function POST(req: Request) {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) return NextResponse.json({ error: "Not configured" }, { status: 404 });

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const base = new URL(getAppBaseUrl());
  const host = process.env.INDEXNOW_HOST?.trim() || base.host;
  const keyLocation = `${base.origin}/api/indexnow/key`;

  // IndexNow endpoint (Bing and partners)
  const endpoint = "https://api.indexnow.org/indexnow";

  const payload = {
    host,
    key,
    keyLocation,
    urlList: parsed.data.urls,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: "IndexNow failed", status: res.status, body: text }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

