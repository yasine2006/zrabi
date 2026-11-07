import { NextResponse } from "next/server";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { orderCreateSchema } from "@/lib/api/schemas";
import { getPaymentProvider } from "@/lib/payments";
import { isPaymentMethodAvailable } from "@/lib/payments/availability";
import {
  createOrder,
  failOrderAndRelease,
} from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders
 *
 * Creates an order for unique rugs:
 *  1. validates the customer and basket,
 *  2. releases expired holds, claims every rug for 15 minutes and persists the
 *     order in a single transaction (`createOrder`),
 *  3. asks the payment provider for a redirect URL.
 *
 * If payment initialisation fails, the order is marked FAILED and the rugs are
 * released immediately instead of blocking the catalogue for 15 minutes.
 */
export async function POST(request: Request) {
  try {
    enforceRateLimit(request, {
      key: "orders:create",
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });

    const input = orderCreateSchema.parse(await readJson(request));

    if (!isPaymentMethodAvailable(input.paymentMethod)) {
      throw new ApiError(
        400,
        "This payment method is not available right now. Please choose another option.",
        "PAYMENT_METHOD_UNAVAILABLE",
      );
    }

    const { order, reservedUntil } = await createOrder(input);
    const rugIds = input.items.map((item) => item.rugId);

    let redirectUrl: string;

    try {
      ({ redirectUrl } = await getPaymentProvider(
        input.paymentMethod,
      ).createPayment(order));
    } catch (error) {
      console.error(
        `[orders] Payment initialisation failed for ${order.orderNumber}:`,
        error,
      );

      await failOrderAndRelease(order.id, rugIds);

      throw new ApiError(
        502,
        "Payment could not be initialised. Please try again.",
        "PAYMENT_INIT_FAILED",
      );
    }

    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        redirectUrl,
        reservedUntil: reservedUntil.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
