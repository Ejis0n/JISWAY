import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const sp = await searchParams;
  const success = sp.success === "1";

  return (
    <div className="space-y-8">
      {success ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          Order received. Items are procured after payment confirmation.
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-3xl font-semibold tracking-tight">JISWAY</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Global procurement for JIS fasteners. Ships worldwide. Prices in USD.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/jis"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Browse JIS Fasteners
          </Link>
          <Link
            href="/quote"
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Request a Quote
          </Link>
        </div>

        <div className="mt-6 text-xs text-zinc-500">
          <div>Exact JIS specification only.</div>
          <div>No substitutes.</div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">What is JIS?</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          JIS (Japanese Industrial Standards) are national standards for industrial products in Japan. JIS fasteners—bolts, nuts, and washers—have defined dimensions and strength grades, so they are widely used and easy to source globally. We procure exact JIS-spec items from Japan and ship worldwide.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">How procurement works</h2>
        <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li>Add items to cart and proceed to checkout or request a quote for large orders.</li>
          <li>After payment or quote approval, we procure the items from Japan.</li>
          <li>We ship to your address. Import duties and taxes are the responsibility of the recipient.</li>
        </ol>
      </section>
    </div>
  );
}
