import { cookies } from "next/headers";
import { prisma } from "../db";
import { ApiError } from "../api/errors";
import { verifyPassword, verifyTotp } from "./crypto";
import {
  ADMIN_ROLES,
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
  type AdminRole,
  type AdminSession,
} from "./session";

/**
 * Admin authentication and authorisation.
 *
 * Login is a two-step check: password (scrypt) then TOTP (RFC 6238). Only
 * ADMIN, MANAGER and READONLY accounts can sign in, and every role must have
 * 2FA enabled. The resulting cookie is an HMAC-signed session.
 */

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

const loginAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function now() {
  return Date.now();
}

function pruneAttempts() {
  for (const [key, record] of loginAttempts) {
    if (record.resetAt <= now()) loginAttempts.delete(key);
  }
}

export function loginAttemptKey(email: string, ip: string): string {
  return `${ip}|${email.trim().toLowerCase()}`;
}

export function assertLoginAllowed(key: string): void {
  pruneAttempts();
  const record = loginAttempts.get(key);

  if (record && record.count >= MAX_FAILED_ATTEMPTS) {
    const minutes = Math.max(
      1,
      Math.ceil((record.resetAt - now()) / 60_000),
    );
    throw new ApiError(
      429,
      `Trop de tentatives. Réessayez dans ${minutes} minute(s).`,
      "TOO_MANY_ATTEMPTS",
    );
  }
}

export function recordLoginFailure(key: string): void {
  const record = loginAttempts.get(key);

  if (!record || record.resetAt <= now()) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now() + ATTEMPT_WINDOW_MS,
    });
    return;
  }

  record.count += 1;
  loginAttempts.set(key, record);
}

export function clearLoginFailures(key: string): void {
  loginAttempts.delete(key);
}

function isAllowedRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

function displayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email
  );
}

export async function authenticateAdmin(input: {
  email: string;
  password: string;
  code?: string;
}): Promise<Omit<AdminSession, "exp">> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
  });

  if (
    !user ||
    !user.isActive ||
    !isAllowedRole(user.role) ||
    !verifyPassword(input.password, user.passwordHash)
  ) {
    throw new ApiError(
      401,
      "Email, mot de passe ou code de vérification invalide.",
      "INVALID_CREDENTIALS",
    );
  }

  if (user.twoFactorEnabled && user.twoFactorSecret) {
    if (!input.code || !verifyTotp(user.twoFactorSecret, input.code)) {
      throw new ApiError(
        401,
        "Email, mot de passe ou code de vérification invalide.",
        "INVALID_CREDENTIALS",
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    userId: user.id,
    email: user.email,
    name: displayName(user),
    role: user.role as AdminRole,
  };
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }

  return null;
}

export function getAdminSessionFromRequest(
  request: Request,
): AdminSession | null {
  return verifyAdminSessionToken(
    readCookie(request, ADMIN_SESSION_COOKIE),
  );
}

export async function getAdminSession(): Promise<AdminSession | null> {
  return verifyAdminSessionToken(
    cookies().get(ADMIN_SESSION_COOKIE)?.value,
  );
}

/** Route guard: a valid, signed session is mandatory. */
export function requireAdminSession(request: Request): AdminSession {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    throw new ApiError(
      401,
      "Admin authentication is required.",
      "UNAUTHORIZED",
    );
  }

  return session;
}

/** Route guard for role-restricted actions. */
export function requireAdminRole(
  request: Request,
  roles: readonly AdminRole[],
): AdminSession {
  const session = requireAdminSession(request);

  if (!roles.includes(session.role)) {
    throw new ApiError(
      403,
      "Your admin role does not allow this action.",
      "FORBIDDEN_ROLE",
    );
  }

  return session;
}

export function canWrite(role: AdminRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
