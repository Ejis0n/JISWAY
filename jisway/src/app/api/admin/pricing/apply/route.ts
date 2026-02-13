import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { applyReprice } from "@/lib/pricing/reprice";

const BodySchema = z.object({
  category: z.enum(["bolt", "nut", "washer"]).optional(),
  size: z.string().optional(),
  limit: z.number().int().positive().max(500).optional(),
  allowOverride: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdminToken(req);
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = BodySchema.safeParse(json ?? {});
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const res = await applyReprice({ adminUserId: String(token.sub), opts: parsed.data });
    return NextResponse.json({ ok: true, updated: res.updatedCount });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

