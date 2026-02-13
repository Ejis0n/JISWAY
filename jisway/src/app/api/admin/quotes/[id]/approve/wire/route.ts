import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { buildOrderOpsFooterLines } from "@/lib/opsCopy";

function usdToCents(usd: number) {
  return Math.round(usd * 100);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const token = await requireAdminToken(req);
    const { id } = await ctx.params;
    const form = await req.formData();

    const amountUsd = Number(form.get("amount_usd"));
    const dueDateStr = String(form.get("due_date") || "");
    const instructions = String(form.get("instructions") || "").trim();
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
      return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
    }
    const dueDate = new Date(`${dueDateStr}T00:00:00Z`);
    if (!instructions) return NextResponse.json({ error: "Instructions required" }, { status: 400 });

    const quote = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const inv = await prisma.invoice.create({
      data: {
        token: crypto.randomUUID().replaceAll("-", ""),
        amountUsd: usdToCents(amountUsd),
        paymentMethod: "wire",
        paymentInstructions: instructions,
        dueDate,
        status: "pending",
      },
    });

    await prisma.quoteRequest.update({
      where: { id },
      data: { status: "APPROVED", invoiceId: inv.id },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "approve_quote_wire",
        entityType: "QuoteRequest",
        entityId: id,
        meta: { invoiceId: inv.id, amountUsd },
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
    await sendEmail({
      to: quote.email,
      subject: "Wire transfer invoice",
      text: [
        "Your invoice is ready.",
        "",
        `Amount (USD): ${amountUsd.toFixed(2)}`,
        `Due date: ${dueDateStr}`,
        `Hosted invoice: ${siteUrl}/invoice/${inv.token}`,
        "",
        ...buildOrderOpsFooterLines(),
      ].join("\n"),
    });

    return NextResponse.redirect(new URL(`/admin/quotes/${id}`, req.url));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

