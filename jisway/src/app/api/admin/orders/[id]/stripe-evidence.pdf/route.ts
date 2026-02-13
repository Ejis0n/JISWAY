import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin";
import { renderStripeEvidencePdfBuffer } from "@/lib/payments/stripeEvidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireAdminToken(req);
  const { id } = await ctx.params;
  const pdf = await renderStripeEvidencePdfBuffer({ orderId: id });
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="stripe-evidence-${id}.pdf"`,
      "cache-control": "private, max-age=0, no-store",
    },
  });
}

