import {
  OrderStatus,
  type CurrencyRate,
  type CustomOrder,
  type Order,
  type OrderItem,
  type Rug,
  type ShippingRate,
} from "@prisma/client";
import { prisma } from "../db";
import { serializeRug } from "../api/serializers";
import {
  convertFromMad,
  getCurrencyRates,
  roundMoney,
  type CurrencyCode,
} from "../currency";
import type {
  AdminCustomOrder,
  AdminCurrencyRate,
  AdminDashboardData,
  AdminKpis,
  AdminOrder,
  AdminSalesKpi,
  AdminShippingRate,
} from "./types";

/**
 * Server-only reads for the admin dashboard.
 *
 * Every monetary value is returned as a number and every date as an ISO
 * string, so the whole payload can cross the server/client boundary without
 * Prisma Decimal prototypes or custom serializers.
 */

const OPEN_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_COD,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
];

/** Orders that must never count as sales. */
const NON_SALES_STATUSES = new Set<OrderStatus>([
  OrderStatus.PENDING,
  OrderStatus.FAILED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
]);

type OrderForAdmin = Order & {
  items: Array<
    OrderItem & {
      rug: Pick<Rug, "slug" | "photos" | "type"> | null;
    }
  >;
};

export function serializeAdminOrder(order: OrderForAdmin): AdminOrder {
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
    exchangeRate: Number(order.exchangeRate),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    promoCode: order.promoCode,
    shippingCost: Number(order.shippingCost),
    totalAmount: Number(order.totalAmount),
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    customerNote: order.customerNote,
    adminNote: order.adminNote,
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
}

export function serializeAdminCustomOrder(
  order: CustomOrder,
): AdminCustomOrder {
  return {
    id: order.id,
    reference: order.reference,
    fullName: order.fullName,
    email: order.email,
    phone: order.phone,
    rugType: order.rugType,
    widthCm: order.widthCm,
    lengthCm: order.lengthCm,
    budgetMad: order.budgetMad === null ? null : Number(order.budgetMad),
    woolColors: order.woolColors,
    pattern: order.pattern,
    description: order.description,
    inspirationPhotos: order.inspirationPhotos,
    status: order.status,
    quotedPriceMad:
      order.quotedPriceMad === null ? null : Number(order.quotedPriceMad),
    depositMad: order.depositMad === null ? null : Number(order.depositMad),
    depositPaidAt: order.depositPaidAt?.toISOString() ?? null,
    currency: order.currency,
    adminNote: order.adminNote,
    respondedAt: order.respondedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function serializeAdminShippingRate(
  rate: ShippingRate,
): AdminShippingRate {
  return {
    id: rate.id,
    zone: rate.zone,
    minWeightKg: Number(rate.minWeightKg),
    maxWeightKg: Number(rate.maxWeightKg),
    priceMad: Number(rate.priceMad),
    priceEur: Number(rate.priceEur),
    priceUsd: Number(rate.priceUsd),
    carrier: rate.carrier,
    estimatedDaysMin: rate.estimatedDaysMin,
    estimatedDaysMax: rate.estimatedDaysMax,
    isActive: rate.isActive,
  };
}

function serializeAdminCurrencyRate(rate: CurrencyRate): AdminCurrencyRate {
  return {
    currency: rate.currency,
    rate: Number(rate.rate),
    updatedAt: rate.updatedAt.toISOString(),
  };
}

function amountInMad(order: {
  totalAmount: { toString(): string };
  exchangeRate: { toString(): string };
}): number {
  const amount = Number(order.totalAmount);
  const rate = Number(order.exchangeRate) || 1;
  return amount * rate;
}

function salesKpi(
  orders: Array<{
    totalAmount: { toString(): string };
    exchangeRate: { toString(): string };
    status: OrderStatus;
  }>,
  rates: Record<CurrencyCode, number>,
): AdminSalesKpi {
  const confirmed = orders.filter(
    (order) => !NON_SALES_STATUSES.has(order.status),
  );
  const mad = roundMoney(
    confirmed.reduce((sum, order) => sum + amountInMad(order), 0),
  );

  return {
    orders: confirmed.length,
    mad,
    eur: convertFromMad(mad, "EUR", rates),
    usd: convertFromMad(mad, "USD", rates),
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    rugs,
    orders,
    customOrders,
    shippingRates,
    currencyRows,
    artisans,
    monthOrders,
    ordersToProcess,
    rates,
  ] = await Promise.all([
    prisma.rug.findMany({
      include: { artisan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      include: {
        items: {
          include: {
            rug: { select: { slug: true, photos: true, type: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.customOrder.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.shippingRate.findMany({
      orderBy: [{ zone: "asc" }, { minWeightKg: "asc" }],
    }),
    prisma.currencyRate.findMany({ orderBy: { currency: "asc" } }),
    prisma.artisan.findMany({
      orderBy: { nameFr: "asc" },
      select: {
        id: true,
        nameFr: true,
        nameEn: true,
        village: true,
        region: true,
      },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: {
        totalAmount: true,
        exchangeRate: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.count({
      where: { status: { in: OPEN_ORDER_STATUSES } },
    }),
    getCurrencyRates(),
  ]);

  const todayOrders = monthOrders.filter(
    (order) => order.createdAt >= startOfToday,
  );

  const serializedRugs = rugs.map(serializeRug);
  const nowMs = now.getTime();
  const reservedRugs = serializedRugs.filter(
    (rug) =>
      rug.status === "RESERVED" &&
      (!rug.reservedUntil ||
        new Date(rug.reservedUntil).getTime() > nowMs),
  ).length;
  const availableRugs = serializedRugs.filter(
    (rug) => rug.status === "AVAILABLE",
  ).length;
  const soldRugs = serializedRugs.filter(
    (rug) => rug.status === "SOLD",
  ).length;

  const kpis: AdminKpis = {
    today: salesKpi(todayOrders, rates),
    month: salesKpi(monthOrders, rates),
    ordersToProcess,
    reservedRugs,
    availableRugs,
    soldRugs,
    totalRugs: serializedRugs.length,
  };

  const mostViewed = [...serializedRugs]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5)
    .map((rug) => ({
      id: rug.id,
      slug: rug.slug,
      sku: rug.sku,
      nameFr: rug.nameFr,
      nameEn: rug.nameEn,
      nameAr: rug.nameAr,
      status: rug.status,
      viewCount: rug.viewCount,
      photo: rug.photos[0] ?? null,
    }));

  return {
    generatedAt: now.toISOString(),
    rates,
    kpis,
    mostViewed,
    rugs: serializedRugs,
    orders: orders.map(serializeAdminOrder),
    customOrders: customOrders.map(serializeAdminCustomOrder),
    shippingRates: shippingRates.map(serializeAdminShippingRate),
    currencyRates: currencyRows.map(serializeAdminCurrencyRate),
    artisans,
  };
}
