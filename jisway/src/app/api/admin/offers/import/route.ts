import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

    const text = await file.text();
    const records = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Row[];

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (const [idx, r] of records.entries()) {
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

        // find or create supplier (name is not unique; we pick first match)
        const supplier =
          (await prisma.supplier.findFirst({
            where: { name: { equals: supplierName, mode: "insensitive" } },
          })) ?? (await prisma.supplier.create({ data: { name: supplierName } }));

        // attempt to map to Variant by slug id (optional column variant_id)
        const variantIdRaw = norm(r["variant_id"]);
        const variant = variantIdRaw
          ? await prisma.variant.findFirst({ where: { slug: variantIdRaw } })
          : null;

        // Upsert strategy: we create a stable key by supplier + variantId + spec columns.
        // Prisma doesn't have a natural unique constraint here; we "findFirst then update/create".
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

        // Create CostBasis history (map to variants when possible)
        const now = new Date();
        const packType =
          packQty === 10 ? "PACK_10" : packQty === 20 ? "PACK_20" : packQty === 50 ? "PACK_50" : packQty === 100 ? "PACK_100" : null;

        const variantsToUpdate = variant
          ? [variant]
          : category && size && packType
            ? await prisma.variant.findMany({
                where: {
                  packType: packType as any,
                  product: {
                    category: category as any,
                    size,
                    ...(lengthMm != null ? { length: lengthMm } : {}),
                    ...(finish ? { finish: { contains: finish, mode: "insensitive" } } : {}),
                    ...(strengthClass ? { strengthClass } : {}),
                  },
                },
                take: 200,
              })
            : [];

        for (const v of variantsToUpdate) {
          await prisma.costBasis.create({
            data: {
              variantId: v.id,
              supplierId: supplier.id,
              costJpyPerPack: unitCostJpy,
              leadTimeDays,
              availability: availability as any,
              capturedAt: now,
              source: "supplier_offer",
            },
          });
        }
      } catch (e) {
        failed += 1;
        errors.push({ row: idx + 2, error: e instanceof Error ? e.message : "unknown" }); // +2: header + 1-index
      }
    }

    // Simple JSON report for now (UI can be added later)
    return NextResponse.json({ created, updated, failed, errors });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

