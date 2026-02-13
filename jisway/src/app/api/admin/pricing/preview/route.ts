import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { previewReprice } from "@/lib/pricing/reprice";

const BodySchema = z.object({
  category: z.enum(["bolt", "nut", "washer"]).optional(),
  size: z.string().optional(),
  limit: z.number().int().positive().max(500).optional(),
  allowOverride: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = BodySchema.safeParse(json ?? {});
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const rows = await previewReprice(parsed.data);
    const changed = rows.filter((r) => r.current_price_usd_cents !== r.recommended_price_usd_cents).length;
    const maxAbsPct = rows.reduce((m, r) => Math.max(m, Math.abs(r.pct_change)), 0);
    return NextResponse.json({
      count: rows.length,
      changed,
      max_abs_pct_change: maxAbsPct,
      rows,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

