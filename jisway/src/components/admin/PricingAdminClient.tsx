"use client";

import type { FxRate, PricingRule } from "@prisma/client";
import { useMemo, useState } from "react";

type PreviewRow = {
  variant_id: string;
  slug: string;
  category: string;
  size: string;
  packType: string;
  current_price_usd_cents: number;
  recommended_price_usd_cents: number;
  pct_change: number;
};

export function PricingAdminClient({ fx, rules }: { fx: FxRate | null; rules: PricingRule[] }) {
  const [jpyPerUsd, setJpyPerUsd] = useState(fx?.rate ? String(fx.rate) : "");
  const [targetMargin, setTargetMargin] = useState("0.55");
  const [minUsd, setMinUsd] = useState("5.00");
  const [maxUsd, setMaxUsd] = useState("500.00");
  const [rounding, setRounding] = useState<"USD_0_00" | "USD_0_99" | "USD_0_49">("USD_0_99");
  const [maxWeekly, setMaxWeekly] = useState("0.15");

  const [category, setCategory] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [limit, setLimit] = useState<string>("200");
  const [allowOverride, setAllowOverride] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [summary, setSummary] = useState<{ count: number; changed: number; max_abs_pct_change: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const rulesSummary = useMemo(() => {
    return rules.map((r) => `${r.scope}${r.category ? `:${r.category}` : ""}${r.size ? `:${r.size}` : ""}`).slice(0, 8);
  }, [rules]);

  async function setFx() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing/fx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jpy_per_usd: Number(jpyPerUsd), source: "manual" }),
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function createGlobalRule() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing/rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope: "global",
          target_gross_margin: Number(targetMargin),
          min_price_usd: Number(minUsd),
          max_price_usd: Number(maxUsd),
          rounding,
          max_weekly_change_pct: Number(maxWeekly),
        }),
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }

  async function delRule(id: string) {
    if (!confirm("Delete rule?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing/rules/${id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }

  async function preview() {
    setLoading(true);
    setError(null);
    setRows(null);
    setSummary(null);
    try {
      const res = await fetch("/api/admin/pricing/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: category || undefined,
          size: size ? size.toUpperCase() : undefined,
          limit: Number(limit) || 200,
          allowOverride,
        }),
      });
      const j = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      setRows(j.rows as PreviewRow[]);
      setSummary({ count: j.count, changed: j.changed, max_abs_pct_change: j.max_abs_pct_change });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    if (!confirm("Apply recommended prices?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: category || undefined,
          size: size ? size.toUpperCase() : undefined,
          limit: Number(limit) || 200,
          allowOverride,
        }),
      });
      const j = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      await preview();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }

  const exportHref = `/api/admin/pricing/preview.csv?category=${encodeURIComponent(
    category,
  )}&size=${encodeURIComponent(size)}&limit=${encodeURIComponent(limit)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Dynamic repricing based on FX + cost basis + margin rules. Rules: {rulesSummary.join(", ") || "none"}.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold">FX rate (JPY per USD)</div>
          <div className="mt-1 text-xs text-zinc-500">Example: 150.25</div>
          <div className="mt-3 flex gap-2">
            <input
              value={jpyPerUsd}
              onChange={(e) => setJpyPerUsd(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
            <button
              disabled={loading || !jpyPerUsd}
              onClick={setFx}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Set
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold">Add global rule</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <div className="text-xs font-semibold text-zinc-500">Target margin</div>
              <input
                value={targetMargin}
                onChange={(e) => setTargetMargin(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <div className="text-xs font-semibold text-zinc-500">Max weekly change pct</div>
              <input
                value={maxWeekly}
                onChange={(e) => setMaxWeekly(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <div className="text-xs font-semibold text-zinc-500">Min price (USD)</div>
              <input
                value={minUsd}
                onChange={(e) => setMinUsd(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <div className="text-xs font-semibold text-zinc-500">Max price (USD)</div>
              <input
                value={maxUsd}
                onChange={(e) => setMaxUsd(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <div className="text-xs font-semibold text-zinc-500">Rounding</div>
              <select
                value={rounding}
                onChange={(e) => setRounding(e.target.value as any)}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <option value="USD_0_99">0.99</option>
                <option value="USD_0_49">0.49</option>
                <option value="USD_0_00">0.00</option>
              </select>
            </label>
          </div>
          <button
            disabled={loading}
            onClick={createGlobalRule}
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Create
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-semibold">Rules</div>
        <div className="mt-3 space-y-2 text-sm">
          {rules.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="font-mono text-xs">
                {r.id} · {r.scope} {r.category ?? ""} {r.size ?? ""} · margin {r.targetGrossMargin} · min{" "}
                {(r.minPriceUsdCents / 100).toFixed(2)} · max {(r.maxPriceUsdCents / 100).toFixed(2)} · {r.rounding} ·
                weekly {r.maxWeeklyChangePct}
              </div>
              <button onClick={() => delRule(r.id)} className="text-xs underline underline-offset-4">
                Delete
              </button>
            </div>
          ))}
          {rules.length === 0 ? <div className="text-zinc-600 dark:text-zinc-300">No rules.</div> : null}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-semibold">Reprice</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Category</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">All</option>
              <option value="bolt">bolt</option>
              <option value="nut">nut</option>
              <option value="washer">washer</option>
            </select>
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Size</div>
            <input
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="M12"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Limit</div>
            <input
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" checked={allowOverride} onChange={(e) => setAllowOverride(e.target.checked)} />
            <span className="text-xs text-zinc-600 dark:text-zinc-300">Allow override (no weekly clamp)</span>
          </label>
          <div className="flex items-end gap-2">
            <button
              disabled={loading}
              onClick={preview}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              Preview
            </button>
            <button
              disabled={loading}
              onClick={apply}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Apply
            </button>
            <a
              href={exportHref}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              CSV
            </a>
          </div>
        </div>

        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        {summary ? (
          <div className="mt-3 text-xs text-zinc-500">
            count={summary.count} changed={summary.changed} max_abs_pct_change={summary.max_abs_pct_change.toFixed(4)}
          </div>
        ) : null}

        {rows ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Spec</th>
                  <th className="px-3 py-2">Current</th>
                  <th className="px-3 py-2">Recommended</th>
                  <th className="px-3 py-2">Δ%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((r) => (
                  <tr key={r.variant_id}>
                    <td className="px-3 py-2 font-mono text-xs">{r.slug}</td>
                    <td className="px-3 py-2 text-xs">
                      {r.category} {r.size} {r.packType}
                    </td>
                    <td className="px-3 py-2">${(r.current_price_usd_cents / 100).toFixed(2)}</td>
                    <td className="px-3 py-2 font-semibold">${(r.recommended_price_usd_cents / 100).toFixed(2)}</td>
                    <td className="px-3 py-2">{(r.pct_change * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

