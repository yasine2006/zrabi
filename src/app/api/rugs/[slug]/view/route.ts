import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/rugs/[slug]/view
 *
 * Public, fire-and-forget page-view counter. The product page posts once per
 * browser session per rug; the database increment itself is atomic.
 */
export async function POST(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const updated = await prisma.rug.update({
      where: { slug: params.slug },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ viewCount: updated.viewCount });
  } catch (error) {
    return handleApiError(error);
  }
}
