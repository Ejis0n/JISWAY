import type { Metadata } from "next";
import { QuoteFormClient } from "@/components/quote/QuoteFormClient";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Submit a quote request for high subtotal or special requirements.",
};

export default function QuotePage() {
  const catalog = getCatalog();
  return <QuoteFormClient catalog={catalog} />;
}

