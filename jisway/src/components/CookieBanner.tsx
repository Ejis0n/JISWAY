"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "jisway_cookie_consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) setShow(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 sm:left-4 sm:right-auto sm:bottom-4 sm:max-w-md sm:rounded-lg sm:border"
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        We use cookies and similar technologies for analytics and to improve the site. By continuing you accept this. See{" "}
        <Link href="/policies/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={accept}
        className="mt-3 w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 sm:w-auto"
      >
        Accept
      </button>
    </div>
  );
}
