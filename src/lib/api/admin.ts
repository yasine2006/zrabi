import { timingSafeEqual } from "node:crypto";
import { getAdminSessionFromRequest } from "../admin/auth";
import type { AdminRole } from "../admin/session";
import { ApiError } from "./errors";

/**
 * Guard for admin-only endpoints.
 *
 * Two callers are accepted:
 *  - a signed admin session cookie (ADMIN / MANAGER / READONLY), created by
 *    `/api/admin/auth/login` after password + TOTP verification;
 *  - a machine client presenting `Authorization: Bearer <ADMIN_API_KEY>` or
 *    `x-admin-key: <ADMIN_API_KEY>`.
 *
 * Every comparison is constant-time, and the API fails closed when neither
 * mechanism is configured.
 */

export interface AdminPrincipal {
  userId: string | null;
  email: string | null;
  name: string | null;
  role: AdminRole;
  via: "session" | "api-key";
}

export interface RequireAdminOptions {
  /** Reject READONLY sessions for mutations. */
  write?: boolean;
  /** Restrict the action to specific roles (the API key is always ADMIN). */
  roles?: readonly AdminRole[];
}

function safeEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");

  return a.length === b.length && timingSafeEqual(a, b);
}

function canWrite(role: AdminRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

function assertAllowed(
  role: AdminRole,
  options: RequireAdminOptions,
): void {
  if (options.roles && !options.roles.includes(role)) {
    throw new ApiError(
      403,
      "Your admin role does not allow this action.",
      "FORBIDDEN_ROLE",
    );
  }

  if (options.write && !canWrite(role)) {
    throw new ApiError(
      403,
      "This account is read-only.",
      "READ_ONLY_ROLE",
    );
  }
}

export function requireAdmin(
  request: Request,
  options: RequireAdminOptions = {},
): AdminPrincipal {
  const session = getAdminSessionFromRequest(request);

  if (session) {
    assertAllowed(session.role, options);

    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      via: "session",
    };
  }

  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    throw new ApiError(
      503,
      "The admin API is not configured. Set ADMIN_API_KEY on the server.",
      "ADMIN_API_DISABLED",
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const provided = bearer || request.headers.get("x-admin-key")?.trim() || "";

  if (!provided) {
    throw new ApiError(
      401,
      "Admin authentication is required.",
      "UNAUTHORIZED",
    );
  }

  if (!safeEqual(provided, expected)) {
    throw new ApiError(403, "Invalid admin credentials.", "FORBIDDEN");
  }

  assertAllowed("ADMIN", options);

  return {
    userId: null,
    email: null,
    name: "API key",
    role: "ADMIN",
    via: "api-key",
  };
}
