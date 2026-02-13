import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

const BodySchema = z.object({
  enabled: z.enum(["true", "false"]),
  strategy: z.enum(["CHEAPEST", "FASTEST", "BALANCED", "AVAILABILITY_FIRST"]),
  w_cost: z.coerce.number(),
  w_lead: z.coerce.number(),
  w_availability: z.coerce.number(),
  w_match: z.coerce.number(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const form = await req.formData();
    const parsed = BodySchema.safeParse({
      enabled: form.get("enabled"),
      strategy: form.get("strategy"),
      w_cost: form.get("w_cost"),
      w_lead: form.get("w_lead"),
      w_availability: form.get("w_availability"),
      w_match: form.get("w_match"),
    });
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    await prisma.routingConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        enabled: parsed.data.enabled === "true",
        strategy: parsed.data.strategy,
        weights: {
          cost: parsed.data.w_cost,
          lead: parsed.data.w_lead,
          availability: parsed.data.w_availability,
          match: parsed.data.w_match,
        },
      },
      update: {
        enabled: parsed.data.enabled === "true",
        strategy: parsed.data.strategy,
        weights: {
          cost: parsed.data.w_cost,
          lead: parsed.data.w_lead,
          availability: parsed.data.w_availability,
          match: parsed.data.w_match,
        },
      },
    });

    return NextResponse.redirect(new URL("/admin/routing", req.url), 303);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

