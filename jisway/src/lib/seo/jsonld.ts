import type { CatalogVariant } from "@/lib/catalog";
import { getAppBaseUrl } from "@/lib/baseUrl";
import { getProductImageUrl } from "@/lib/productImage";
import { buildSeoSlug } from "@/lib/seo/slug";
import { metaDescription, seoTitle } from "@/lib/seo/templates";

function absoluteUrl(path: string) {
  const base = getAppBaseUrl();
  return path.startsWith("http") ? path : `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function productJsonLd(v: CatalogVariant) {
  const path = `/jis/${v.category}/${buildSeoSlug(v)}`;
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(getProductImageUrl(v));
  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seoTitle(v),
    sku: v.id,
    image: [imageUrl],
    description: `${metaDescription(v)} Procured after payment confirmation.`,
    brand: { "@type": "Brand", name: "JISWAY" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: v.price_usd.toFixed(2),
      priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
      url,
      availability: "https://schema.org/PreOrder",
    },
  };
}

export function breadcrumbJsonLd(v: { category: string }, path: string, productName?: string) {
  const base = getAppBaseUrl();
  const home = base.replace(/\/+$/, "");
  const categoryLabel = v.category === "bolt" ? "Bolts" : v.category === "nut" ? "Nuts" : "Washers";
  const itemUrl = path.startsWith("http") ? path : `${home}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "JISWAY", item: home },
      { "@type": "ListItem", position: 2, name: categoryLabel, item: `${home}/jis/${v.category}` },
      { "@type": "ListItem", position: 3, name: productName ?? "Product", item: itemUrl },
    ],
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do you keep stock?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Procured after payment confirmation.",
        },
      },
      {
        "@type": "Question",
        name: "Are substitutes allowed?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No substitutes. Exact JIS specification only.",
        },
      },
      {
        "@type": "Question",
        name: "Duties and taxes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Import duties and taxes are the responsibility of the recipient.",
        },
      },
    ],
  };
}

