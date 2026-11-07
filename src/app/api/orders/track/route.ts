import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { prisma } from "@/lib/db";
import { orderAccessToken } from "@/lib/orders/access";

export const dynamic = "force-dynamic";

const trackSchema = z.object({
  orderNumber: z.string().trim().min(4).max(64),
  email: z.string().trim().email().max(254),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, {
      key: "order-track",
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    const input = trackSchema.parse(await readJson(request));

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: input.orderNumber.toUpperCase(),
        email: { equals: input.email.toLowerCase(), mode: "insensitive" },
      },
      select: { id: true, createdAt: true },
    });

    if (!order) {
      throw new ApiError(404, "No order matches these details.", "ORDER_NOT_FOUND");
    }

    return NextResponse.json({
      orderId: order.id,
      token: orderAccessToken(order),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
