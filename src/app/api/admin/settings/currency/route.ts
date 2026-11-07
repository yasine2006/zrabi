import { Currency } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { handleApiError, readJson } from "@/lib/api/errors";
import { adminCurrencySettingsSchema } from "@/lib/api/schemas";
import {
  convertFromMad,
  roundMoney,
  type CurrencyRates,
} from "@/lib/currency";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/settings/currency
 *
 * Updates the live EUR/USD rates and immediately recomputes every stored
 * foreign price (rugs and shipping brackets) so the storefront never shows a
 * stale conversion. Restricted to ADMIN.
 */
export async function PUT(request: Request) {
  try {
    requireAdmin(request, { write: true, roles: ["ADMIN"] });

    const input = adminCurrencySettingsSchema.parse(await readJson(request));
    const rates: CurrencyRates = {
      MAD: 1,
      EUR: input.eurPerMad,
      USD: input.usdPerMad,
    };

    const [rugs, shippingRates] = await Promise.all([
      prisma.rug.findMany({ select: { id: true, priceMad: true } }),
      prisma.shippingRate.findMany({ select: { id: true, priceMad: true } }),
    ]);

    await prisma.$transaction(async (tx) => {
      for (const currency of [Currency.MAD, Currency.EUR, Currency.USD]) {
        await tx.currencyRate.upsert({
          where: { currency },
          update: { rate: rates[currency], source: "manual" },
          create: { currency, rate: rates[currency], source: "manual" },
        });
      }

      for (const rug of rugs) {
        const mad = Number(rug.priceMad);
        await tx.rug.update({
          where: { id: rug.id },
          data: {
            priceEur: roundMoney(convertFromMad(mad, "EUR", rates)),
            priceUsd: roundMoney(convertFromMad(mad, "USD", rates)),
          },
        });
      }

      for (const rate of shippingRates) {
        const mad = Number(rate.priceMad);
        await tx.shippingRate.update({
          where: { id: rate.id },
          data: {
            priceEur: roundMoney(convertFromMad(mad, "EUR", rates)),
            priceUsd: roundMoney(convertFromMad(mad, "USD", rates)),
          },
        });
      }
    });

    return NextResponse.json({
      rates,
      updated: {
        rugs: rugs.length,
        shippingRates: shippingRates.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
