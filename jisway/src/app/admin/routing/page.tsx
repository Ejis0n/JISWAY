import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STRATEGIES = ["CHEAPEST", "FASTEST", "BALANCED", "AVAILABILITY_FIRST"] as const;

export default async function AdminRoutingPage() {
  const cfg =
    (await prisma.routingConfig.findUnique({ where: { id: "default" } })) ??
    (await prisma.routingConfig.create({ data: { id: "default", enabled: false, strategy: "BALANCED" } }));

  const weights = (cfg.weights as any) ?? { cost: 0.5, lead: 0.3, availability: 0.2, match: 0.1 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Routing</h1>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Controls automatic split of ProcurementTasks by supplier on paid orders.
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <form className="grid gap-4 sm:grid-cols-2" action="/api/admin/routing/config" method="post">
          <label className="block text-sm sm:col-span-2">
            <div className="text-xs font-semibold text-zinc-500">Enabled</div>
            <select
              name="enabled"
              defaultValue={cfg.enabled ? "true" : "false"}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          </label>

          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">Default strategy</div>
            <select
              name="strategy"
              defaultValue={cfg.strategy}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {STRATEGIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="text-xs text-zinc-500 sm:col-span-2">Balanced weights (only used for BALANCED)</div>

          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">cost</div>
            <input
              name="w_cost"
              type="number"
              step="0.01"
              defaultValue={weights.cost}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">lead</div>
            <input
              name="w_lead"
              type="number"
              step="0.01"
              defaultValue={weights.lead}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">availability</div>
            <input
              name="w_availability"
              type="number"
              step="0.01"
              defaultValue={weights.availability}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <div className="text-xs font-semibold text-zinc-500">match</div>
            <input
              name="w_match"
              type="number"
              step="0.01"
              defaultValue={weights.match}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            />
          </label>

          <div className="sm:col-span-2">
            <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

