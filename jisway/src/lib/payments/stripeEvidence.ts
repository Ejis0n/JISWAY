import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";

function moneyUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const POLICY_EXCERPT_REFUND = [
  "Refund policy excerpts (summary):",
  "- Misorders (wrong spec selected) are not refundable unless our listing was incorrect.",
  "- Wrong item or damage claims must be opened within 7 days of delivery with photos.",
  "- Non-delivery cases can be opened after 14 business days past ETA (or carrier confirmation).",
  "- Customs delays are not refundable. Duties/taxes are recipient responsibility.",
].join("\n");

const POLICY_EXCERPT_SHIPPING = [
  "Shipping policy excerpts (summary):",
  "- No inventory: items are procured after payment confirmation; processing time may apply.",
  "- ETA is an estimate and does not include customs delays.",
  "- Address errors are customer responsibility; re-shipment costs may be billed.",
  "- Partial shipments are avoided; if unavoidable, we notify.",
].join("\n");

export async function renderStripeEvidencePdfBuffer(input: { orderId: string }) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: true,
      acknowledgements: { orderBy: { acknowledgedAt: "desc" }, take: 5 },
      evidence: { orderBy: { createdAt: "asc" } },
      orderShipping: true,
      shipments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) throw new Error("Order not found");

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(18).text("Stripe Dispute Evidence Package", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#333");
  doc.text(`Generated: ${new Date().toISOString()}`);
  doc.text(`Order ID: ${order.id}`);
  doc.text(`Order status: ${order.status} / dispute: ${order.disputeStatus}`);
  doc.text(`Customer email: ${order.email ?? "—"}`);
  doc.text(`Country: ${order.country ?? "—"}`);
  doc.text(`PaymentIntent: ${order.stripePaymentIntentId ?? "—"}`);
  doc.text(`CheckoutSession: ${order.stripeCheckoutSessionId ?? "—"}`);
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000").text("Order summary");
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor("#333");
  doc.text(`Subtotal: ${moneyUsd(order.subtotalUsd)}  Shipping: ${moneyUsd(order.shippingUsd)}  Total: ${moneyUsd(order.totalUsd)}`);
  doc.moveDown(0.5);
  doc.fontSize(9);
  for (const it of order.items) {
    const snap: any = it.specSnapshot as any;
    const title = snap?.title ?? it.variantId;
    doc.text(`- ${title} | Qty ${it.quantity} | Line ${moneyUsd(it.lineTotalUsd)}`);
  }
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000").text("Acknowledgements (captured before Stripe redirect)");
  doc.moveDown(0.25);
  if (order.acknowledgements.length === 0) {
    doc.fontSize(10).fillColor("#333").text("No acknowledgement record found.");
  } else {
    const a = order.acknowledgements[0]!;
    doc.fontSize(10).fillColor("#333");
    doc.text(`ack_exact_spec: ${a.ackExactSpec}`);
    doc.text(`ack_no_inventory: ${a.ackNoInventory}`);
    doc.text(`ack_duties_taxes: ${a.ackDutiesTaxes}`);
    doc.text(`ack_refund_policy: ${a.ackRefundPolicy}`);
    doc.text(`acknowledged_at: ${a.acknowledgedAt.toISOString()}`);
    doc.text(`ip: ${a.ipAddress ?? "—"}`);
    doc.text(`user_agent: ${a.userAgent ?? "—"}`);
  }
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000").text("Shipping proof");
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor("#333");
  doc.text(`Carrier: ${order.carrier ?? order.orderShipping?.carrier ?? "—"}`);
  doc.text(`Tracking number: ${order.trackingNumber ?? order.orderShipping?.trackingNumber ?? "—"}`);
  doc.text(`Shipped at: ${(order.shippedAt ?? order.orderShipping?.shippedAt)?.toISOString?.() ?? "—"}`);
  doc.moveDown(0.5);
  if (order.orderShipping?.packagingPhotoUrls?.length) {
    doc.fontSize(9).text("Packaging photo URLs:");
    for (const u of order.orderShipping.packagingPhotoUrls) doc.text(`- ${u}`);
  }
  if (order.orderShipping?.shipmentPhotoUrls?.length) {
    doc.fontSize(9).text("Shipment photo URLs:");
    for (const u of order.orderShipping.shipmentPhotoUrls) doc.text(`- ${u}`);
  }
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000").text("Policy excerpts");
  doc.moveDown(0.25);
  doc.fontSize(9).fillColor("#333").text(POLICY_EXCERPT_REFUND);
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor("#333").text(POLICY_EXCERPT_SHIPPING);
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000").text("Evidence log (system)");
  doc.moveDown(0.25);
  doc.fontSize(8).fillColor("#333");
  for (const ev of order.evidence) {
    doc.text(`[${ev.createdAt.toISOString()}] ${ev.type} ${ev.fileUrl ? `url=${ev.fileUrl}` : ""}`);
    if (ev.textContent) {
      const txt = ev.textContent.length > 1200 ? `${ev.textContent.slice(0, 1200)}…` : ev.textContent;
      doc.text(txt);
    }
    doc.moveDown(0.5);
  }
  if (order.evidence.length === 0) doc.text("No evidence records.");

  doc.end();
  return await done;
}

