import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  jpy_per_usd: z.number().positive(),
  source: z.enum(["manual", "provider"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const created = await prisma.fxRate.create({
      data: {
        pair: "JPYUSD",
        rate: parsed.data.jpy_per_usd,
        source: parsed.data.source ?? "manual",
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

