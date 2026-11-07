import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { shippingQuoteSchema } from "@/lib/api/schemas";
import { formatPrice } from "@/lib/currency";
import { calculateShipping } from "@/lib/shipping";

export const dynamic = "force-dynamic";

/**
 * POST /api/shipping/quote
 *
 * Body: { country: "FR", items: [{ rugId, quantity }] }
 *
 * The parcel weight is the sum of every selected rug's weight × quantity.
 * The matching ShippingRate bracket is resolved by `calculateShipping`.
 */
export async function POST(request: Request) {
  try {
    enforceRateLimit(request, {
      key: "shipping:quote",
      limit: 60,
      windowMs: 60 * 1000,
    });

    const input = shippingQuoteSchema.parse(await readJson(request));

    const rugIds = Array.from(new Set(input.items.map((item) => item.rugId)));

    const rugs = await prisma.rug.findMany({
      where: { id: { in: rugIds } },
      select: { id: true, sku: true, nameFr: true, weightKg: true },
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

    const weightById = new Map(
      rugs.map((rug) => [rug.id, Number(rug.weightKg)]),
    );

    const totalWeightKg =
      Math.round(
        input.items.reduce(
          (sum, item) =>
            sum + (weightById.get(item.rugId) ?? 0) * item.quantity,
          0,
        ) * 1000,
      ) / 1000;

    const quote = await calculateShipping(input.country, totalWeightKg);

    return NextResponse.json({
      country: quote.countryCode,
      zone: quote.zone,
      totalWeightKg: quote.weightKg,
      priceMad: quote.priceMad,
      priceEur: quote.priceEur,
      priceUsd: quote.priceUsd,
      formatted: {
        MAD: formatPrice(quote.priceMad, "MAD"),
        EUR: formatPrice(quote.priceEur, "EUR"),
        USD: formatPrice(quote.priceUsd, "USD"),
      },
      carrier: quote.carrier,
      estimatedDaysMin: quote.estimatedDaysMin,
      estimatedDaysMax: quote.estimatedDaysMax,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
