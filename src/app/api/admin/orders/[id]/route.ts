import {
  OrderStatus,
  Prisma,
  RugStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { adminOrderUpdateSchema } from "@/lib/api/schemas";
import { serializeAdminOrder } from "@/lib/admin/data";
import { sendTrackingNotifications } from "@/lib/notifications";
import type { TrackingNotificationResult } from "@/lib/admin/types";
import type { CurrencyCode } from "@/lib/money";

export const dynamic = "force-dynamic";

const ORDER_INCLUDE = {
  items: {
    include: {
      rug: { select: { slug: true, photos: true, type: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderInclude;

const RELEASING_STATUSES = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
  OrderStatus.FAILED,
  OrderStatus.REFUNDED,
]);

/**
 * PATCH /api/admin/orders/[id]
 *
 * Updates the fulfilment state. Status transitions maintain the order
 * timestamps and the unique-rug stock:
 *   PAID                          → paidAt, every attached rug SOLD
 *   SHIPPED / DELIVERED           → shippedAt / deliveredAt
 *   CANCELLED / FAILED / REFUNDED → cancelledAt, attached rugs AVAILABLE
 *
 * When a tracking number is added (or the order ships), the customer receives
 * an email and a WhatsApp message when the channels are configured. The
 * response always includes a pre-filled wa.me fallback link.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireAdmin(request, { write: true });

    const input = adminOrderUpdateSchema.parse(await readJson(request));

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      include: ORDER_INCLUDE,
    });

    if (!existing) {
      throw new ApiError(404, "Order not found.", "NOT_FOUND");
    }

    const statusChanged =
      input.status !== undefined && input.status !== existing.status;

    const data: Prisma.OrderUpdateInput = {};
    const now = new Date();

    if (input.status !== undefined) {
      data.status = input.status;

      if (statusChanged) {
        switch (input.status) {
          case OrderStatus.PAID:
            data.paidAt = existing.paidAt ?? now;
            break;
          case OrderStatus.SHIPPED:
            data.shippedAt = existing.shippedAt ?? now;
            break;
          case OrderStatus.DELIVERED:
            data.deliveredAt = existing.deliveredAt ?? now;
            break;
          case OrderStatus.CANCELLED:
            data.cancelledAt = existing.cancelledAt ?? now;
            break;
          default:
            break;
        }
      }
    }

    if (input.trackingNumber !== undefined) {
      data.trackingNumber = input.trackingNumber?.trim() || null;
    }
    if (input.carrier !== undefined) {
      data.carrier = input.carrier?.trim() || null;
    }
    if (input.adminNote !== undefined) {
      data.adminNote = input.adminNote?.trim() || null;
    }

    const rugIds = existing.items
      .map((item) => item.rugId)
      .filter((id): id is string => Boolean(id));

    const markSold = statusChanged && input.status === OrderStatus.PAID;
    const releaseRugs =
      statusChanged &&
      input.status !== undefined &&
      RELEASING_STATUSES.has(input.status);

    const updated = await prisma.$transaction(async (tx) => {
      if (markSold && rugIds.length > 0) {
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

      if (releaseRugs && rugIds.length > 0) {
        await tx.rug.updateMany({
          where: { id: { in: rugIds } },
          data: {
            stock: 1,
            status: RugStatus.AVAILABLE,
            reservedUntil: null,
            reservedByOrderId: null,
          },
        });
      }

      return tx.order.update({
        where: { id: params.id },
        data,
        include: ORDER_INCLUDE,
      });
    });

    const trackingChanged =
      input.trackingNumber !== undefined &&
      (input.trackingNumber?.trim() || null) !== existing.trackingNumber;
    const shippedNow =
      statusChanged && input.status === OrderStatus.SHIPPED;

    let notifications: TrackingNotificationResult | null = null;

    if (updated.trackingNumber && (trackingChanged || shippedNow)) {
      notifications = await sendTrackingNotifications({
        orderNumber: updated.orderNumber,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        trackingNumber: updated.trackingNumber,
        carrier: updated.carrier,
        currency: updated.currency as CurrencyCode,
        totalAmount: Number(updated.totalAmount),
        items: updated.items.map((item) => ({
          nameSnapshot: item.nameSnapshot,
          sku: item.sku,
          quantity: item.quantity,
        })),
      });
    }

    return NextResponse.json({
      order: serializeAdminOrder(updated),
      notifications,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
