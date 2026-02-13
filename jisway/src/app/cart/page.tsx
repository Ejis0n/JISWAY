import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Cart",
  description: "Cart and checkout.",
};

export default function CartPage() {
  const catalog = getCatalog();
  return <CartPageClient catalog={catalog} quoteThresholdUsd={300} />;
}

