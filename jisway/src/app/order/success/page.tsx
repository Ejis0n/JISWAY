import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Order confirmation.",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id;

  const order = sessionId
    ? await prisma.order.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        include: { items: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Order confirmed</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          No inventory. Items are procured after payment confirmation.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        {order ? (
          <div className="space-y-2">
            <div>
              <span className="text-zinc-500">Order ID:</span> <span className="font-medium">{order.id}</span>
            </div>
            <div>
              <span className="text-zinc-500">Status:</span> <span className="font-medium">{order.status}</span>
            </div>
            <div>
              <span className="text-zinc-500">Total:</span>{" "}
              <span className="font-medium">${(order.totalUsd / 100).toFixed(2)} USD</span>
            </div>
            <div className="pt-2 text-xs text-zinc-500">
              Import duties and taxes are the responsibility of the recipient.
            </div>
          </div>
        ) : (
          <div>
            If you just paid, the order will appear here once the webhook is processed.
          </div>
        )}
      </div>

      <Link className="text-sm underline underline-offset-4" href="/jis">
        Back to catalog
      </Link>
    </div>
  );
}

