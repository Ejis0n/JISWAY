import type { Metadata } from "next";
import { OfferFormClient } from "@/components/offer/OfferFormClient";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "オファーを送る",
  description: "希望価格・数量・商品についてオファーを送信できます。",
};

export default function OfferPage({
  searchParams,
}: {
  searchParams: Promise<{ variantId?: string }>;
}) {
  const catalog = getCatalog();
  const sp = await searchParams;
  const variantId = sp.variantId?.trim() || null;
  return <OfferFormClient initialVariantId={variantId} catalog={catalog} />;
}
