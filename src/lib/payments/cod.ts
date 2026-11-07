import { OrderStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "../db";
import { appendOrderToken } from "../orders/access";
import type { PaymentProvider } from "./types";

/**
 * Cash on Delivery — the default payment flow in Morocco.
 *
 * The order is marked PENDING_COD and the buyer is sent to the order
 * confirmation page. A manager confirms the order by phone before dispatch;
 * cash is collected on delivery (CASH_COLLECTED).
 */
export class CashOnDeliveryProvider implements PaymentProvider {
  async createPayment(order: any): Promise<{ redirectUrl: string }> {
    const orderId = order?.id;

    if (!orderId || typeof orderId !== "string") {
      throw new Error(
        "Cash on delivery requires a persisted order with an id.",
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PENDING_COD,
        paymentMethod: PaymentMethod.COD,
      },
      select: { id: true, createdAt: true },
    });

    return { redirectUrl: appendOrderToken(`/order/${updated.id}`, updated) };
  }

  async handleWebhook(_req: Request): Promise<{
    orderId: string;
    transactionId?: string;
    status: "paid" | "failed";
  }> {
    throw new Error(
      "Cash on delivery does not use webhooks. Cash collection is confirmed by a manager from the admin dashboard.",
    );
  }
}

export const codProvider = new CashOnDeliveryProvider();
