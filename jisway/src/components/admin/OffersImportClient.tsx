"use client";

import { useState } from "react";

type ImportReport = {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
};

export function OffersImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/offers/import", { method: "POST", body: fd });
      const j = (await res.json().catch(() => null)) as ImportReport | { error?: string } | null;
      if (!res.ok) throw new Error((j as any)?.error || `Import failed (${res.status})`);
      setReport(j as ImportReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Supplier Offers (CSV)</h1>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Upload CSV to upsert SupplierOffer rows.</div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">CSV file *</div>
            <input
              type="file"
              accept=".csv,text/csv"
              required
              className="mt-2 block w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="text-xs text-zinc-500">
            Columns: supplier_name, category, size, length_mm, strength_class, finish, pack_qty, unit_cost_jpy,
            lead_time_days, availability (optional: variant_id)
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button
            disabled={!file || loading}
            onClick={submit}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Importing…" : "Import"}
          </button>
        </div>
      </div>

      {report ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="font-semibold">Import report</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <div className="text-xs text-zinc-500">Created</div>
              <div className="font-semibold">{report.created}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Updated</div>
              <div className="font-semibold">{report.updated}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Failed</div>
              <div className="font-semibold">{report.failed}</div>
            </div>
          </div>
          {report.errors.length ? (
            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-500">Errors (first {report.errors.length})</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-600 dark:text-zinc-300">
                {report.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>
                    row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

