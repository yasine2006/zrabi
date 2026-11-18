import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/blog/[slug] — single published post. */
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: params.slug, isPublished: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return handleApiError(error);
  }
}
