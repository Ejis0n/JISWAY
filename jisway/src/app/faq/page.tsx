import type { Metadata } from "next";
import { faqJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about JIS fasteners procurement, delivery, and ordering.",
};

const QAS = [
  {
    q: "Do you keep stock?",
    a: "No. Items are procured after payment confirmation (or after quote/invoice approval). Processing starts as soon as we confirm your order.",
  },
  {
    q: "Are substitutes allowed?",
    a: "No substitutes. We supply exact JIS specification only. Please confirm size, length, and strength class before ordering.",
  },
  {
    q: "Who pays duties and taxes?",
    a: "Import duties and taxes are the responsibility of the recipient. We ship from Japan; customs may apply in your country.",
  },
  {
    q: "How long does delivery take?",
    a: "Typically 2–3 weeks after payment: we procure the items in Japan, then ship to your address. Exact timing depends on destination and carrier.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept card payments (Stripe) and, for larger orders, wire transfer or USDT. Use the quote or alternative-payment flow for non-card options.",
  },
  {
    q: "Can I request a custom quantity or price?",
    a: "Yes. Use “Make an offer” to send your desired price and quantity. We will review and reply by email.",
  },
];

export default function FaqPage() {
  const jsonLd = faqJsonLd();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">FAQ</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Frequently asked questions about ordering and delivery.
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        {QAS.map(({ q, a }) => (
          <div key={q}>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">{q}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{a}</p>
          </div>
        ))}
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
