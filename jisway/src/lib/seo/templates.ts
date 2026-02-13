import type { CatalogVariant } from "@/lib/catalog";

function pack(v: Pick<CatalogVariant, "pack_qty">) {
  return v.pack_qty;
}

function finishLabel(finish: string) {
  // catalog uses "zinc"; keep technical wording minimal
  if (finish.toLowerCase() === "zinc") return "Zinc";
  return finish;
}

export function seoTitle(v: CatalogVariant) {
  const f = finishLabel(v.finish);
  if (v.category === "bolt") {
    return `JIS Hex Bolt ${v.size}×${v.length_mm} (Class ${v.strength_class ?? "8.8"}) ${f} — ${pack(v)} pcs | JISWAY`;
  }
  if (v.category === "nut") {
    return `JIS Hex Nut ${v.size} ${f} — ${pack(v)} pcs | JISWAY`;
  }
  return `JIS Flat Washer ${v.size} ${f} — ${pack(v)} pcs | JISWAY`;
}

function truncate160(s: string) {
  if (s.length <= 160) return s;
  const trimmed = s.slice(0, 157);
  const last = trimmed.lastIndexOf(" ");
  if (last > 120) return trimmed.slice(0, last) + "...";
  return trimmed + "...";
}

export function metaDescription(v: CatalogVariant) {
  const f = finishLabel(v.finish).toLowerCase();
  const p = pack(v);
  if (v.category === "bolt") {
    const s = `Procure JIS hex bolt ${v.size}×${v.length_mm} (class ${v.strength_class ?? "8.8"}), ${f}, pack of ${p}. No substitutes. Ships from Japan.`;
    return truncate160(s);
  }
  if (v.category === "nut") {
    const s = `Procure JIS hex nut ${v.size}, ${f}, pack of ${p}. No substitutes. Ships from Japan.`;
    return truncate160(s);
  }
  const s = `Procure JIS flat washer ${v.size}, ${f}, pack of ${p}. No substitutes. Ships from Japan.`;
  return truncate160(s);
}

