import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, stateless admin sessions.
 *
 * The cookie carries a compact payload and an HMAC-SHA256 signature. It is
 * never used to authorise storefront customers and it never replaces the
 * database check performed at login.
 */

export const ADMIN_SESSION_COOKIE = "zarbia_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

export const ADMIN_ROLES = ["ADMIN", "MANAGER", "READONLY"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  exp: number;
}

type SessionIdentity = Omit<AdminSession, "exp">;

function sessionSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.ADMIN_API_KEY;

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET (or AUTH_SECRET) must be configured to sign admin sessions.",
    );
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

export function createAdminSessionToken(
  identity: SessionIdentity,
  ttlSeconds = ADMIN_SESSION_TTL_SECONDS,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...identity,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(
  token: string | null | undefined,
): AdminSession | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const provided = Buffer.from(signature);
  const target = Buffer.from(expected);

  if (
    provided.length !== target.length ||
    !timingSafeEqual(provided, target)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AdminSession>;

    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      !isAdminRole(parsed.role) ||
      typeof parsed.exp !== "number" ||
      parsed.exp * 1000 <= Date.now()
    ) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function adminSessionCookieOptions(maxAge: number) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const secure =
    process.env.SECURE_COOKIES === "true" ||
    (process.env.NODE_ENV === "production" && appUrl.startsWith("https://"));

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}
