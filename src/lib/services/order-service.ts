import {
  OrderStatus,
  PaymentMethod,
  RugStatus,
  type Order,
  type OrderItem,
  type Rug,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import { generateOrderNumber } from "@/lib/api/identifiers";
import type { OrderCreateInput } from "@/lib/api/schemas";
import {
  convertFromMad,
  getCurrencyRates,
  getExchangeRateToMad,
  roundMoney,
  type CurrencyCode,
  type CurrencyRates,
} from "@/lib/currency";
import { getPromo } from "@/lib/promo";
import {
  calculateShipping,
  resolveShippingZone,
  ShippingError,
  type ShippingQuote,
  type ShippingZone,
} from "@/lib/shipping";
import { claimUniqueRug, reservationExpiry } from "@/lib/stock";

/**
 * Order creation service.
 *
 * Everything that can fail because of stock happens inside a single
 * PostgreSQL transaction: expired holds are released, every rug is claimed
 * with a conditional UPDATE, and the order + its line items are written. If
 * one rug is taken by a competing buyer the whole transaction rolls back, so
 * a shopper never pays for half a basket.
 *
 * Payment initialisation (Stripe / CMI) is deliberately *outside* the
 * transaction: it is a remote call and must never hold database locks. The
 * route calls `failOrderAndRelease()` when that remote call fails.
 */

/**
 * Flat fallback used when an operator has not configured a shipping bracket
 * for a zone / weight combination. The database grid stays authoritative;
 * these values only prevent checkout from failing on a gap in the grid.
 */
export const FLAT_ZONE_RATES_MAD: Record<ShippingZone, number> = {
  MOROCCO: 0,
  EUROPE: 450,
  USA_CANADA: 650,
  MIDDLE_EAST: 850,
};

export interface CreateOrderResult {
  order: Order & { items: OrderItem[] };
  reservedUntil: Date;
  shipping: ShippingQuote;
}

function priceForCurrency(
  rug: Rug,
  currency: CurrencyCode,
  rates: CurrencyRates,
): number {
  if (currency === "MAD") return Number(rug.priceMad);

  const stored =
    currency === "EUR" ? Number(rug.priceEur) : Number(rug.priceUsd);

  return stored > 0
    ? stored
    : convertFromMad(Number(rug.priceMad), currency, rates);
}

function fallbackShipping(
  countryCode: string,
  weightKg: number,
  zone: ShippingZone,
  rates: CurrencyRates,
): ShippingQuote {
  const priceMad = FLAT_ZONE_RATES_MAD[zone];

  return {
    rateId: `fallback-${zone}`,
    zone,
    countryCode,
    weightKg,
    minWeightKg: 0,
    maxWeightKg: Number.POSITIVE_INFINITY,
    priceMad,
    priceEur: roundMoney(convertFromMad(priceMad, "EUR", rates)),
    priceUsd: roundMoney(convertFromMad(priceMad, "USD", rates)),
    carrier: null,
    estimatedDaysMin: zone === "MOROCCO" ? 1 : 5,
    estimatedDaysMax: zone === "MOROCCO" ? 3 : 12,
  };
}

async function quoteShipping(
  countryCode: string,
  weightKg: number,
  rates: CurrencyRates,
): Promise<ShippingQuote> {
  try {
    return await calculateShipping(countryCode, weightKg);
  } catch (error) {
    if (error instanceof ShippingError && error.code === "NO_RATE") {
      const zone = resolveShippingZone(countryCode);
      if (zone) {
        return fallbackShipping(
          countryCode.trim().toUpperCase(),
          Math.round(weightKg * 1000) / 1000,
          zone,
          rates,
        );
      }
    }
    throw error;
  }
}

/**
 * Create an order and reserve every rug for 15 minutes.
 *
 * @throws {ApiError} for invalid promo codes or missing rugs.
 * @throws {RugReservationError} when a rug was sold or locked in the meantime.
 * @throws {ShippingError} when the destination cannot be shipped to.
 */
export async function createOrder(
  input: OrderCreateInput,
): Promise<CreateOrderResult> {
  if (input.paymentMethod === PaymentMethod.PAYPAL) {
    throw new ApiError(
      422,
      "PayPal payments are not available yet. Please choose another method.",
      "PAYMENT_METHOD_UNAVAILABLE",
    );
  }

  const promo = input.promoCode ? getPromo(input.promoCode) : null;

  if (input.promoCode && !promo) {
    throw new ApiError(
      422,
      "This promo code is not valid.",
      "INVALID_PROMO",
    );
  }

  const rugIds = input.items.map((item) => item.rugId);

  if (new Set(rugIds).size !== rugIds.length) {
    throw new ApiError(
      400,
      "Each unique rug may only appear once in the basket.",
      "DUPLICATE_ITEMS",
    );
  }

  const rugs = await prisma.rug.findMany({
    where: { id: { in: rugIds } },
  });

  if (rugs.length !== rugIds.length) {
    const found = new Set(rugs.map((rug) => rug.id));
    const missing = rugIds.filter((id) => !found.has(id));

    throw new ApiError(
      404,
      "One or more rugs were not found.",
      "RUG_NOT_FOUND",
      { rugIds: missing },
    );
  }

  const rugById = new Map(rugs.map((rug) => [rug.id, rug]));
  const totalWeightKg =
    Math.round(
      input.items.reduce(
        (sum, item) =>
          sum + Number(rugById.get(item.rugId)!.weightKg) * item.quantity,
        0,
      ) * 1000,
    ) / 1000;

  const currency = input.currency as CurrencyCode;
  const rates = await getCurrencyRates();
  const exchangeRate = getExchangeRateToMad(currency, rates);
  const shipping = await quoteShipping(
    input.customer.country,
    totalWeightKg,
    rates,
  );

  const shippingCost = roundMoney(
    currency === "MAD"
      ? shipping.priceMad
      : currency === "EUR"
        ? shipping.priceEur
        : shipping.priceUsd,
  );

  const now = new Date();
  const reservedUntil = reservationExpiry(now);

  const order = await prisma.$transaction(async (tx) => {
    // 1. Release every hold whose 15-minute window elapsed. The per-rug claim
    //    below is conditional too, but releasing first keeps the catalogue
    //    state clean inside the same transaction.
    await tx.rug.updateMany({
      where: {
        status: RugStatus.RESERVED,
        reservedUntil: { not: null, lt: now },
      },
      data: {
        status: RugStatus.AVAILABLE,
        reservedUntil: null,
        reservedByOrderId: null,
      },
    });

    let subtotal = 0;
    const items: Array<{
      rugId: string;
      nameSnapshot: string;
      sku: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }> = [];

    for (const item of input.items) {
      // 2–3. Verify AVAILABLE (or an expired hold) and lock for 15 minutes.
      //    A competing buyer makes this throw and rolls back the whole order.
      const rug = await claimUniqueRug(tx, item.rugId, now);
      const unitPrice = roundMoney(priceForCurrency(rug, currency, rates));
      const lineTotal = roundMoney(unitPrice * item.quantity);

      subtotal = roundMoney(subtotal + lineTotal);

      items.push({
        rugId: rug.id,
        nameSnapshot: rug.nameFr,
        sku: rug.sku,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const discount = promo
      ? roundMoney((subtotal * promo.percent) / 100)
      : 0;
    const totalAmount = roundMoney(subtotal - discount + shippingCost);

    // 4–5. Persist the order with a stable status: cash on delivery is
    //      confirmed by the courier, card payments await the gateway webhook.
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(now),
        email: input.customer.email,
        phone: input.customer.phone,
        fullName: input.customer.fullName,
        addressLine1: input.customer.addressLine1,
        addressLine2: input.customer.addressLine2 ?? null,
        city: input.customer.city,
        postalCode: input.customer.postalCode ?? null,
        country: input.customer.country,
        shippingZone: shipping.zone,
        status:
          input.paymentMethod === PaymentMethod.COD
            ? OrderStatus.PENDING_COD
            : OrderStatus.PENDING,
        paymentMethod: input.paymentMethod,
        currency: input.currency,
        exchangeRate,
        subtotal,
        discount,
        promoCode: promo?.code ?? null,
        shippingCost,
        totalAmount,
        customerNote: input.customerNote ?? null,
        items: { create: items },
      },
      include: { items: true },
    });

    // Bind the locks to this order so a late failure webhook can never release
    // a reservation that has since been taken by another buyer.
    await tx.rug.updateMany({
      where: { id: { in: rugIds } },
      data: { reservedByOrderId: created.id },
    });

    return created;
  });

  return { order, reservedUntil, shipping };
}

/**
 * Mark an order FAILED and immediately return its rugs to the catalogue.
 * Used when the payment provider cannot be reached after the order committed.
 */
export async function failOrderAndRelease(
  orderId: string,
  rugIds: string[],
): Promise<void> {
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.FAILED },
    }),
    prisma.rug.updateMany({
      where: {
        id: { in: rugIds },
        status: RugStatus.RESERVED,
        reservedByOrderId: orderId,
      },
      data: {
        status: RugStatus.AVAILABLE,
        reservedUntil: null,
        reservedByOrderId: null,
      },
    }),
  ]);
}
