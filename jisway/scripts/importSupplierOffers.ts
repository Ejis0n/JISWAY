import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

type Row = Record<string, string | undefined>;

function toInt(v: string | undefined) {
  if (v == null) return null;
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function norm(v: string | undefined) {
  return (v ?? "").trim();
}

function normUpper(v: string | undefined) {
  const s = norm(v);
  return s ? s.toUpperCase() : "";
}

function normLower(v: string | undefined) {
  const s = norm(v);
  return s ? s.toLowerCase() : "";
}

function asAvail(v: string | undefined) {
  const s = normLower(v);
  if (s === "in_stock") return "in_stock";
  if (s === "limited") return "limited";
  if (s === "backorder") return "backorder";
  return "unknown";
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) throw new Error("Usage: tsx scripts/importSupplierOffers.ts path/to/offers.csv");

  const p = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath);
  const raw = fs.readFileSync(p, "utf-8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Row[];

  const prisma = new PrismaClient();
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const [idx, r] of rows.entries()) {
    try {
      const supplierName = norm(r["supplier_name"]);
      if (!supplierName) throw new Error("supplier_name required");

      const category = normLower(r["category"]);
      if (category && !["bolt", "nut", "washer"].includes(category)) throw new Error("invalid category");

      const size = normUpper(r["size"]);
      const lengthMm = toInt(r["length_mm"]);
      const strengthClass = norm(r["strength_class"]) || null;
      const finish = normLower(r["finish"]) || null;
      const packQty = toInt(r["pack_qty"]);
      const unitCostJpy = toInt(r["unit_cost_jpy"]);
      if (!unitCostJpy || unitCostJpy <= 0) throw new Error("unit_cost_jpy required");

      const leadTimeDays = toInt(r["lead_time_days"]);
      const availability = asAvail(r["availability"]);

      const supplier =
        (await prisma.supplier.findFirst({
          where: { name: { equals: supplierName, mode: "insensitive" } },
        })) ?? (await prisma.supplier.create({ data: { name: supplierName } }));

      const variantIdRaw = norm(r["variant_id"]);
      const variant = variantIdRaw ? await prisma.variant.findFirst({ where: { slug: variantIdRaw } }) : null;

      const where = {
        supplierId: supplier.id,
        variantId: variant?.id ?? null,
        category: category ? (category as any) : null,
        size: size || null,
        lengthMm: lengthMm ?? null,
        finish,
        strengthClass,
        packQty: packQty ?? null,
      } as const;

      const existing = await prisma.supplierOffer.findFirst({ where });
      if (existing) {
        await prisma.supplierOffer.update({
          where: { id: existing.id },
          data: { unitCostJpy, leadTimeDays, availability },
        });
        updated += 1;
      } else {
        await prisma.supplierOffer.create({
          data: {
            supplierId: supplier.id,
            variantId: variant?.id ?? null,
            category: category ? (category as any) : null,
            size: size || null,
            lengthMm: lengthMm ?? null,
            finish,
            strengthClass,
            packQty: packQty ?? null,
            unitCostJpy,
            leadTimeDays,
            availability: availability as any,
          },
        });
        created += 1;
      }
    } catch {
      failed += 1;
      // eslint-disable-next-line no-console
      console.error(`Row ${idx + 2} failed`);
    }
  }

  await prisma.$disconnect();
  // eslint-disable-next-line no-console
  console.log({ created, updated, failed });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

