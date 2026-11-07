import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { requireAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function escapeCsv(value: string): string {
  const normalized = value.replace(/"/g, '""');
  return /[",;\n\r]/.test(normalized) ? `"${normalized}"` : normalized;
}

/**
 * GET /api/admin/newsletter
 *
 * Without `format` it returns the latest subscribers and the active count.
 * With `format=csv` it streams a UTF-8 CSV (BOM included so Excel renders
 * Arabic and accented characters correctly).
 */
export async function GET(request: Request) {
  try {
    requireAdminSession(request);

    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit")) || 200, 1),
      1000,
    );

    if (format === "csv") {
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          email: true,
          locale: true,
          source: true,
          createdAt: true,
        },
      });

      const header = "email,locale,source,subscribed_at\n";
      const rows = subscribers
        .map((subscriber) =>
          [
            escapeCsv(subscriber.email),
            escapeCsv(subscriber.locale),
            escapeCsv(subscriber.source),
            subscriber.createdAt.toISOString(),
          ].join(","),
        )
        .join("\n");

      return new NextResponse(`\uFEFF${header}${rows}`, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="zarbia-newsletter-${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
          "cache-control": "no-store",
        },
      });
    }

    const [total, subscribers] = await Promise.all([
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      prisma.newsletterSubscriber.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          email: true,
          locale: true,
          source: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ total, subscribers });
  } catch (error) {
    return handleApiError(error);
  }
}
