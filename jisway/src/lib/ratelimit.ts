type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  jiswayBuckets?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.jiswayBuckets ?? new Map<string, Bucket>();
if (!globalForRateLimit.jiswayBuckets) globalForRateLimit.jiswayBuckets = buckets;

export function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const b = buckets.get(input.key);
  if (!b || now >= b.resetAt) {
    const resetAt = now + input.windowMs;
    buckets.set(input.key, { count: 1, resetAt });
    return { ok: true as const, remaining: input.limit - 1, resetAt };
  }

  if (b.count >= input.limit) {
    return { ok: false as const, remaining: 0, resetAt: b.resetAt };
  }

  b.count += 1;
  buckets.set(input.key, b);
  return { ok: true as const, remaining: input.limit - b.count, resetAt: b.resetAt };
}

export function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (!xf) return "unknown";
  return xf.split(",")[0].trim() || "unknown";
}

