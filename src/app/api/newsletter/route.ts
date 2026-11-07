import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, readJson } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
  source: z.string().trim().max(40).default("home"),
});

/**
 * POST /api/newsletter
 *
 * Stores a subscriber and always answers `{ subscribed: true }` — including
 * for an address that is already on the list — so the endpoint cannot be used
 * to test whether someone subscribed.
 */
export async function POST(request: Request) {
  try {
    enforceRateLimit(request, {
      key: "newsletter:subscribe",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    const input = subscribeSchema.parse(await readJson(request));

    await prisma.newsletterSubscriber.upsert({
      where: { email: input.email },
      update: {
        locale: input.locale,
        source: input.source,
        isActive: true,
      },
      create: {
        email: input.email,
        locale: input.locale,
        source: input.source,
      },
    });

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
