import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">Admin</div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/orders">
              Orders
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/ops">
              Ops
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/procurement">
              Procurement
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/suppliers">
              Suppliers
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/offers">
              Offers
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/customer-offers">
              Customer offers
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/routing">
              Routing
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/pricing">
              Pricing
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/quotes">
              Quotes
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/invoices">
              Invoices
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/catalog">
              Products/Variants
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/shipping">
              Shipping
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/support">
              Support
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/procure">
              Procure
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/health">
              Health
            </Link>
            <Link className="hover:text-zinc-950 dark:hover:text-white" href="/admin/analytics">
              Analytics
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}

