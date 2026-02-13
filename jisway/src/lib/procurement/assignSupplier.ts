import type { ProductCategory, SupplierAssignment } from "@prisma/client";

export type LineKey = { category: ProductCategory; size: string };

export function suggestSupplierIdForLines(input: {
  lines: LineKey[];
  assignments: SupplierAssignment[];
}): string | null {
  const lines = input.lines;
  if (lines.length === 0) return null;

  // Build candidate suppliers by checking coverage line-by-line.
  const supplierIds = Array.from(new Set(input.assignments.map((a) => a.supplierId)));
  if (supplierIds.length === 0) return null;

  type Score = { supplierId: string; score: number; coversAll: boolean };
  const scores: Score[] = [];

  for (const supplierId of supplierIds) {
    const rules = input.assignments.filter((a) => a.supplierId === supplierId);
    let score = 0;
    let coversAll = true;

    for (const line of lines) {
      const sizeRule = rules
        .filter((r) => r.category === line.category && r.size.toUpperCase() === line.size.toUpperCase())
        .sort((a, b) => b.priority - a.priority)[0];
      const catRule = rules
        .filter((r) => r.category === line.category && r.size === "")
        .sort((a, b) => b.priority - a.priority)[0];

      const picked = sizeRule ?? catRule;
      if (!picked) {
        coversAll = false;
        break;
      }
      score += 10; // base per covered line
      score += picked.priority;
      if (picked.size !== "") score += 2; // size-specific bonus
    }

    scores.push({ supplierId, score, coversAll });
  }

  const covering = scores.filter((s) => s.coversAll).sort((a, b) => b.score - a.score);
  if (covering.length === 0) return null;

  // Assign only if the best is strictly better than second best (avoid ambiguous auto-assign).
  if (covering.length >= 2 && covering[0].score === covering[1].score) return null;
  return covering[0].supplierId;
}

