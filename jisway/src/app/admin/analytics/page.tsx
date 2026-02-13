import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Row = { day: string; name: string; count: number };

export default async function AdminAnalyticsPage() {
  const rows = (await prisma.$queryRaw`
    SELECT
      to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') as day,
      "name"::text as name,
      COUNT(*)::int as count
    FROM "AnalyticsEvent"
    GROUP BY 1, 2
    ORDER BY 1 DESC, 2 ASC
    LIMIT 500
  `) as Row[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r, idx) => (
              <tr key={`${r.day}-${r.name}-${idx}`}>
                <td className="px-4 py-3">{r.day}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.count}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300" colSpan={3}>
                  No events.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

