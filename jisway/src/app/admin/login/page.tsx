"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function AdminLoginPage() {
  const from = "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: from,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }
    window.location.assign(res?.url || from);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin login</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Credentials provider (dev user seeded by `prisma db seed`).
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            disabled={loading || !email || !password}
            onClick={onSubmit}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

