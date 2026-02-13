import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { parse } from "csv-parse/sync";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  csv: z.string().min(1),
});

function usdToCents(n: number) {
  return Math.round(n * 100);
}

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdminToken(req);
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const records = parse(parsed.data.csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    let upserted = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i]!;
      try {
        const zoneName = String(r["zone_name"] || "").trim();
        const band = String(r["band"] || "").trim() as any;
        const carrier = String(r["carrier"] || "").trim() as any;
        const priceUsd = Number(r["price_usd"]);
        const etaMin = Number(r["eta_min_days"]);
        const etaMax = Number(r["eta_max_days"]);
        const tracking = String(r["tracking_included"] || "true").trim().toLowerCase() !== "false";
        const notes = String(r["notes"] || "").trim() || undefined;

        if (!zoneName) throw new Error("Missing zone_name");
        const zone = await prisma.shippingZone.findUnique({ where: { name: zoneName } });
        if (!zone) throw new Error(`Unknown zone: ${zoneName}`);
        if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("Invalid price_usd");
        if (!Number.isFinite(etaMin) || etaMin <= 0) throw new Error("Invalid eta_min_days");
        if (!Number.isFinite(etaMax) || etaMax <= 0) throw new Error("Invalid eta_max_days");

        await prisma.shippingRule.upsert({
          where: { zoneId_band_carrier: { zoneId: zone.id, band, carrier } },
          create: {
            zoneId: zone.id,
            band,
            carrier,
            priceUsdCents: usdToCents(priceUsd),
            etaMinDays: etaMin,
            etaMaxDays: etaMax,
            trackingIncluded: tracking,
            notes,
          },
          update: {
            priceUsdCents: usdToCents(priceUsd),
            etaMinDays: etaMin,
            etaMaxDays: etaMax,
            trackingIncluded: tracking,
            notes,
          },
        });
        upserted += 1;
      } catch (e) {
        errors.push({ row: i + 2, error: e instanceof Error ? e.message : "unknown" });
      }
    }

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "import_shipping_rules_csv",
        entityType: "ShippingRule",
        entityId: "csv",
        meta: { upserted, errors: errors.slice(0, 50) },
      },
    });

    return NextResponse.json({ ok: true, upserted, errors });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

