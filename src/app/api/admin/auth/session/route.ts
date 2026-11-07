import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin/auth";
import { apiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/** GET /api/admin/auth/session — current signed-in administrator. */
export async function GET(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return apiError(401, "Admin authentication is required.", "UNAUTHORIZED");
  }

  return NextResponse.json({
    session: {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      exp: session.exp,
    },
  });
}
