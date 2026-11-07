import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  adminSessionCookieOptions,
  createAdminSessionToken,
} from "@/lib/admin/session";
import {
  assertLoginAllowed,
  authenticateAdmin,
  clearLoginFailures,
  loginAttemptKey,
  recordLoginFailure,
} from "@/lib/admin/auth";
import { adminLoginSchema } from "@/lib/api/schemas";
import { handleApiError, readJson } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local";

  return ip;
}

/**
 * POST /api/admin/auth/login
 *
 * Two factors are mandatory: the scrypt password and a six-digit RFC 6238
 * TOTP code. Only ADMIN, MANAGER and READONLY accounts may sign in. The
 * resulting HttpOnly cookie is HMAC-signed and expires after eight hours.
 */
export async function POST(request: Request) {
  try {
    const input = adminLoginSchema.parse(await readJson(request));
    const key = loginAttemptKey(input.email, clientIp(request));

    assertLoginAllowed(key);

    let session;

    try {
      session = await authenticateAdmin(input);
    } catch (error) {
      recordLoginFailure(key);
      throw error;
    }

    clearLoginFailures(key);

    const token = createAdminSessionToken(session);
    const response = NextResponse.json({ session });

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      adminSessionCookieOptions(ADMIN_SESSION_TTL_SECONDS),
    );

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
