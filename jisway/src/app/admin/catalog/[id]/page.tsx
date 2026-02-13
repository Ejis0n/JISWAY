import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCatalogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await prisma.variant.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!v) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit variant</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 font-mono">{v.slug}</div>
        </div>
        <Link className="text-sm underline underline-offset-4" href="/admin/catalog">
          Back
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-zinc-500">Category</div>
            <div className="mt-1">{v.product.category}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">Spec</div>
            <div className="mt-1">
              {v.product.standard} {v.product.size}
              {v.product.length ? `×${v.product.length}` : ""} · {v.product.finish}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <form action={`/api/admin/catalog/${v.id}`} method="post" className="space-y-4">
          <label className="block">
            <div className="text-xs font-semibold text-zinc-500">Active</div>
            <select
              name="active"
              defaultValue={v.active ? "true" : "false"}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-zinc-500">Price (USD)</div>
            <input
              name="price_usd"
              defaultValue={(v.priceUsd / 100).toFixed(2)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-zinc-500">Image URL (product-level)</div>
            <input
              name="image_url"
              defaultValue={v.product.imageUrl ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>

          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

