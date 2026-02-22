import type { Metadata } from "next";
import { OfferFormClient } from "@/components/offer/OfferFormClient";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Make an offer",
  description: "Submit an offer with your desired price, quantity, and product.",
};

export default async function OfferPage({
  searchParams,
}: {
  searchParams: Promise<{ variantId?: string }>;
}) {
  const catalog = getCatalog();
  const sp = await searchParams;
  const variantId = sp.variantId?.trim() || null;
  return <OfferFormClient initialVariantId={variantId} catalog={catalog} />;
}
