import { SupportFormClient } from "@/components/support/SupportFormClient";

export const metadata = { title: "Support | JISWAY" };

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Open a ticket for damage, loss, customs questions, billing, or other issues. Include evidence when relevant.
        </p>
      </div>
      <SupportFormClient />
    </div>
  );
}

