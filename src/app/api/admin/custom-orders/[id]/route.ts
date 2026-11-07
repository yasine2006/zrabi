import { CustomOrderStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { adminCustomOrderUpdateSchema } from "@/lib/api/schemas";
import { serializeAdminCustomOrder } from "@/lib/admin/data";
import { roundMoney } from "@/lib/currency";

export const dynamic = "force-dynamic";

/** A quote always implies a 30% deposit unless the operator overrides it. */
const DEPOSIT_PERCENT = 30;

/**
 * PATCH /api/admin/custom-orders/[id]
 *
 * Tracks a bespoke commission: quote, deposit, status and internal note. When
 * the commission reaches DEPOSIT_RECEIVED the payment timestamp is stamped
 * once, so the dashboard can report deposits accurately.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireAdmin(request, { write: true });

    const input = adminCustomOrderUpdateSchema.parse(await readJson(request));

    const existing = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        depositPaidAt: true,
        respondedAt: true,
      },
    });

    if (!existing) {
      throw new ApiError(404, "Custom order not found.", "NOT_FOUND");
    }

    const data: Prisma.CustomOrderUpdateInput = {};
    const now = new Date();

    if (input.adminNote !== undefined) {
      data.adminNote = input.adminNote?.trim() || null;
    }

    let deposit = input.depositMad;

    if (input.quotedPriceMad !== undefined) {
      data.quotedPriceMad = input.quotedPriceMad;

      if (
        input.quotedPriceMad !== null &&
        input.depositMad === undefined
      ) {
        deposit = roundMoney(
          (input.quotedPriceMad * DEPOSIT_PERCENT) / 100,
        );
      }

      if (!existing.respondedAt) {
        data.respondedAt = now;
      }
    }

    if (deposit !== undefined) {
      data.depositMad = deposit;
    }

    if (input.status !== undefined) {
      data.status = input.status;

      if (
        input.status === CustomOrderStatus.DEPOSIT_RECEIVED &&
        !existing.depositPaidAt
      ) {
        data.depositPaidAt = now;
      }

      if (
        existing.status === CustomOrderStatus.NEW &&
        input.status !== CustomOrderStatus.NEW &&
        !existing.respondedAt
      ) {
        data.respondedAt = now;
      }
    }

    const updated = await prisma.customOrder.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      customOrder: serializeAdminCustomOrder(updated),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
