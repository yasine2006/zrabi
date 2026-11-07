import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { prisma } from "@/lib/db";
import { orderAccessToken } from "@/lib/orders/access";

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  orderNumber: z.string().trim().min(4).max(64),
  email: z.string().trim().email().max(254),
});

/**
 * POST /api/orders/lookup
 *
 * Exchange (order id + order number + e-mail) for a signed order-page link.
 * The response is deliberately identical for "unknown order" and "wrong
 * e-mail" so the endpoint cannot be used to enumerate customer addresses.
 */
export async function POST(request: Request) {
  try {
    enforceRateLimit(request, {
      key: "order-lookup",
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    const input = lookupSchema.parse(await readJson(request));

    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        orderNumber: input.orderNumber.toUpperCase(),
        email: { equals: input.email.toLowerCase(), mode: "insensitive" },
      },
      select: { id: true, createdAt: true },
    });

    if (!order) {
      throw new ApiError(
        404,
        "No order matches these details.",
        "ORDER_NOT_FOUND",
      );
    }

    return NextResponse.json({
      orderId: order.id,
      token: orderAccessToken(order),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
