import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";
import { renderPoPdfBuffer } from "@/lib/pdf/po";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireAdminToken(req);
  const { id } = await ctx.params;

  const task = await prisma.procurementTask.findUnique({
    where: { id },
    include: {
      order: true,
      supplier: true,
      lines: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdf = await renderPoPdfBuffer(task);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="po-${task.id}.pdf"`,
      "cache-control": "private, max-age=0, no-store",
    },
  });
}

