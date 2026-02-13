import type { ProcurementTask, ProcurementTaskLine, Supplier, Order, Variant, Product } from "@prisma/client";
import { getCatalog } from "@/lib/catalog";
import { seoTitle } from "@/lib/seo/templates";

type TaskWithLines = ProcurementTask & {
  order: Order;
  supplier: Supplier | null;
  lines: Array<
    ProcurementTaskLine & {
      variant: Variant & { product: Product };
    }
  >;
};

export function supplierPoEmail(task: TaskWithLines) {
  const catalog = getCatalog();
  const subject = `PO ${task.id} — JISWAY procurement request`;

  const lines = task.lines.map((l) => {
    const cat = catalog.find((v) => v.id === l.variant.slug) ?? null;
    const title = cat ? seoTitle(cat) : l.variant.slug;
    const pack = l.packQty ? `${l.packQty}pcs` : l.variant.packType;
    return `- ${title} | Pack ${pack} | Qty (packs): ${l.qtyPacks}`;
  });

  const text = [
    `Hello${task.supplier?.name ? ` ${task.supplier.name}` : ""},`,
    "",
    "We request procurement for the following JIS fastener items (exact specification only; no substitutes).",
    "",
    `PO Number: ${task.id}`,
    `Order Ref: ${task.orderId}`,
    `Country: ${task.order.country ?? "—"}`,
    "",
    "Items:",
    ...lines,
    "",
    "Please confirm:",
    "- Availability for exact JIS spec (no substitutes)",
    "- Lead time (days)",
    "- Total cost and any notes",
    "",
    "Thank you.",
    "JISWAY Ops",
  ].join("\n");

  return { subject, text };
}

