import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            JISWAY
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:flex">
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
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/quote"
            className="hidden rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 sm:inline-block"
          >
            Bulk / Quote
          </Link>
          <Link
            href="/cart"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}

