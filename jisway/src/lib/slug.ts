import type { PackType, ProductCategory } from "@prisma/client";

function slugifySize(size: string) {
  return size.trim().toLowerCase();
}

function strengthToSlug(strengthClass?: string | null) {
  if (!strengthClass) return undefined;
  return strengthClass.trim().replaceAll(".", "-");
}

function finishToSlug(finish: string) {
  const f = finish.trim().toLowerCase();
  if (f.includes("zinc")) return "zinc";
  return f.replaceAll(/\s+/g, "-");
}

function packToSlug(packType: PackType) {
  return packType === "PACK_10" ? "10pcs" : "20pcs";
}

export function buildSpecKey(input: {
  category: ProductCategory;
  standard: string;
  size: string;
  length?: number | null;
  strengthClass?: string | null;
  finish: string;
}) {
  const parts = [
    input.category,
    input.standard.trim().toUpperCase(),
    slugifySize(input.size),
    input.length ?? "",
    (input.strengthClass ?? "").trim(),
    input.finish.trim().toLowerCase(),
  ];
  return parts.join("|");
}

export function buildVariantSlug(input: {
  category: ProductCategory;
  size: string;
  length?: number | null;
  strengthClass?: string | null;
  finish: string;
  packType: PackType;
}) {
  const sizeSlug = slugifySize(input.size);
  const finishSlug = finishToSlug(input.finish);
  const packSlug = packToSlug(input.packType);

  if (input.category === "bolt") {
    const strengthSlug = strengthToSlug(input.strengthClass) ?? "8-8";
    if (!input.length) throw new Error("Bolt slug requires length");
    return `${sizeSlug}x${input.length}-${strengthSlug}-${finishSlug}-${packSlug}`;
  }

  return `${sizeSlug}-${finishSlug}-${packSlug}`;
}

