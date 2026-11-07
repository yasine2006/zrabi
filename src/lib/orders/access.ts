import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless access tokens for the read-only order page.
 *
 * `/order/[id]` exposes the customer's name, phone, address and e-mail. The
 * order id alone (a cuid) is hard to guess, but order links get forwarded,
 * screenshotted and pasted into chats. Every link we hand out therefore
 * carries a short HMAC signature derived from the order id and its creation
 * timestamp, and the page refuses to render the personal data without it.
 *
 * The token is stateless on purpose: it survives restarts and needs no schema
 * change. Rotating the secret invalidates previously shared links, which is
 * the correct behaviour after a leak.
 */

const FALLBACK_SECRET = "zarbia-order-access-development-secret";

function secret(): string {
  return (
    process.env.ORDER_ACCESS_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    FALLBACK_SECRET
  );
}

function createdAtIso(order: { createdAt: Date | string }): string {
  return typeof order.createdAt === "string"
    ? order.createdAt
    : order.createdAt.toISOString();
}

/** Deterministic token for a persisted order. */
export function orderAccessToken(order: {
  id: string;
  createdAt: Date | string;
}): string {
  return createHmac("sha256", secret())
    .update(`${order.id}:${createdAtIso(order)}`)
    .digest("base64url")
    .slice(0, 32);
}

/** Constant-time comparison; returns false for any malformed input. */
export function verifyOrderAccessToken(
  order: { id: string; createdAt: Date | string },
  token: string | null | undefined,
): boolean {
  if (!token || token.length > 128) return false;

  const expected = Buffer.from(orderAccessToken(order));
  const provided = Buffer.from(token);

  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
}

/** Append the access token to an internal `/order/[id]` URL. */
export function appendOrderToken(
  url: string,
  order: { id: string; createdAt: Date | string },
): string {
  const token = orderAccessToken(order);
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
