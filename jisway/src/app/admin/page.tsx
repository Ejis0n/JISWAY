import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/quotes"
          className="rounded-xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <div className="text-sm font-semibold">Quote requests</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Review and approve: Stripe invoice / wire / USDT.
          </div>
        </Link>
        <Link
          href="/admin/invoices"
          className="rounded-xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <div className="text-sm font-semibold">Invoices</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Wire/USDT hosted invoices and status.
          </div>
        </Link>
      </div>
    </div>
  );
}

