// Lightweight in-memory sliding-window rate limiter.
// NOTE: Process-local — state is held in Node.js process memory.
// On serverless platforms (e.g. Netlify / AWS Lambda), this provides best-effort
// rate-limiting within each active container instance; memory does not persist across
// cold starts or concurrent container scales. For distributed enforcement across
// all lambda instances, a shared store (Redis/Upstash) can be introduced if needed.

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
