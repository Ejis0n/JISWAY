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
    const activeStr = String(form.get("active") || "");
    const priceStr = String(form.get("price_usd") || "");
    const imageUrl = String(form.get("image_url") || "").trim();

    const active = activeStr === "true";
    const priceUsd = parseUsdToCents(priceStr);
    if (priceUsd == null) return NextResponse.json({ error: "Invalid price" }, { status: 400 });

    const variant = await prisma.variant.findUnique({ where: { id } });
    if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.variant.update({
      where: { id },
      data: { active, priceUsd },
    });

    if (imageUrl) {
      await prisma.product.update({
        where: { id: variant.productId },
        data: { imageUrl },
      });
    }

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "update_variant",
        entityType: "Variant",
        entityId: id,
        meta: { active, priceUsd, imageUrl: imageUrl || null },
      },
    });

    return NextResponse.redirect(new URL(`/admin/catalog/${id}`, req.url));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

