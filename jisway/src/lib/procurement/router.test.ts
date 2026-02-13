import { describe, it, expect } from "vitest";
import { routeProcurement } from "@/lib/procurement/router";

describe("routeProcurement", () => {
  it("chooses cheapest by estimated cost", () => {
    const res = routeProcurement({
      strategy: "CHEAPEST" as any,
      lines: [
        {
          lineId: "l1",
          spec: {
            variantId: "v1",
            category: "bolt" as any,
            size: "M12",
            length_mm: 50,
            strength_class: "8.8",
            finish: "zinc",
            pack_qty: 20,
          },
          qty_packs: 2,
          candidates: [
            {
              match_quality: "exact",
              match_score: 1,
              matched_by: "variant_id",
              offer: {
                id: "o1",
                supplierId: "s1",
                unitCostJpy: 100,
                minOrderPacks: 1,
                leadTimeDays: 10,
                availability: "unknown",
                updatedAt: new Date(),
              } as any,
            },
            {
              match_quality: "exact",
              match_score: 1,
              matched_by: "variant_id",
              offer: {
                id: "o2",
                supplierId: "s2",
                unitCostJpy: 300,
                minOrderPacks: 1,
                leadTimeDays: 1,
                availability: "in_stock",
                updatedAt: new Date(),
              } as any,
            },
          ],
        },
      ],
    });

    expect(res.decisions[0].chosen_supplier_id).toBe("s1");
    expect(res.bySupplier[0].estimated_cost_jpy).toBe(200);
  });
});

