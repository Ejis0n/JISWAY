import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  let dbOk: unknown = false;
  let lastWebhook: { receivedAt: Date } | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    lastWebhook = await prisma.stripeEvent.findFirst({
      orderBy: { receivedAt: "desc" },
    });
  } catch {
    dbOk = false;
  }
  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Health</h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-zinc-500">DB connectivity</div>
            <div className="mt-1 font-medium">{dbOk ? "ok" : "error"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">Stripe key present</div>
            <div className="mt-1 font-medium">{hasStripeKey ? "true" : "false"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">Stripe webhook secret present</div>
            <div className="mt-1 font-medium">{hasWebhookSecret ? "true" : "false"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500">Last webhook received</div>
            <div className="mt-1 font-medium">
              {lastWebhook ? lastWebhook.receivedAt.toISOString() : "none"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

