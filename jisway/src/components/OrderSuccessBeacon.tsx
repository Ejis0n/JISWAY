"use client";

import { useEffect } from "react";

export function OrderSuccessBeacon({ hasOrder }: { hasOrder: boolean }) {
  useEffect(() => {
    if (!hasOrder || typeof window === "undefined" || !("gtag" in window)) return;
    (window as unknown as { gtag: (a: string, b: string, c?: object) => void }).gtag("event", "purchase");
  }, [hasOrder]);
  return null;
}
