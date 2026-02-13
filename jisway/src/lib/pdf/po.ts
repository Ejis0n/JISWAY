import PDFDocument from "pdfkit";
import type { ProcurementTask, ProcurementTaskLine, Supplier, Order, Variant, Product } from "@prisma/client";
import { seoTitle } from "@/lib/seo/templates";
import { getCatalog } from "@/lib/catalog";

type TaskWithLines = ProcurementTask & {
  order: Order;
  supplier: Supplier | null;
  lines: Array<
    ProcurementTaskLine & {
      variant: Variant & { product: Product };
    }
  >;
};

function moneyUsdCents(n: number) {
  return `$${(n / 100).toFixed(2)}`;
}

export async function renderPoPdfBuffer(task: TaskWithLines) {
  const catalog = getCatalog();
  const doc = new PDFDocument({ size: "A4", margin: 48 });

  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const now = new Date();

  doc.fontSize(18).text("Purchase Order (PO)", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#333").text(`PO Number: ${task.id}`);
  doc.text(`Order ID: ${task.orderId}`);
  doc.text(`Date: ${now.toISOString().slice(0, 10)}`);
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000").text("Supplier");
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor("#333");
  doc.text(task.supplier?.name ?? "—");
  if (task.supplier?.email) doc.text(task.supplier.email);
  if (task.supplier?.phone) doc.text(task.supplier.phone);
  if (task.supplier?.address) doc.text(task.supplier.address);
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000").text("Buyer");
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor("#333");
  doc.text("JISWAY (Global procurement)");
  doc.text("No substitution. Exact JIS specification only.");
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#000").text("Lines");
  doc.moveDown(0.5);

  const startX = doc.x;
  const col1 = startX;
  const col2 = startX + 300;
  const col3 = startX + 410;
  const col4 = startX + 470;

  doc.fontSize(9).fillColor("#000");
  doc.text("Item", col1, doc.y, { width: 290 });
  doc.text("Pack", col2, doc.y, { width: 90 });
  doc.text("Qty", col3, doc.y, { width: 50 });
  doc.text("Notes", col4, doc.y, { width: 90 });
  doc.moveDown(0.25);
  doc.moveTo(startX, doc.y).lineTo(startX + 500, doc.y).strokeColor("#ddd").stroke();
  doc.moveDown(0.5);

  doc.strokeColor("#000").fillColor("#333");

  for (const line of task.lines) {
    const cat = catalog.find((v) => v.id === line.variant.slug) ?? null;
    const title = cat ? seoTitle(cat) : line.variant.slug;
    const pack = line.packQty ? `${line.packQty}pcs` : line.variant.packType;
    const qty = String(line.qtyPacks);

    const y = doc.y;
    doc.fontSize(9).fillColor("#000").text(title, col1, y, { width: 290 });
    doc.fillColor("#333").text(pack, col2, y, { width: 90 });
    doc.text(qty, col3, y, { width: 50 });
    doc.text("Exact spec only", col4, y, { width: 90 });
    doc.moveDown(0.75);
  }

  doc.moveDown(1);
  doc.fontSize(10).fillColor("#000").text("Internal notes", { underline: true });
  doc.fontSize(9).fillColor("#333").text(task.procurementNotes ?? "—");

  doc.moveDown(1);
  doc.fontSize(9).fillColor("#333").text(
    `Order total (USD): ${moneyUsdCents(task.order.totalUsd)} | Country: ${task.order.country ?? "—"}`,
  );

  doc.end();
  return await done;
}

