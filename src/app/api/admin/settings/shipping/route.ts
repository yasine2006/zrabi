import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { adminShippingSettingsSchema } from "@/lib/api/schemas";
import { convertFromMad, getCurrencyRates, roundMoney } from "@/lib/currency";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/settings/shipping
 *
 * Updates a batch of weight-bracket rows (price, carrier, ETA, active flag).
 * EUR/USD prices are always derived from the MAD price and the live rates so
 * a shipping edit can never drift from the catalogue conversions. ADMIN only.
 */
export async function PUT(request: Request) {
  try {
    requireAdmin(request, { write: true, roles: ["ADMIN"] });

    const input = adminShippingSettingsSchema.parse(await readJson(request));

    const existing = await prisma.shippingRate.findMany({
      select: { id: true },
    });
    const known = new Set(existing.map((rate) => rate.id));

    for (const rate of input.rates) {
      if (!known.has(rate.id)) {
        throw new ApiError(
          422,
          `Shipping rate "${rate.id}" does not exist.`,
          "INVALID_SHIPPING_RATE",
        );
      }

      if (rate.estimatedDaysMax < rate.estimatedDaysMin) {
        throw new ApiError(
          422,
          "The maximum delivery time must be greater than the minimum.",
          "INVALID_DELIVERY_WINDOW",
        );
      }
    }

    const rates = await getCurrencyRates();

    await prisma.$transaction(
      input.rates.map((rate) =>
        prisma.shippingRate.update({
          where: { id: rate.id },
          data: {
            priceMad: rate.priceMad,
            priceEur: roundMoney(
              convertFromMad(rate.priceMad, "EUR", rates),
            ),
            priceUsd: roundMoney(
              convertFromMad(rate.priceMad, "USD", rates),
            ),
            carrier: rate.carrier?.trim() || null,
            estimatedDaysMin: rate.estimatedDaysMin,
            estimatedDaysMax: rate.estimatedDaysMax,
            isActive: rate.isActive,
          },
        }),
      ),
    );

    return NextResponse.json({ updated: input.rates.length });
  } catch (error) {
    return handleApiError(error);
  }
}
