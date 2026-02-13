"use client";

import type {
  CarrierPolicy,
  CarrierPolicyType,
  ShippingCarrier,
  ShippingRule,
  ShippingRuleBand,
  ShippingZone,
  ShippingZoneCountry,
  ShippingRate,
} from "@prisma/client";
import { useMemo, useState } from "react";

type ZoneRow = ShippingZone & { countries: ShippingZoneCountry[] };
type RuleRow = ShippingRule & { zone?: { name: string } };
type PolicyRow = CarrierPolicy & { zone?: { name: string } };

function usdStrFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

function ZoneCard({
  z,
  loading,
  onSave,
}: {
  z: ZoneRow;
  loading: boolean;
  onSave: (countriesText: string, isActive: boolean) => Promise<void>;
}) {
  const [countriesText, setCountriesText] = useState(z.countries.map((c) => c.code).sort().join(", "));
  const [active, setActive] = useState(z.isActive);
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold">{z.name}</div>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <input
          value={countriesText}
          onChange={(e) => setCountriesText(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 md:col-span-3"
        />
        <button
          disabled={loading}
          onClick={() => onSave(countriesText, active)}
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function PolicyCard({
  zone,
  policyRow,
  loading,
  onSave,
}: {
  zone: ZoneRow;
  policyRow: PolicyRow | undefined;
  loading: boolean;
  onSave: (input: {
    policy: CarrierPolicyType;
    defaultCarrier: ShippingCarrier;
    forceDhlOverWeightKg: string;
    forceDhlOverSubtotalUsd: string;
  }) => Promise<void>;
}) {
  const policy = (policyRow?.policy ?? "DEFAULT") as CarrierPolicyType;
  const defaultCarrier = (policyRow?.defaultCarrier ?? "JP_POST") as ShippingCarrier;
  const w = policyRow?.forceDhlOverWeightKg ?? null;
  const s = policyRow?.forceDhlOverSubtotalUsdCents != null ? usdStrFromCents(policyRow.forceDhlOverSubtotalUsdCents) : "";

  const [policyState, setPolicyState] = useState<CarrierPolicyType>(policy);
  const [defaultCarrierState, setDefaultCarrierState] = useState<ShippingCarrier>(defaultCarrier);
  const [weightState, setWeightState] = useState(w != null ? String(w) : "");
  const [subtotalState, setSubtotalState] = useState(s);

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-sm font-semibold">{zone.name}</div>
      <div className="mt-3 grid gap-3 md:grid-cols-6">
        <select
          value={policyState}
          onChange={(e) => setPolicyState(e.target.value as CarrierPolicyType)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="DEFAULT">DEFAULT</option>
          <option value="CHEAPEST">CHEAPEST</option>
          <option value="FASTEST">FASTEST</option>
        </select>
        <select
          value={defaultCarrierState}
          onChange={(e) => setDefaultCarrierState(e.target.value as ShippingCarrier)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="JP_POST">JP_POST</option>
          <option value="DHL">DHL</option>
        </select>
        <input
          value={weightState}
          onChange={(e) => setWeightState(e.target.value)}
          placeholder="Force DHL over kg (optional)"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 md:col-span-2"
        />
        <input
          value={subtotalState}
          onChange={(e) => setSubtotalState(e.target.value)}
          placeholder="Force DHL over subtotal USD (optional)"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        />
        <button
          disabled={loading}
          onClick={() =>
            onSave({
              policy: policyState,
              defaultCarrier: defaultCarrierState,
              forceDhlOverWeightKg: weightState,
              forceDhlOverSubtotalUsd: subtotalState,
            })
          }
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function ShippingAdminClient({
  zones,
  rules,
  policies,
  legacyRates,
}: {
  zones: ZoneRow[];
  rules: RuleRow[];
  policies: PolicyRow[];
  legacyRates: ShippingRate[];
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Zone editor
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneCountries, setNewZoneCountries] = useState("");

  // Rule editor
  const zoneOptions = useMemo(() => zones.map((z) => ({ id: z.id, name: z.name })), [zones]);
  const [ruleZoneId, setRuleZoneId] = useState(zoneOptions[0]?.id ?? "");
  const [ruleBand, setRuleBand] = useState<ShippingRuleBand>("BAND_A_10PCS");
  const [ruleCarrier, setRuleCarrier] = useState<ShippingCarrier>("JP_POST");
  const [rulePriceUsd, setRulePriceUsd] = useState("18.00");
  const [ruleEtaMin, setRuleEtaMin] = useState("8");
  const [ruleEtaMax, setRuleEtaMax] = useState("14");
  const [ruleTracking, setRuleTracking] = useState(true);
  const [ruleNotes, setRuleNotes] = useState("");
  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState<any>(null);

  // Preview tool
  const [prevCountry, setPrevCountry] = useState("US");
  const [prevBands, setPrevBands] = useState<Record<ShippingRuleBand, boolean>>({
    BAND_A_10PCS: true,
    BAND_B_20PCS: false,
    BAND_C_BULK: false,
  });
  const [prevSubtotal, setPrevSubtotal] = useState("120.00");
  const [prevWeightKg, setPrevWeightKg] = useState("0.6");
  const [prevOut, setPrevOut] = useState<any>(null);

  async function api<T>(path: string, init: RequestInit) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(path, init);
      const j = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      return j as T;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function createZone() {
    const codes = newZoneCountries
      .split(/[,\s]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toUpperCase());
    await api("/api/admin/shipping/zones", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newZoneName.trim(), is_active: true, countries: codes }),
    });
    location.reload();
  }

  async function saveZone(z: ZoneRow, countriesText: string, isActive: boolean) {
    const codes = countriesText
      .split(/[,\s]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toUpperCase());
    await api(`/api/admin/shipping/zones/${z.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: z.name, is_active: isActive, countries: codes }),
    });
    location.reload();
  }

  async function upsertRule() {
    await api("/api/admin/shipping/rules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        zone_id: ruleZoneId,
        band: ruleBand,
        carrier: ruleCarrier,
        price_usd: Number(rulePriceUsd),
        eta_min_days: Number(ruleEtaMin),
        eta_max_days: Number(ruleEtaMax),
        tracking_included: ruleTracking,
        notes: ruleNotes || undefined,
      }),
    });
    location.reload();
  }

  async function importCsv() {
    const j = await api("/api/admin/shipping/rules/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv: csvText }),
    });
    setCsvResult(j);
  }

  async function upsertPolicy(zoneId: string, input: Partial<{
    policy: CarrierPolicyType;
    defaultCarrier: ShippingCarrier;
    forceDhlOverWeightKg: number | null;
    forceDhlOverSubtotalUsd: number | null;
  }>) {
    await api("/api/admin/shipping/policies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        zone_id: zoneId,
        policy: input.policy,
        default_carrier: input.defaultCarrier,
        force_dhl_over_weight_kg: input.forceDhlOverWeightKg,
        force_dhl_over_subtotal_usd: input.forceDhlOverSubtotalUsd,
      }),
    });
    location.reload();
  }

  async function runPreview() {
    const bands = (Object.keys(prevBands) as ShippingRuleBand[]).filter((b) => prevBands[b]);
    const j = await api("/api/admin/shipping/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        country_code: prevCountry.toUpperCase(),
        bands,
        subtotal_usd: Number(prevSubtotal),
        weight_kg: Number(prevWeightKg),
      }),
    });
    setPrevOut(j);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shipping (v1)</h1>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Rule-table shipping (country zones + carrier selection + ETA). No real-time rate APIs.
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Zones</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            placeholder='Name (e.g. "ASEAN")'
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
          <input
            value={newZoneCountries}
            onChange={(e) => setNewZoneCountries(e.target.value)}
            placeholder="Countries (CSV): VN, TH, ID"
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 md:col-span-2"
          />
          <button
            disabled={loading || !newZoneName.trim()}
            onClick={createZone}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            Add zone
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {zones.map((z) => (
            <ZoneCard key={z.id} z={z} loading={loading} onSave={(countriesText, isActive) => saveZone(z, countriesText, isActive)} />
          ))}
          {zones.length === 0 ? <div className="text-sm text-zinc-600">No zones.</div> : null}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Rules</h2>
        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Export:{" "}
          <a className="underline underline-offset-4" href="/api/admin/shipping/rules/export.csv">
            shipping_rules.csv
          </a>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-6">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV here (with headers)."
            className="min-h-[96px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950 md:col-span-5"
          />
          <button
            disabled={loading || !csvText.trim()}
            onClick={importCsv}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Import CSV
          </button>
        </div>
        {csvResult ? (
          <pre className="mt-3 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
            {JSON.stringify(csvResult, null, 2)}
          </pre>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <select
            value={ruleZoneId}
            onChange={(e) => setRuleZoneId(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 md:col-span-2"
          >
            {zoneOptions.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <select
            value={ruleBand}
            onChange={(e) => setRuleBand(e.target.value as ShippingRuleBand)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="BAND_A_10PCS">BAND_A_10PCS</option>
            <option value="BAND_B_20PCS">BAND_B_20PCS</option>
            <option value="BAND_C_BULK">BAND_C_BULK</option>
          </select>
          <select
            value={ruleCarrier}
            onChange={(e) => setRuleCarrier(e.target.value as ShippingCarrier)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="JP_POST">JP_POST</option>
            <option value="DHL">DHL</option>
          </select>
          <input
            value={rulePriceUsd}
            onChange={(e) => setRulePriceUsd(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Price USD"
          />
          <div className="flex gap-2">
            <input
              value={ruleEtaMin}
              onChange={(e) => setRuleEtaMin(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="ETA min"
            />
            <input
              value={ruleEtaMax}
              onChange={(e) => setRuleEtaMax(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="ETA max"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input type="checkbox" checked={ruleTracking} onChange={(e) => setRuleTracking(e.target.checked)} />
            Tracking included
          </label>
          <input
            value={ruleNotes}
            onChange={(e) => setRuleNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="min-w-[18rem] flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          />
          <button
            disabled={loading || !ruleZoneId}
            onClick={upsertRule}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            Upsert rule
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-3 py-2">Zone</th>
                <th className="px-3 py-2">Band</th>
                <th className="px-3 py-2">Carrier</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">ETA</th>
                <th className="px-3 py-2">Tracking</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">{r.zone?.name ?? ""}</td>
                  <td className="px-3 py-2">{r.band}</td>
                  <td className="px-3 py-2">{r.carrier}</td>
                  <td className="px-3 py-2">${usdStrFromCents(r.priceUsdCents)}</td>
                  <td className="px-3 py-2">
                    {r.etaMinDays}-{r.etaMaxDays}d
                  </td>
                  <td className="px-3 py-2">{r.trackingIncluded ? "yes" : "no"}</td>
                  <td className="px-3 py-2">{r.notes ?? ""}</td>
                </tr>
              ))}
              {rules.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-sm text-zinc-600" colSpan={7}>
                    No rules.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Carrier Policies</h2>
        <div className="mt-3 space-y-3">
          {zones.map((z) => (
            <PolicyCard
              key={z.id}
              zone={z}
              policyRow={policies.find((x) => x.zoneId === z.id)}
              loading={loading}
              onSave={async (input) => {
                await upsertPolicy(z.id, {
                  policy: input.policy,
                  defaultCarrier: input.defaultCarrier,
                  forceDhlOverWeightKg: input.forceDhlOverWeightKg ? Number(input.forceDhlOverWeightKg) : null,
                  forceDhlOverSubtotalUsd: input.forceDhlOverSubtotalUsd ? Number(input.forceDhlOverSubtotalUsd) : null,
                });
              }}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Preview shipping</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-6">
          <input
            value={prevCountry}
            onChange={(e) => setPrevCountry(e.target.value.toUpperCase().slice(0, 2))}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="US"
          />
          <input
            value={prevSubtotal}
            onChange={(e) => setPrevSubtotal(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Subtotal USD"
          />
          <input
            value={prevWeightKg}
            onChange={(e) => setPrevWeightKg(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Weight kg"
          />
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            {(Object.keys(prevBands) as ShippingRuleBand[]).map((b) => (
              <label key={b} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prevBands[b]}
                  onChange={(e) => setPrevBands({ ...prevBands, [b]: e.target.checked })}
                />
                {b}
              </label>
            ))}
          </div>
          <button
            disabled={loading}
            onClick={runPreview}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            Preview
          </button>
        </div>

        {prevOut ? (
          <pre className="mt-4 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
            {JSON.stringify(prevOut, null, 2)}
          </pre>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Legacy flat shipping (v0)</h2>
        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Kept for backwards compatibility. v1 checkout uses zone rules.
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Band</th>
                <th className="px-4 py-3">Amount (USD)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {legacyRates.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.band}</td>
                  <td className="px-4 py-3">${usdStrFromCents(r.amountUsd)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={`/api/admin/shipping/${r.id}`} method="post" className="flex items-center justify-end gap-2">
                      <label className="text-sm">
                        <span className="sr-only">Amount</span>
                        <input
                          name="amount_usd"
                          defaultValue={usdStrFromCents(r.amountUsd)}
                          className="w-28 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </label>
                      <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {legacyRates.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={3}>
                    No legacy shipping rates.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

