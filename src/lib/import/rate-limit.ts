const buckets = new Map<string, { count: number; resetAt: number }>();

/** In-memory rate limit for dev/single-instance. Use Redis for multi-instance prod. */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { ok: true };
}
