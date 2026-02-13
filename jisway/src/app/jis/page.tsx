import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "JIS Catalog",
  description: "Programmatic catalog pages for JIS fasteners (bolts/nuts/washers).",
};

export default function JisIndexPage() {
  const catalog = getCatalog();
  const counts = catalog.reduce(
    (acc, v) => {
      acc[v.category] += 1;
      return acc;
    },
    { bolt: 0, nut: 0, washer: 0 } as Record<"bolt" | "nut" | "washer", number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">JIS Catalog</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">USD. Programmatic catalog pages.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/jis/bolt"
          className="rounded-xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <div className="text-sm font-semibold">Bolts</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            JIS standard bolt variants ({counts.bolt})
          </div>
        </Link>
        <Link
          href="/jis/nut"
          className="rounded-xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <div className="text-sm font-semibold">Nuts</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            JIS standard nut variants ({counts.nut})
          </div>
        </Link>
        <Link
          href="/jis/washer"
          className="rounded-xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <div className="text-sm font-semibold">Washers</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            JIS standard washer variants ({counts.washer})
          </div>
        </Link>
      </div>
    </div>
  );
}

