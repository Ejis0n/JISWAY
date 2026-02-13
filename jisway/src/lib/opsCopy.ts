export function getSupportEmail() {
  return (
    process.env.SUPPORT_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    ""
  );
}

export function buildOrderOpsFooterLines() {
  const support = getSupportEmail();
  return [
    "**Operational notes**",
    "- No inventory: procurement begins after payment confirmation.",
    "- Exact JIS specification only. No substitutes.",
    "- Duties/taxes are the responsibility of the recipient. Customs delays are not refundable.",
    "- Claims windows: damage/wrong item within 7 days of delivery with photos; non-delivery after 14 business days past ETA.",
    support ? `- Support: ${support}` : "- Support: (contact email not configured)",
  ];
}

