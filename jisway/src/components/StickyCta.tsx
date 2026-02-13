"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StickyCta({ sku }: { sku?: string }) {
  const pathname = usePathname();
  const q = sku ? `sku=${encodeURIComponent(sku)}` : `from=${encodeURIComponent(pathname)}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="text-xs text-zinc-600 dark:text-zinc-300">
          No substitutes. Exact JIS specification.
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/quote?${q}`}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Request a Quote
          </Link>
          <Link
            href={`/procure?${q}`}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Procurement Request
          </Link>
        </div>
      </div>
    </div>
  );
}

