import { Currency } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, readJson } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { generateCustomOrderReference } from "@/lib/api/identifiers";
import { customOrderCreateSchema } from "@/lib/api/schemas";
import {
  convertFromMad,
  formatPrice,
  getCurrencyRates,
  roundMoney,
  type CurrencyCode,
} from "@/lib/currency";

export const dynamic = "force-dynamic";

/** Share of the estimated budget requested as a deposit. */
const CUSTOM_ORDER_DEPOSIT_PERCENT = 30;

/**
 * POST /api/custom-orders
 *
 * Persists a bespoke commission request with dimensions, wool colours, pattern
 * and budget. A 30% deposit is computed from the budget and stored alongside
 * the request; the remaining balance is quoted by the atelier.
 */
export async function POST(request: Request) {
  try {
    enforceRateLimit(request, {
      key: "custom-orders:create",
      limit: 4,
      windowMs: 60 * 60 * 1000,
    });

    const input = customOrderCreateSchema.parse(await readJson(request));

    const budgetMad = roundMoney(input.budgetMad ?? input.budget!);
    const depositMad = roundMoney(
      (budgetMad * CUSTOM_ORDER_DEPOSIT_PERCENT) / 100,
    );

    const currency = input.currency as CurrencyCode;
    const rates = await getCurrencyRates();
    const depositAmount =
      currency === Currency.MAD
        ? depositMad
        : convertFromMad(depositMad, currency, rates);

    const created = await prisma.customOrder.create({
      data: {
        reference: generateCustomOrderReference(),
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        rugType: input.rugType ?? null,
        widthCm: input.widthCm,
        lengthCm: input.lengthCm,
        woolColors: input.woolColors,
        pattern: input.pattern ?? null,
        description: input.description,
        inspirationPhotos: input.inspirationPhotos,
        budgetMad,
        depositMad,
        currency: input.currency,
      },
      select: {
        id: true,
        reference: true,
        status: true,
        currency: true,
        budgetMad: true,
        depositMad: true,
        woolColors: true,
        pattern: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        customOrder: {
          id: created.id,
          reference: created.reference,
          status: created.status,
          currency: created.currency,
          budgetMad: Number(created.budgetMad),
          deposit: {
            percent: CUSTOM_ORDER_DEPOSIT_PERCENT,
            amountMad: Number(created.depositMad),
            amount: depositAmount,
            currency,
            formatted: formatPrice(depositAmount, currency),
          },
          woolColors: created.woolColors,
          pattern: created.pattern,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
