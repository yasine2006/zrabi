import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/blog — list all posts (admin). */
export async function GET(request: Request) {
  try {
    requireAdminSession(request);
    const posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    return handleApiError(error);
  }
}
