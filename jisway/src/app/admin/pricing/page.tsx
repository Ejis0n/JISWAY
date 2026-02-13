import { prisma } from "@/lib/prisma";
import { PricingAdminClient } from "@/components/admin/PricingAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const fx = await prisma.fxRate.findFirst({ where: { pair: "JPYUSD" }, orderBy: { capturedAt: "desc" } });
  const rules = await prisma.pricingRule.findMany({ orderBy: [{ scope: "asc" }, { updatedAt: "desc" }] });
  return <PricingAdminClient fx={fx} rules={rules} />;
}

