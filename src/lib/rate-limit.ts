// Lightweight in-memory sliding-window rate limiter.
//
// Worker-safe implementation: do not create timers at module scope. Cloudflare
// Workers only allow timers inside a request context, so stale buckets are
// cleaned opportunistically whenever this function is called.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

const CLEANUP_AFTER_MS = 60 * 60 * 1000;

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  // Opportunistically remove stale entries for this key.
  const bucket = buckets.get(key);
  if (bucket) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) {
      buckets.delete(key);
    }
  }

  const current = buckets.get(key) ?? { timestamps: [] };
  const limited = current.timestamps.length >= maxRequests;

  if (!limited) {
    current.timestamps.push(now);
  }

  buckets.set(key, current);

  // Keep the process-local map bounded without relying on background timers.
  // This is best-effort only; rate limiting is intentionally not distributed.
  if (buckets.size > 5000) {
    const cutoff = now - CLEANUP_AFTER_MS;
    for (const [entryKey, entry] of buckets) {
      entry.timestamps = entry.timestamps.filter((t) => t >= cutoff);
      if (entry.timestamps.length === 0) buckets.delete(entryKey);
    }
  }

  return limited;
}
