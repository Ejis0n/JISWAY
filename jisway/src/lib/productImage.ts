import type { CatalogVariant } from "@/lib/catalog";

const PLACEHOLDER_HOST = "placehold.co";

/**
 * Returns the image URL to display for a product variant.
 * - If catalog has a "real" image URL (not placeholder), use it.
 * - Else generated per-variant: /images/products/{variantId}.svg (see scripts/generateProductImages.mjs).
 */
export function getProductImageUrl(v: CatalogVariant): string {
  if (v.image_url?.trim()) {
    try {
      const u = new URL(v.image_url);
      if (!u.hostname.includes(PLACEHOLDER_HOST)) return v.image_url;
    } catch {
      if (!v.image_url.includes(PLACEHOLDER_HOST)) return v.image_url;
    }
  }
  return `/images/products/${v.id}.svg`;
}
