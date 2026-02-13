import { prisma } from "@/lib/prisma";
import type { ShippingZone } from "@prisma/client";

export type ShippingZoneWithCountries = ShippingZone & {
  countries: Array<{ code: string }>;
};

export function normalizeCountryCode(code: string) {
  return code.trim().toUpperCase();
}

export function resolveZoneFromList(input: {
  countryCode: string;
  zones: ShippingZoneWithCountries[];
  fallbackZoneName?: string;
}): ShippingZoneWithCountries | null {
  const cc = normalizeCountryCode(input.countryCode);
  const zones = input.zones.filter((z) => z.isActive);

  const direct = zones.find((z) => z.countries.some((c) => normalizeCountryCode(c.code) === cc));
  if (direct) return direct;

  const fallbackName = input.fallbackZoneName ?? "Other";
  const fallback = zones.find((z) => z.name === fallbackName);
  return fallback ?? null;
}

export async function loadActiveZonesWithCountries(): Promise<ShippingZoneWithCountries[]> {
  return prisma.shippingZone.findMany({
    where: { isActive: true },
    include: { countries: { select: { code: true } } },
    orderBy: { name: "asc" },
  });
}

export async function resolveZone(countryCode: string): Promise<ShippingZoneWithCountries> {
  const cc = normalizeCountryCode(countryCode);

  const direct = await prisma.shippingZone.findFirst({
    where: { isActive: true, countries: { some: { code: cc } } },
    include: { countries: { select: { code: true } } },
  });
  if (direct) return direct;

  const other = await prisma.shippingZone.findFirst({
    where: { isActive: true, name: "Other" },
    include: { countries: { select: { code: true } } },
  });
  if (other) return other;

  // As a last resort, create an in-memory fallback to keep checkout functional.
  return {
    id: "fallback_other",
    name: "Other",
    isActive: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    countries: [],
  };
}

