import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: string) {
  if (/[,"\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
  return v;
}

export async function GET(req: NextRequest) {
  await requireAdminToken(req);
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id")?.trim() || null;

  const rows = await prisma.routingDecision.findMany({
    where: orderId ? { orderId } : undefined,
    include: { chosenSupplier: true },
    orderBy: { decidedAt: "desc" },
    take: 5000,
  });

  const header = [
    "decided_at",
    "order_id",
    "variant_id",
    "strategy",
    "chosen_supplier_id",
    "chosen_supplier_name",
    "reason_text",
  ].join(",");

  const lines = rows.map((r) =>
    [
      r.decidedAt.toISOString(),
      r.orderId,
      r.variantId,
      r.strategy,
      r.chosenSupplierId ?? "",
      r.chosenSupplier?.name ?? "",
      r.reasonText,
    ]
      .map((x) => csvEscape(String(x)))
      .join(","),
  );

  const body = [header, ...lines].join("\n") + "\n";
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="routing-decisions.csv"`,
      "cache-control": "private, max-age=0, no-store",
    },
  });
}

