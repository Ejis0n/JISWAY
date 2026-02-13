import { describe, it, expect } from "vitest";
import { matchSupplierOffers } from "@/lib/procurement/match";

describe("matchSupplierOffers", () => {
  it("prefers exact variantId match", () => {
    const line = {
      variantId: "v1",
      category: "bolt" as const,
      size: "M12",
      length_mm: 50,
      strength_class: "8.8",
      finish: "zinc",
      pack_qty: 20,
    };

    const offers: any[] = [
      {
        id: "o1",
        supplierId: "s1",
        variantId: null,
        category: "bolt",
        size: "M12",
        lengthMm: 50,
        finish: "zinc",
        strengthClass: "8.8",
        packQty: 20,
        unitCostJpy: 100,
        minOrderPacks: 1,
        leadTimeDays: 5,
        availability: "unknown",
        updatedAt: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
      },
      {
        id: "o2",
        supplierId: "s2",
        variantId: "v1",
        category: null,
        size: null,
        lengthMm: null,
        finish: null,
        strengthClass: null,
        packQty: 20,
        unitCostJpy: 120,
        minOrderPacks: 1,
        leadTimeDays: 3,
        availability: "in_stock",
        updatedAt: new Date("2026-01-02"),
        createdAt: new Date("2026-01-02"),
      },
    ];

    const matched = matchSupplierOffers({ line, offers: offers as any });
    expect(matched[0].offer.id).toBe("o2");
    expect(matched[0].match_quality).toBe("exact");
  });
});

