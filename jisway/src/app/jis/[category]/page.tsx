import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVariantsByCategory, type CatalogCategory } from "@/lib/catalog";
import { buildSeoSlug } from "@/lib/seo/slug";
import { seoTitle } from "@/lib/seo/templates";

const CATEGORIES: CatalogCategory[] = ["bolt", "nut", "washer"];
function isCategory(x: string): x is CatalogCategory {
  return (CATEGORIES as readonly string[]).includes(x);
}

function titleFor(category: CatalogCategory) {
  return category === "bolt" ? "Bolts" : category === "nut" ? "Nuts" : "Washers";
}

function uniqueSorted<T>(arr: T[]) {
  return Array.from(new Set(arr)).sort() as T[];
}

const PER_PAGE = 50;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const title = titleFor(category);
  return {
    title: `JIS ${title}`,
    description: `JIS ${title} variants in USD. No inventory; procured after payment confirmation.`,
    alternates: { canonical: `/jis/${category}` },
  };
}

export default async function JisCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ size?: string; pack?: string; length?: string; q?: string; page?: string }>;
}) {
  const { category } = await params;
  if (!isCategory(category)) return notFound();

  const sp = await searchParams;
  const all = getVariantsByCategory(category);

  const size = sp.size && /^M/.test(sp.size) ? sp.size : undefined;
  const pack =
    sp.pack === "10" || sp.pack === "20" || sp.pack === "50" || sp.pack === "100"
      ? Number(sp.pack)
      : undefined;
  const length = sp.length && /^\d+$/.test(sp.length) ? Number(sp.length) : undefined;
  const q = sp.q?.trim() || "";
  const page = Math.max(1, Number(sp.page || "1") || 1);

  const sizes = uniqueSorted(all.map((v) => v.size));
  const packs = uniqueSorted(all.map((v) => v.pack_qty));
  const lengths =
    category === "bolt"
      ? uniqueSorted(all.map((v) => v.length_mm).filter((x): x is number => typeof x === "number"))
      : [];

  const filteredAll = all
    .filter((v) => (size ? v.size === size : true))
    .filter((v) => (pack ? v.pack_qty === pack : true))
    .filter((v) => (category === "bolt" && length ? v.length_mm === length : true))
    .filter((v) => {
      if (!q) return true;
      const hay = `${v.id} ${v.size} ${v.length_mm ?? ""} ${v.pack_qty} ${v.finish} ${seoTitle(v)}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => {
      const s = a.size.localeCompare(b.size);
      if (s !== 0) return s;
      const l = (a.length_mm ?? 0) - (b.length_mm ?? 0);
      if (l !== 0) return l;
      return a.pack_qty - b.pack_qty;
    });

  const total = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const end = Math.min(total, start + PER_PAGE);
  const filtered = filteredAll.slice(start, end);

  const title = titleFor(category);

  const buildHref = (next: { size?: string; pack?: number; length?: number; q?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (next.size) qs.set("size", next.size);
    if (next.pack) qs.set("pack", String(next.pack));
    if (category === "bolt" && next.length) qs.set("length", String(next.length));
    if (typeof next.q === "string" && next.q.trim()) qs.set("q", next.q.trim());
    if (next.page && next.page > 1) qs.set("page", String(next.page));
    const q = qs.toString();
    return q ? `/jis/${category}?${q}` : `/jis/${category}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">JIS {title}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          USD. Server-rendered filters. Page size: {PER_PAGE}.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xs font-semibold text-zinc-500">Size</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={buildHref({ pack, length, q, page: 1 })}
                className={`rounded-md border px-2 py-1 text-xs ${!size ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"}`}
              >
                All
              </Link>
              {sizes.map((s) => (
                <Link
                  key={s}
                  href={buildHref({ size: s, pack, length, q, page: 1 })}
                  className={`rounded-md border px-2 py-1 text-xs ${size === s ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"}`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-zinc-500">Pack</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={buildHref({ size, length, q, page: 1 })}
                className={`rounded-md border px-2 py-1 text-xs ${!pack ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"}`}
              >
                All
              </Link>
              {packs.map((p) => (
                <Link
                  key={p}
                  href={buildHref({ size, pack: p, length, q, page: 1 })}
                  className={`rounded-md border px-2 py-1 text-xs ${pack === p ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"}`}
                >
                  {p}pcs
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-zinc-500">Length</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {category !== "bolt" ? (
                <div className="text-xs text-zinc-600 dark:text-zinc-300">N/A</div>
              ) : (
                <>
                  <Link
                    href={buildHref({ size, pack, q, page: 1 })}
                    className={`rounded-md border px-2 py-1 text-xs ${!length ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"}`}
                  >
                    All
                  </Link>
                  {lengths.map((l) => (
                    <Link
                      key={l}
                      href={buildHref({ size, pack, length: l, q, page: 1 })}
                      className={`rounded-md border px-2 py-1 text-xs ${length === l ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"}`}
                    >
                      {l}mm
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-zinc-500">Search</div>
            <form method="get" className="mt-2 flex gap-2">
              {size ? <input type="hidden" name="size" value={size} /> : null}
              {pack ? <input type="hidden" name="pack" value={String(pack)} /> : null}
              {category === "bolt" && length ? <input type="hidden" name="length" value={String(length)} /> : null}
              <input
                name="q"
                defaultValue={q}
                placeholder="id / size / title"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
              <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                Go
              </button>
            </form>
            <div className="mt-2 text-xs text-zinc-500">
              Showing {total === 0 ? 0 : start + 1}-{end} of {total}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="text-zinc-600 dark:text-zinc-300">
          Page {safePage} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={safePage <= 1}
            className={`rounded-md border px-3 py-2 ${
              safePage <= 1
                ? "pointer-events-none opacity-50 border-zinc-200 dark:border-zinc-800"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
            }`}
            href={buildHref({ size, pack, length, q, page: Math.max(1, safePage - 1) })}
          >
            Prev
          </Link>
          <Link
            aria-disabled={safePage >= totalPages}
            className={`rounded-md border px-3 py-2 ${
              safePage >= totalPages
                ? "pointer-events-none opacity-50 border-zinc-200 dark:border-zinc-800"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
            }`}
            href={buildHref({ size, pack, length, q, page: Math.min(totalPages, safePage + 1) })}
          >
            Next
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">SKU / Title</th>
              <th className="px-4 py-3">Spec</th>
              {category === "bolt" ? <th className="px-4 py-3">Length</th> : null}
              <th className="px-4 py-3">Pack</th>
              <th className="px-4 py-3">Price (USD)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((v) => (
              <tr key={v.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{seoTitle(v)}</div>
                  <div className="mt-1 font-mono text-xs text-zinc-500">{v.id}</div>
                </td>
                <td className="px-4 py-3">
                  {v.size}
                  {v.category === "bolt" ? ` · ${v.strength_class ?? "8.8"}` : ""} · {v.finish}
                </td>
                {category === "bolt" ? <td className="px-4 py-3">{v.length_mm} mm</td> : null}
                <td className="px-4 py-3">{v.pack_qty}pcs</td>
                <td className="px-4 py-3">${v.price_usd.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    className="inline-block rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    href={`/jis/${category}/${buildSeoSlug(v)}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={6}>
                  No variants match the selected filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

