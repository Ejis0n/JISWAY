import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { StickyCta } from "@/components/StickyCta";
import { getCatalog, getVariantBySeoSlug, type CatalogCategory } from "@/lib/catalog";
import { buildSeoSlug } from "@/lib/seo/slug";
import { internalLinks } from "@/lib/seo/links";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { faqJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { metaDescription, seoTitle } from "@/lib/seo/templates";

const CATEGORIES = ["bolt", "nut", "washer"] as const;
function isCategory(x: string): x is CatalogCategory {
  return (CATEGORIES as readonly string[]).includes(x);
}

function isHubSlug(slug: string) {
  return /^m(?:[3-9]|1\d|2[0-4])$/.test(slug);
}

function sizeFromHubSlug(slug: string) {
  return slug.toUpperCase();
}

export function generateStaticParams() {
  const catalog = getCatalog();
  const hubs = Array.from(
    new Set(catalog.map((v) => ({ category: v.category, slug: v.size.toLowerCase() }))),
  );
  return [...hubs, ...catalog.map((v) => ({ category: v.category, slug: buildSeoSlug(v) }))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isCategory(category)) return {};

  if (isHubSlug(slug)) {
    const size = sizeFromHubSlug(slug);
    return buildSeoMetadata({
      path: `/jis/${category}/${slug}`,
      title: `JIS ${category} ${size} Procurement`,
      description: `JIS standard ${category} ${size}. Procurement from Japan. Exact JIS specification only. No substitutes.`,
    });
  }

  const variant = getVariantBySeoSlug(category, slug);
  if (!variant) return {};

  return buildSeoMetadata({
    path: `/jis/${category}/${slug}`,
    title: seoTitle(variant),
    description: metaDescription(variant),
  });
}

export default async function VariantPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  if (!isCategory(category)) return notFound();

  if (isHubSlug(slug)) {
    const size = sizeFromHubSlug(slug);
    const catalog = getCatalog();
    const variants = catalog
      .filter((v) => v.category === category && v.size === size)
      .sort((a, b) => {
        const l = (a.length_mm ?? 0) - (b.length_mm ?? 0);
        if (l !== 0) return l;
        return a.pack_qty - b.pack_qty;
      });

    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: variants.map((v, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `/jis/${v.category}/${buildSeoSlug(v)}`,
        name: seoTitle(v),
      })),
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            JIS {category} {size} Procurement
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            JIS standard {category} {size}. Procurement from Japan. Exact JIS specification only.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Notes</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
            <li>No substitutes. Exact JIS specification.</li>
            <li>Confirm size/length before ordering. No substitutes.</li>
            <li>Procured through Japan-based industrial supply chain.</li>
            <li>Import duties and taxes are the responsibility of the recipient.</li>
          </ul>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">SKU/Title</th>
                {category === "bolt" ? <th className="px-4 py-3">Length</th> : null}
                <th className="px-4 py-3">Pack</th>
                <th className="px-4 py-3">Price (USD)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {variants.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{seoTitle(v)}</div>
                    <div className="mt-1 font-mono text-xs text-zinc-500">{v.id}</div>
                  </td>
                  {category === "bolt" ? <td className="px-4 py-3">{v.length_mm} mm</td> : null}
                  <td className="px-4 py-3">{v.pack_qty}pcs</td>
                  <td className="px-4 py-3">${v.price_usd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link className="underline underline-offset-4" href={`/jis/${v.category}/${buildSeoSlug(v)}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {variants.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={5}>
                    No variants.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
        <div className="h-20" />
        <StickyCta />
      </div>
    );
  }

  const variant = getVariantBySeoSlug(category, slug);
  if (!variant) return notFound();

  const catalog = getCatalog();
  const links = internalLinks(variant, catalog);
  const jsonLd = productJsonLd(variant);
  const faq = faqJsonLd();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative aspect-[4/3]">
            {variant.image_url ? (
              <Image
                src={variant.image_url}
                alt={seoTitle(variant)}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 520px, 100vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                No image
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">{seoTitle(variant)}</h1>
          <div className="text-xl font-semibold">
            ${variant.price_usd.toFixed(2)} USD · {variant.pack_qty}pcs
          </div>
          <div className="flex flex-wrap gap-3">
            <AddToCartButton variantId={variant.id} />
            <Link
              href={`/offer?variantId=${encodeURIComponent(variant.id)}`}
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              オファーを送る
            </Link>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Notes</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
              <li>No substitutes. Exact JIS specification.</li>
              <li>Confirm size/length before ordering. No substitutes.</li>
              <li>Procured through Japan-based industrial supply chain.</li>
              <li>Import duties and taxes are the responsibility of the recipient.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
          Specification
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <tr>
              <td className="w-48 px-4 py-3 text-zinc-500">Standard</td>
              <td className="px-4 py-3">{variant.standard}</td>
            </tr>
            <tr>
              <td className="w-48 px-4 py-3 text-zinc-500">Category</td>
              <td className="px-4 py-3">{variant.category}</td>
            </tr>
            <tr>
              <td className="w-48 px-4 py-3 text-zinc-500">Size</td>
              <td className="px-4 py-3">{variant.size}</td>
            </tr>
            {variant.category === "bolt" ? (
              <>
                <tr>
                  <td className="w-48 px-4 py-3 text-zinc-500">Length</td>
                  <td className="px-4 py-3">{variant.length_mm} mm</td>
                </tr>
                <tr>
                  <td className="w-48 px-4 py-3 text-zinc-500">Strength class</td>
                  <td className="px-4 py-3">{variant.strength_class ?? "8.8"}</td>
                </tr>
              </>
            ) : null}
            <tr>
              <td className="w-48 px-4 py-3 text-zinc-500">Finish</td>
              <td className="px-4 py-3">{variant.finish}</td>
            </tr>
            <tr>
              <td className="w-48 px-4 py-3 text-zinc-500">Pack</td>
              <td className="px-4 py-3">{variant.pack_qty}pcs</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Same spec / other pack</div>
          <div className="mt-2 space-y-2">
            {links.siblingPack ? (
              <Link href={links.siblingPack.url} className="block underline underline-offset-4">
                {links.siblingPack.title}
              </Link>
            ) : (
              <div className="text-zinc-600 dark:text-zinc-300">None.</div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Related (same size)</div>
          <div className="mt-2 space-y-2">
            <Link
              href={links.hubs.sizeHubUrl}
              className="block underline underline-offset-4"
            >
              Spec hub: {variant.category} {variant.size}
            </Link>
            {links.matchingNut ? (
              <Link href={links.matchingNut.url} className="block underline underline-offset-4">
                {links.matchingNut.title}
              </Link>
            ) : null}
            {links.matchingWasher ? (
              <Link href={links.matchingWasher.url} className="block underline underline-offset-4">
                {links.matchingWasher.title}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <div className="h-20" />
      <StickyCta sku={variant.id} />
    </div>
  );
}

