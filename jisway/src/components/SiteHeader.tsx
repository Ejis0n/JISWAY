import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:flex-initial">
          <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight">
            JISWAY
          </Link>
          {/* Desktop nav */}
          <nav className="hidden items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:flex" aria-label="Main">
            <Link
              href="/jis/bolt"
              className="hover:text-zinc-950 dark:hover:text-white"
            >
              Bolts
            </Link>
            <Link
              href="/jis/nut"
              className="hover:text-zinc-950 dark:hover:text-white"
            >
              Nuts
            </Link>
            <Link
              href="/jis/washer"
              className="hover:text-zinc-950 dark:hover:text-white"
            >
              Washers
            </Link>
          </nav>
          {/* Mobile nav: expandable menu */}
          <details className="group sm:hidden">
            <summary className="flex list-none cursor-pointer items-center gap-1 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
              Menu
              <span className="transition group-open:rotate-180" aria-hidden>▼</span>
            </summary>
            <nav className="mt-2 flex flex-col gap-1 rounded-md border border-zinc-200 bg-white py-2 dark:border-zinc-700 dark:bg-zinc-900" aria-label="Mobile">
              <Link href="/jis/bolt" className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Bolts
              </Link>
              <Link href="/jis/nut" className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Nuts
              </Link>
              <Link href="/jis/washer" className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Washers
              </Link>
              <Link href="/quote" className="border-t border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Bulk / Quote
              </Link>
              <Link href="/offer" className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Make an offer
              </Link>
            </nav>
          </details>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/quote"
            className="hidden rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 sm:inline-block"
          >
            Bulk / Quote
          </Link>
          <Link
            href="/offer"
            className="hidden rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 sm:inline-block"
          >
            Make an offer
          </Link>
          <Link
            href="/cart"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}

