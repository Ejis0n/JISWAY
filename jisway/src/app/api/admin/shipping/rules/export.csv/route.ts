import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function csvEscape(s: string) {
  if (/[,"\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const rules = await prisma.shippingRule.findMany({
      include: { zone: { select: { name: true } } },
      orderBy: [{ zone: { name: "asc" } }, { band: "asc" }, { carrier: "asc" }],
      take: 5000,
    });

    const header = [
      "zone_name",
      "band",
      "carrier",
      "price_usd",
      "eta_min_days",
      "eta_max_days",
      "tracking_included",
      "notes",
    ];
    const rows = rules.map((r) => [
      r.zone.name,
      r.band,
      r.carrier,
      (r.priceUsdCents / 100).toFixed(2),
      String(r.etaMinDays),
      String(r.etaMaxDays),
      r.trackingIncluded ? "true" : "false",
      r.notes ?? "",
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="shipping_rules.csv"',
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

