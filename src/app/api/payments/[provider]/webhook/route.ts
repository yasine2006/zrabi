import { OrderStatus, PaymentMethod, RugStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/api/errors";
import { getPaymentProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

const PROVIDER_METHODS: Record<string, PaymentMethod> = {
  stripe: PaymentMethod.STRIPE,
  cmi: PaymentMethod.CMI,
};

/**
 * POST /api/payments/[provider]/webhook
 *
 * The ONLY place where card payments are validated. Return pages
 * (`/order/[id]?payment=success`) only display a status and never mark an order
 * paid.
 *
 * Security rules applied here:
 *  1. Card status is validated exclusively from a signed provider webhook.
 *  2. The Stripe signature / CMI HMAC-SHA512 hash is verified by the provider
 *     before any database access.
 *  3. Idempotent: an order already PAID (or already FAILED for a failure
 *     event) returns 200 immediately with no extra writes.
 *  4. PAID → order PAID + every attached unique rug SOLD (stock 0).
 *     FAILED → order FAILED + reserved rugs returned to AVAILABLE.
 */
export async function POST(
  request: Request,
  { params }: { params: { provider: string } },
) {
  try {
    const method = PROVIDER_METHODS[params.provider.toLowerCase()];

    if (!method) {
      return apiError(
        404,
        `Unsupported payment provider "${params.provider}".`,
        "PROVIDER_NOT_FOUND",
      );
    }

    const provider = getPaymentProvider(method);

    let result: {
      orderId: string;
      transactionId?: string;
      status: "paid" | "failed";
    };

    try {
      result = await provider.handleWebhook(request);
    } catch (error) {
      // Signature/hash failures must never mutate state.
      const message =
        error instanceof Error ? error.message : "Webhook verification failed.";

      if (message.startsWith("Missing required environment variable")) {
        console.error("[payments] Webhook is not configured:", message);
        return apiError(
          500,
          "Payment webhook is not configured.",
          "WEBHOOK_NOT_CONFIGURED",
        );
      }

      return apiError(400, message, "WEBHOOK_INVALID");
    }

    // Unrelated events (or an async Stripe payment still pending) are
    // acknowledged without releasing the rug or changing the order.
    if (!result.orderId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: result.orderId }, { orderNumber: result.orderId }],
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paidAt: true,
        paymentReference: true,
        items: { select: { rugId: true } },
      },
    });

    if (!order) {
      return apiError(
        404,
        "No order matches this payment notification.",
        "ORDER_NOT_FOUND",
      );
    }

    // Rule 3 — replay protection. No state change, no email, no stock update.
    if (order.status === OrderStatus.PAID) {
      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
        orderId: order.id,
        status: "paid",
      });
    }

    if (
      order.status === OrderStatus.FAILED &&
      result.status === "failed"
    ) {
      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
        orderId: order.id,
        status: "failed",
      });
    }

    const rugIds = order.items
      .map((item) => item.rugId)
      .filter((id): id is string => Boolean(id));

    const paid = result.status === "paid";

    // The status guard inside updateMany closes the race between two webhook
    // deliveries arriving at the same time: only the first one applies stock
    // mutations.
    const applied = await prisma.$transaction(async (tx) => {
      if (paid) {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: { not: OrderStatus.PAID } },
          data: {
            status: OrderStatus.PAID,
            paidAt: order.paidAt ?? new Date(),
            paymentReference:
              result.transactionId ??
              order.paymentReference ??
              order.orderNumber,
          },
        });

        if (updated.count === 0) return false;

        if (rugIds.length > 0) {
          await tx.rug.updateMany({
            where: { id: { in: rugIds } },
            data: {
              stock: 0,
              status: RugStatus.SOLD,
              reservedUntil: null,
              reservedByOrderId: null,
            },
          });
        }

        return true;
      }

      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: { notIn: [OrderStatus.PAID, OrderStatus.REFUNDED] },
        },
        data: {
          status: OrderStatus.FAILED,
          paymentReference:
            result.transactionId ?? order.paymentReference ?? null,
        },
      });

      if (updated.count === 0) return false;

      if (rugIds.length > 0) {
        await tx.rug.updateMany({
          where: {
            id: { in: rugIds },
            status: RugStatus.RESERVED,
            reservedByOrderId: order.id,
          },
          data: {
            status: RugStatus.AVAILABLE,
            reservedUntil: null,
            reservedByOrderId: null,
          },
        });
      }

      return true;
    });

    if (!applied) {
      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
        orderId: order.id,
        status: paid ? "paid" : "failed",
      });
    }

    return NextResponse.json({
      received: true,
      orderId: order.id,
      status: result.status,
      transactionId: result.transactionId ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Payment return pages never validate payments; only this POST may. */
export function GET() {
  return apiError(
    405,
    "Payment webhooks only accept POST requests.",
    "METHOD_NOT_ALLOWED",
  );
}
