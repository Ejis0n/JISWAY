import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

function parseUsdToCents(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const token = await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();
    const amountUsdStr = String(form.get("amount_usd") || "");
    const cents = parseUsdToCents(amountUsdStr);
    if (cents == null) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    await prisma.shippingRate.update({
      where: { id },
      data: { amountUsd: cents },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "update_shipping_rate",
        entityType: "ShippingRate",
        entityId: id,
        meta: { amountUsd: cents },
      },
    });

    return NextResponse.redirect(new URL("/admin/shipping", req.url));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

