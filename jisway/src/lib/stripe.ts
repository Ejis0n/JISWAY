import Stripe from "stripe";

let memo: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  if (memo) return memo;
  memo = new Stripe(key, {
    apiVersion: "2026-01-28.clover",
  });
  return memo;
}

