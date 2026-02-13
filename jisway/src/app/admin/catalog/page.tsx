import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();

  const variants = await prisma.variant.findMany({
    where: q
      ? {
          OR: [
            { slug: { contains: q, mode: "insensitive" } },
            { product: { size: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { product: true },
    orderBy: [{ product: { category: "asc" } }, { product: { size: "asc" } }, { product: { length: "asc" } }],
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products/Variants</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Edit active, price, and image URL (DB). Public pages are seeded from catalog v0.
          </div>
        </div>
        <form className="flex items-center gap-2" method="get">
          <label className="text-sm">
            <span className="sr-only">Search</span>
            <input
              name="q"
              defaultValue={q || ""}
              placeholder="Search (slug, size)"
              className="w-64 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Spec</th>
              <th className="px-4 py-3">Pack</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Price (USD)</th>
              <th className="px-4 py-3">Image URL</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {variants.map((v) => (
              <tr key={v.id} className="align-top">
                <td className="px-4 py-3 font-mono text-xs">{v.slug}</td>
                <td className="px-4 py-3">{v.product.category}</td>
                <td className="px-4 py-3">
                  {v.product.size}
                  {v.product.length ? `×${v.product.length}` : ""} · {v.product.finish}
                </td>
                <td className="px-4 py-3">{v.packType === "PACK_10" ? "10" : "20"}</td>
                <td className="px-4 py-3">{v.active ? "yes" : "no"}</td>
                <td className="px-4 py-3">${(v.priceUsd / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="max-w-xs truncate text-xs text-zinc-600 dark:text-zinc-300">
                    {v.product.imageUrl ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link className="underline underline-offset-4" href={`/admin/catalog/${v.id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {variants.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={8}>
                  No variants.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

