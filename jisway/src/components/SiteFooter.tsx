import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Notes</div>
            <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
              <li>Ships worldwide. Prices in USD.</li>
              <li>No substitutes. Exact JIS specification.</li>
              <li>Procured through Japan-based industrial supply chain.</li>
              <li>Import duties and taxes are the responsibility of the recipient.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Requests</div>
            <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
              <li>
                <Link className="hover:text-zinc-950 dark:hover:text-white" href="/quote">
                  Bulk / Quote request
                </Link>
              </li>
              <li>
                <Link className="hover:text-zinc-950 dark:hover:text-white" href="/offer">
                  Make an offer
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-zinc-950 dark:hover:text-white"
                  href="/alternative-payment"
                >
                  Request alternative payment (wire / USDT)
                </Link>
              </li>
              <li>
                <Link className="hover:text-zinc-950 dark:hover:text-white" href="/support">
                  Support
                </Link>
              </li>
              <li>
                <Link className="hover:text-zinc-950 dark:hover:text-white" href="/faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-xs text-zinc-500">© {new Date().getFullYear()} JISWAY</div>
      </div>
    </footer>
  );
}

