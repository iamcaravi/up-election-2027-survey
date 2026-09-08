// Lightweight in-memory sliding-window rate limiter.
// NOTE: process-local — fine for a single Node instance / demo deployment.
// For multi-instance production, back this with Redis or a DB table instead.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  const limited = bucket.timestamps.length >= maxRequests;
  if (!limited) bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return limited;
}

// periodic cleanup so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 60 * 60 * 1000);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();
