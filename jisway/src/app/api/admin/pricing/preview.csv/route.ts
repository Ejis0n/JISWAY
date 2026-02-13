import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { previewReprice } from "@/lib/pricing/reprice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: string) {
  if (/[,"\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
  return v;
}

export async function GET(req: NextRequest) {
  await requireAdminToken(req);
  const url = new URL(req.url);
  const category = url.searchParams.get("category") as any;
  const size = url.searchParams.get("size")?.trim() || undefined;
  const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;

  const rows = await previewReprice({
    category: ["bolt", "nut", "washer"].includes(category) ? category : undefined,
    size: size || undefined,
    limit: Number.isFinite(limit as number) ? (limit as number) : undefined,
  });

  const header = ["variant_id", "slug", "category", "size", "packType", "current_usd", "recommended_usd", "pct_change"].join(
    ",",
  );
  const lines = rows.map((r) =>
    [
      r.variant_id,
      r.slug,
      r.category,
      r.size,
      r.packType,
      (r.current_price_usd_cents / 100).toFixed(2),
      (r.recommended_price_usd_cents / 100).toFixed(2),
      r.pct_change.toFixed(4),
    ]
      .map((x) => csvEscape(String(x)))
      .join(","),
  );
  const body = [header, ...lines].join("\n") + "\n";
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="pricing-preview.csv"`,
      "cache-control": "private, max-age=0, no-store",
    },
  });
}

