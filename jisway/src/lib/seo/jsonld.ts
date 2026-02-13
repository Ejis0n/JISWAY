import type { CatalogVariant } from "@/lib/catalog";
import { buildSeoSlug } from "@/lib/seo/slug";
import { metaDescription, seoTitle } from "@/lib/seo/templates";

export function productJsonLd(v: CatalogVariant) {
  const url = `/jis/${v.category}/${buildSeoSlug(v)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seoTitle(v),
    sku: v.id,
    image: v.image_url ? [v.image_url] : undefined,
    description: `${metaDescription(v)} Procured after payment confirmation.`,
    brand: { "@type": "Brand", name: "JISWAY" },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: v.price_usd.toFixed(2),
      url,
      availability: "https://schema.org/PreOrder",
    },
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

