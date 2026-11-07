import { Prisma, RugStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { handleApiError, readJson } from "@/lib/api/errors";
import { adminRugUpdateSchema } from "@/lib/api/schemas";
import { serializeRug } from "@/lib/api/serializers";
import { convertFromMad, getCurrencyRates, roundMoney } from "@/lib/currency";
import { reservationExpiry } from "@/lib/stock";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/rugs/[id]
 *
 * Partial update. Changing the base MAD price recalculates EUR/USD unless the
 * operator supplied them explicitly. Status transitions keep the catalogue
 * invariants used by checkout:
 *   SOLD      → stock 0, no reservation
 *   AVAILABLE → no reservation, stock restored when it was 0
 *   RESERVED  → a fresh 15-minute lock (an active lock is preserved)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireAdmin(request, { write: true });

    const input = adminRugUpdateSchema.parse(await readJson(request));

    const existing = await prisma.rug.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        stock: true,
        status: true,
        reservedUntil: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Rug not found." } },
        { status: 404 },
      );
    }

    const rates = await getCurrencyRates();
    const { photos, status, priceMad, priceEur, priceUsd, ...rest } = input;

    const data: Prisma.RugUncheckedUpdateInput = {
      ...rest,
      ...(photos ? { photos } : {}),
    };

    if (priceMad !== undefined) {
      data.priceMad = priceMad;
      data.priceEur =
        priceEur ??
        roundMoney(convertFromMad(priceMad, "EUR", rates));
      data.priceUsd =
        priceUsd ??
        roundMoney(convertFromMad(priceMad, "USD", rates));
    } else {
      if (priceEur !== undefined) data.priceEur = priceEur;
      if (priceUsd !== undefined) data.priceUsd = priceUsd;
    }

    if (status !== undefined) {
      data.status = status;

      if (status === RugStatus.SOLD) {
        data.stock = 0;
        data.reservedUntil = null;
        data.reservedByOrderId = null;
      } else if (status === RugStatus.AVAILABLE) {
        data.reservedUntil = null;
        data.reservedByOrderId = null;
        if (existing.stock <= 0) data.stock = input.stock ?? 1;
      } else if (status === RugStatus.RESERVED) {
        const activeLock =
          existing.status === RugStatus.RESERVED &&
          existing.reservedUntil !== null &&
          existing.reservedUntil.getTime() > Date.now();

        data.reservedUntil = activeLock
          ? existing.reservedUntil
          : reservationExpiry();
        data.reservedByOrderId = null;
        if (existing.stock <= 0) data.stock = 1;
      }
    }

    const updated = await prisma.rug.update({
      where: { id: params.id },
      data,
      include: { artisan: true },
    });

    return NextResponse.json({ rug: serializeRug(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}
