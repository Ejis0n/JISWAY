"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function postEvent(payload: { name: string; path: string; variantId?: string }) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/event", blob);
    return;
  }
  fetch("/api/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function EventBeacon({ variantId }: { variantId?: string }) {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const key = `${pathname}|${variantId ?? ""}`;
    if (last.current === key) return;
    last.current = key;
    postEvent({ name: "PageView", path: pathname, variantId });
  }, [pathname, variantId]);

  return null;
}

