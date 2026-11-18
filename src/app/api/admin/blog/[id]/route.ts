import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const blogUpdateSchema = z.object({
  titleFr: z.string().trim().min(1).max(200).optional(),
  titleEn: z.string().trim().min(1).max(200).optional(),
  titleAr: z.string().trim().max(200).nullable().optional(),
  excerptFr: z.string().trim().min(1).max(500).optional(),
  excerptEn: z.string().trim().min(1).max(500).optional(),
  excerptAr: z.string().trim().max(500).nullable().optional(),
  contentFr: z.string().trim().min(1).max(50000).optional(),
  contentEn: z.string().trim().min(1).max(50000).optional(),
  contentAr: z.string().trim().max(50000).nullable().optional(),
  category: z.string().trim().max(60).optional(),
  coverImage: z.string().trim().min(1).max(2048).optional(),
  readingMinutes: z.number().int().min(1).max(60).optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
});

/** GET /api/admin/blog/[id] — single post. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireAdminSession(_request);
    const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!post) throw new ApiError(404, "Post not found.", "NOT_FOUND");
    return NextResponse.json({ post });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT /api/admin/blog/[id] — update. */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireAdminSession(request);
    const input = blogUpdateSchema.parse(await readJson(request));
    const updated = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        ...input,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
      },
    });
    return NextResponse.json({ post: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/admin/blog/[id] — delete. */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireAdminSession(request);
    await prisma.blogPost.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
