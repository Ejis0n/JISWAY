import { prisma } from "@/lib/prisma";
import { ShippingAdminClient } from "@/components/admin/ShippingAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const [legacyRates, zones, rules, policies] = await Promise.all([
    prisma.shippingRate.findMany({ orderBy: { band: "asc" } }),
    prisma.shippingZone.findMany({ include: { countries: true }, orderBy: { name: "asc" } }),
    prisma.shippingRule.findMany({ include: { zone: { select: { name: true } } }, orderBy: { updatedAt: "desc" }, take: 1000 }),
    prisma.carrierPolicy.findMany({ include: { zone: { select: { name: true } } }, orderBy: { updatedAt: "desc" } }),
  ]);

  return <ShippingAdminClient zones={zones} rules={rules} policies={policies} legacyRates={legacyRates} />;
}

