import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { suggestSupplierIdForLines } from "@/lib/procurement/assignSupplier";
import { matchSupplierOffers, lineSpecFromVariant } from "@/lib/procurement/match";
import { routeProcurement } from "@/lib/procurement/router";
import { sendEmail } from "@/lib/email";
import { buildOrderOpsFooterLines } from "@/lib/opsCopy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureProcurementTaskForOrder(orderId: string) {
  const existing = await prisma.procurementTask.findFirst({ where: { orderId } });
  if (existing) return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!order) throw new Error(`Order not found: ${orderId}`);

  const cfg =
    (await prisma.routingConfig.findUnique({ where: { id: "default" } })) ??
    (await prisma.routingConfig.create({ data: { id: "default", enabled: false, strategy: "BALANCED" } }));

  if (!cfg.enabled) {
    // Fallback: single task + optional assignment via simple rule engine.
    const assignments = await prisma.supplierAssignment.findMany();
    const lineKeys = order.items.map((it) => ({
      category: it.variant.product.category,
      size: it.variant.product.size,
    }));
    const suggestedSupplierId = suggestSupplierIdForLines({ lines: lineKeys, assignments });

    const task = await prisma.procurementTask.create({
      data: {
        orderId: order.id,
        status: "new",
        supplierId: suggestedSupplierId,
        lines: {
          create: order.items.map((it) => ({
            variantId: it.variantId,
            qtyPacks: it.quantity,
            packQty:
              it.variant.packType === "PACK_10"
                ? 10
                : it.variant.packType === "PACK_20"
                  ? 20
                  : it.variant.packType === "PACK_50"
                    ? 50
                    : 100,
          })),
        },
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { fulfillmentStatus: "pending_procurement" },
    });

    return task;
  }

  // Routing enabled: split tasks by supplier.
  const allOffers = await prisma.supplierOffer.findMany();
  const weights = (cfg.weights as any) ?? { cost: 0.5, lead: 0.3, availability: 0.2, match: 0.1 };

  const lines = order.items.map((it) => {
    const pack_qty =
      it.variant.packType === "PACK_10"
        ? 10
        : it.variant.packType === "PACK_20"
          ? 20
          : it.variant.packType === "PACK_50"
            ? 50
            : 100;
    const spec = lineSpecFromVariant({ variant: it.variant, pack_qty });
    const candidates = matchSupplierOffers({ line: spec, offers: allOffers });
    return { lineId: it.id, spec, qty_packs: it.quantity, candidates };
  });

  const routed = routeProcurement({ lines, strategy: cfg.strategy, weights });

  // Store routing decisions (audit)
  await prisma.routingDecision.createMany({
    data: routed.decisions.map((d) => ({
      orderId: order.id,
      variantId: d.variantId,
      chosenSupplierId: d.chosen_supplier_id,
      strategy: cfg.strategy,
      scoreJson: d.score_json as any,
      reasonText: d.reason_text,
    })),
  });

  // Create tasks per supplier
  for (const group of routed.bySupplier) {
    await prisma.procurementTask.create({
      data: {
        orderId: order.id,
        status: "new",
        supplierId: group.supplierId,
        lines: {
          create: group.lines.map((l) => ({
            variantId: l.variantId,
            qtyPacks: l.qty_packs,
            packQty: lines.find((x) => x.lineId === l.lineId)!.spec.pack_qty,
            expectedCostJpy:
              (routed.decisions
                .find((d) => d.lineId === l.lineId)!
                .score_json.candidates.find((c) => c.offer_id === l.offer_id)!.estimated_cost_jpy) ?? null,
          })),
        },
      },
    });
  }

  // Manual assignment bucket
  if (routed.needsAssignment.length) {
    await prisma.procurementTask.create({
      data: {
        orderId: order.id,
        status: "needs_assignment",
        supplierId: null,
        lines: {
          create: routed.needsAssignment.map((l) => ({
            variantId: l.variantId,
            qtyPacks: l.qty_packs,
            packQty: lines.find((x) => x.lineId === l.lineId)!.spec.pack_qty,
          })),
        },
      },
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { fulfillmentStatus: "pending_procurement" },
  });

  // return one of the tasks for backward compatibility in caller (not used)
  const anyTask = await prisma.procurementTask.findFirst({ where: { orderId: order.id } });
  return anyTask!;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const stripe = getStripe();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Idempotency: store event id first, ignore duplicates
    const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
    if (existing) return NextResponse.json({ received: true, duplicate: true });
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        meta: {
          livemode: event.livemode,
          created: event.created,
        },
      },
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "paid",
            paidAt: new Date(),
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            email: session.customer_details?.email ?? null,
            country: session.customer_details?.address?.country ?? null,
          },
        });

        // Link acknowledgement to session (if present)
        if (typeof session.id === "string") {
          await prisma.orderAcknowledgement.updateMany({
            where: { orderId: updated.id, checkoutSessionId: session.id },
            data: { acknowledgedAt: new Date() },
          });
        }

        // Evidence: Stripe receipt / payment snapshot (best-effort)
        if (typeof session.payment_intent === "string") {
          try {
            const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
              expand: ["latest_charge"],
            });
            const charge: any = (pi as any).latest_charge;
            const receiptUrl = charge && typeof charge.receipt_url === "string" ? charge.receipt_url : null;
            const outcome = charge && charge.outcome ? charge.outcome : null;

            await prisma.orderEvidence.create({
              data: {
                orderId: updated.id,
                type: "receipt",
                fileUrl: receiptUrl,
                textContent: [
                  "Stripe payment snapshot",
                  `payment_intent: ${pi.id}`,
                  charge && typeof charge.id === "string" ? `charge: ${charge.id}` : "",
                  typeof (pi as any).amount === "number" ? `amount: ${(pi as any).amount}` : "",
                  typeof (pi as any).currency === "string" ? `currency: ${(pi as any).currency}` : "",
                  outcome ? `outcome: ${JSON.stringify(outcome)}` : "",
                  "",
                  "Receipt description should include:",
                  "- Order ID",
                  "- Exact JIS specification. No substitutes.",
                  "- Procured after payment confirmation.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              },
            });
          } catch {
            // ignore (best-effort)
          }
        }

        await ensureProcurementTaskForOrder(orderId);

        // Order confirmation email (best-effort; skipped if email not configured)
        const to = updated.email?.trim();
        if (to) {
          const order = await prisma.order.findUnique({
            where: { id: updated.id },
            include: { items: true },
          });
          await sendEmail({
            to,
            subject: `Order confirmed (${updated.id})`,
            text: [
              "Your order is confirmed.",
              "",
              `Order ID: ${updated.id}`,
              `Total (USD): $${(updated.totalUsd / 100).toFixed(2)}`,
              "",
              "Items:",
              ...(order?.items?.map((it) => `- ${it.specSnapshot && (it.specSnapshot as any).title ? (it.specSnapshot as any).title : it.variantId} | Qty ${it.quantity}`) ?? []),
              "",
              ...buildOrderOpsFooterLines(),
            ].join("\n"),
          });
        }
      }
    }

    // Optional: dispute hooks (notify + status)
    if (event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
      const dispute = event.data.object as Stripe.Dispute;
      const piId = typeof (dispute as any).payment_intent === "string" ? (dispute as any).payment_intent : null;
      const chargeId = typeof dispute.charge === "string" ? dispute.charge : null;

      let order =
        piId ? await prisma.order.findFirst({ where: { stripePaymentIntentId: piId } }) : null;

      if (!order && chargeId) {
        // Try resolve PI from charge when possible
        try {
          const ch = await stripe.charges.retrieve(chargeId, { expand: ["payment_intent"] });
          const pid =
            typeof (ch as any).payment_intent === "string"
              ? (ch as any).payment_intent
              : (ch as any).payment_intent?.id ?? null;
          if (pid) order = await prisma.order.findFirst({ where: { stripePaymentIntentId: pid } });
        } catch {
          // ignore
        }
      }

      if (order) {
        const status = (dispute as any).status as string | undefined;
        const next =
          event.type === "charge.dispute.created"
            ? "in_dispute"
            : status === "won"
              ? "won"
              : status === "lost"
                ? "lost"
                : order.disputeStatus;

        await prisma.order.update({
          where: { id: order.id },
          data: { disputeStatus: next as any },
        });

        await prisma.orderEvidence.create({
          data: {
            orderId: order.id,
            type: "communication",
            textContent: [
              `Stripe dispute event: ${event.type}`,
              `dispute_id: ${(dispute as any).id ?? ""}`,
              status ? `status: ${status}` : "",
              (dispute as any).reason ? `reason: ${(dispute as any).reason}` : "",
              (dispute as any).amount ? `amount: ${(dispute as any).amount}` : "",
              (dispute as any).currency ? `currency: ${(dispute as any).currency}` : "",
              chargeId ? `charge: ${chargeId}` : "",
              piId ? `payment_intent: ${piId}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        });

        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: `Stripe dispute: ${event.type} (Order ${order.id})`,
            text: [
              "Stripe dispute event received.",
              "",
              `Order ID: ${order.id}`,
              `Event: ${event.type}`,
              `Dispute ID: ${(dispute as any).id ?? ""}`,
              `Reason: ${(dispute as any).reason ?? ""}`,
              `Status: ${status ?? ""}`,
              "",
              "Next steps:",
              "- Open the order in Admin and generate Stripe Evidence PDF.",
            ].join("\n"),
          });
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "canceled" },
        });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (typeof pi.id === "string") {
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: "failed" },
        });
      }
    }

    await prisma.appEvent.create({
      data: {
        type: "stripe_webhook",
        meta: { id: event.id, type: event.type, livemode: event.livemode },
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

