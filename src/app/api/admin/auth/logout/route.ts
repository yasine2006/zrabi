import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/** POST /api/admin/auth/logout — clear the signed admin cookie. */
export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    "",
    adminSessionCookieOptions(0),
  );

  return response;
}
