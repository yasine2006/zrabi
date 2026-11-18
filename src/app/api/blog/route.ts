import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const blogCreateSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  titleFr: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().min(1).max(200),
  titleAr: z.string().trim().max(200).optional(),
  excerptFr: z.string().trim().min(1).max(500),
  excerptEn: z.string().trim().min(1).max(500),
  excerptAr: z.string().trim().max(500).optional(),
  contentFr: z.string().trim().min(1).max(50000),
  contentEn: z.string().trim().min(1).max(50000),
  contentAr: z.string().trim().max(50000).optional(),
  category: z.string().trim().max(60).default("guide"),
  coverImage: z.string().trim().min(1).max(2048),
  readingMinutes: z.number().int().min(1).max(60).default(5),
  isPublished: z.boolean().default(true),
});

/** GET /api/blog — list published posts (paginated). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit")) || 20, 1),
      100,
    );

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where: { isPublished: true } }),
    ]);

    return NextResponse.json({ posts, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/admin/blog — create a post (admin only). */
export async function POST(request: Request) {
  try {
    requireAdminSession(request);
    enforceRateLimit(request, {
      key: "admin:blog:create",
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });

    const input = blogCreateSchema.parse(await readJson(request));

    const created = await prisma.blogPost.create({
      data: {
        slug: input.slug,
        titleFr: input.titleFr,
        titleEn: input.titleEn,
        titleAr: input.titleAr ?? null,
        excerptFr: input.excerptFr,
        excerptEn: input.excerptEn,
        excerptAr: input.excerptAr ?? null,
        contentFr: input.contentFr,
        contentEn: input.contentEn,
        contentAr: input.contentAr ?? null,
        category: input.category,
        coverImage: input.coverImage,
        readingMinutes: input.readingMinutes,
        isPublished: input.isPublished,
      },
    });

    return NextResponse.json({ post: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
