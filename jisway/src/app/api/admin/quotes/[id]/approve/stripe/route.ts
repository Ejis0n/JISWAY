import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";
import { getStripe } from "@/lib/stripe";
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
    const daysUntilDue = Number(form.get("days_until_due"));
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const stripe = getStripe();
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!Number.isFinite(daysUntilDue) || daysUntilDue <= 0 || daysUntilDue > 60) {
      return NextResponse.json({ error: "Invalid due days" }, { status: 400 });
    }

    const quote = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const customer = await stripe.customers.create({
      email: quote.email,
      metadata: { quote_id: quote.id },
    });

    await stripe.invoiceItems.create({
      customer: customer.id,
      currency: "usd",
      amount: usdToCents(amountUsd),
      description: `JISWAY procurement — Quote ${quote.id}`,
    });

    const inv = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: Math.floor(daysUntilDue),
      metadata: { quote_id: quote.id },
      auto_advance: true,
    });

    const finalized = await stripe.invoices.finalizeInvoice(inv.id);
    const sent = await stripe.invoices.sendInvoice(finalized.id);

    const hostedUrl = sent.hosted_invoice_url ?? null;

    await prisma.quoteRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        stripeInvoiceId: sent.id,
        stripeInvoiceUrl: hostedUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: String(token.sub),
        action: "approve_quote_stripe_invoice",
        entityType: "QuoteRequest",
        entityId: id,
        meta: { stripeInvoiceId: sent.id, amountUsd, hostedUrl },
      },
    });

    await sendEmail({
      to: quote.email,
      subject: "Stripe invoice",
      text: [
        "Your Stripe invoice is ready.",
        "",
        `Amount (USD): ${amountUsd.toFixed(2)}`,
        hostedUrl ? `Hosted invoice: ${hostedUrl}` : "",
        "",
        ...buildOrderOpsFooterLines(),
      ]
        .filter(Boolean)
        .join("\n"),
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

