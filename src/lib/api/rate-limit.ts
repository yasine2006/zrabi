import { ApiError } from "./errors";

/**
 * Lightweight in-process rate limiter for public POST endpoints.
 *
 * It is intentionally dependency-free: a sliding window is kept in a module
 * level map, which is enough to stop casual spam and accidental double
 * submissions. On a multi-instance deployment (serverless, several containers)
 * replace the map with Redis/Upstash — the call sites stay identical.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_BUCKETS = 10_000;
let lastPrune = Date.now();

function now(): number {
  return Date.now();
}

function prune(): void {
  const timestamp = now();
  if (timestamp - lastPrune < 60_000) return;
  lastPrune = timestamp;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= timestamp) buckets.delete(key);
  }

  // Never let a hostile client grow the map without bound.
  if (buckets.size > MAX_TRACKED_BUCKETS) {
    const overflow = buckets.size - MAX_TRACKED_BUCKETS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= overflow) break;
    }
  }
}

/**
 * Best-effort client identifier. Reverse proxies set `x-forwarded-for`; when
 * it is missing (local dev, direct Node) every caller shares the "unknown"
 * bucket, which is acceptable for a smoke-level limiter.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export interface RateLimitOptions {
  /** Namespace, e.g. "orders" or "newsletter". */
  key: string;
  /** Maximum number of accepted requests per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Consume one slot for the caller or throw a 429 `ApiError`.
 *
 * The caller IP is mixed with the bucket key so two different endpoints never
 * share a counter.
 */
export function enforceRateLimit(
  request: Request,
  options: RateLimitOptions,
): void {
  prune();

  const ip = clientIp(request);
  const bucketKey = `${options.key}:${ip}`;
  const timestamp = now();
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= timestamp) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: timestamp + options.windowMs,
    });
    return;
  }

  if (current.count >= options.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - timestamp) / 1000),
    );

    throw new ApiError(
      429,
      "Too many requests from this address. Please try again later.",
      "RATE_LIMITED",
      { retryAfterSeconds },
    );
  }

  current.count += 1;
  buckets.set(bucketKey, current);
}
