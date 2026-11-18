import { prisma } from "./db";

/**
 * Read-only order lookups for the confirmation and tracking page.
 *
 * This module never talks to a payment provider and never mutates an order:
 * the confirmation page reflects what is stored in PostgreSQL and nothing else.
 * Prisma `Decimal` and `Date` values are converted to JSON-safe primitives so
 * the result can be handed to a client component as-is.
 */

export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            rug: {
              select: { slug: true, photos: true, type: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      phone: order.phone,
      fullName: order.fullName,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      postalCode: order.postalCode,
      country: order.country,
      shippingZone: order.shippingZone,
      status: order.status,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      customerNote: order.customerNote,
      paymentReference: order.paymentReference,
      paidAt: order.paidAt?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        nameSnapshot: item.nameSnapshot,
        sku: item.sku,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
        slug: item.rug?.slug ?? null,
        photo: item.rug?.photos?.[0] ?? null,
        type: item.rug?.type ?? null,
      })),
    };
  } catch (error) {
    console.warn(
      `[orders] Failed to load order "${id}" from database.`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export type StorefrontOrder = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;
