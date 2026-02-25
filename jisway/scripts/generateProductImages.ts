/**
 * Generates one SVG per catalog variant in public/images/products/{id}.svg
 * Run: npx tsx scripts/generateProductImages.ts
 */
import fs from "node:fs";
import path from "node:path";

const catalogPath = path.join(process.cwd(), "data", "catalog.generated.json");
const outDir = path.join(process.cwd(), "public", "images", "products");

type Variant = {
  id: string;
  category: string;
  size: string;
  length_mm?: number | null;
  strength_class?: string | null;
  finish: string;
  pack_qty: number;
};

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function title(v: Variant): string {
  if (v.category === "bolt") {
    return `M${v.size}×${v.length_mm ?? "?"} ${v.strength_class ?? "8.8"} ${v.pack_qty}pcs`;
  }
  if (v.category === "nut") return `${v.size} ${v.pack_qty}pcs`;
  return `${v.size} ${v.pack_qty}pcs`;
}

function svgBolt(v: Variant): string {
  const t = escape(title(v));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="#f4f4f5"/>
  <rect x="20" y="20" width="360" height="260" rx="8" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>
  <path d="M200 70 L200 230 M155 95 L245 95 M155 205 L245 205" stroke="#71717a" stroke-width="14" stroke-linecap="round"/>
  <rect x="172" y="60" width="56" height="22" rx="4" fill="#52525b"/>
  <text x="200" y="155" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="#3f3f46" text-anchor="middle">${t}</text>
  <text x="200" y="178" font-family="system-ui,sans-serif" font-size="12" fill="#71717a" text-anchor="middle">JIS Hex Bolt</text>
</svg>`;
}

function svgNut(v: Variant): string {
  const t = escape(title(v));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="#f4f4f5"/>
  <rect x="20" y="20" width="360" height="260" rx="8" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>
  <polygon points="200,85 262,150 200,215 138,150" fill="none" stroke="#71717a" stroke-width="14"/>
  <circle cx="200" cy="150" r="38" fill="none" stroke="#52525b" stroke-width="10"/>
  <text x="200" y="152" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="#3f3f46" text-anchor="middle">${t}</text>
  <text x="200" y="175" font-family="system-ui,sans-serif" font-size="12" fill="#71717a" text-anchor="middle">JIS Hex Nut</text>
</svg>`;
}

function svgWasher(v: Variant): string {
  const t = escape(title(v));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="#f4f4f5"/>
  <rect x="20" y="20" width="360" height="260" rx="8" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>
  <circle cx="200" cy="150" r="82" fill="none" stroke="#71717a" stroke-width="16"/>
  <circle cx="200" cy="150" r="48" fill="#f4f4f5" stroke="#52525b" stroke-width="8"/>
  <text x="200" y="148" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="#3f3f46" text-anchor="middle">${t}</text>
  <text x="200" y="171" font-family="system-ui,sans-serif" font-size="12" fill="#71717a" text-anchor="middle">JIS Flat Washer</text>
</svg>`;
}

function svgFor(v: Variant): string {
  if (v.category === "bolt") return svgBolt(v);
  if (v.category === "nut") return svgNut(v);
  return svgWasher(v);
}

function main() {
  const raw = fs.readFileSync(catalogPath, "utf-8");
  const catalog = JSON.parse(raw) as Variant[];
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  let n = 0;
  for (const v of catalog) {
    const svg = svgFor(v);
    const file = path.join(outDir, `${v.id}.svg`);
    fs.writeFileSync(file, svg, "utf-8");
    n++;
  }
  console.log(`Wrote ${n} SVGs to ${outDir}`);
}

main();
