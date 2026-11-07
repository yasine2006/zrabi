import { RugStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { generateRugSku, slugify } from "@/lib/api/identifiers";
import { adminRugCreateSchema } from "@/lib/api/schemas";
import { serializeRug } from "@/lib/api/serializers";
import { convertFromMad, getCurrencyRates, roundMoney } from "@/lib/currency";
import { reservationExpiry } from "@/lib/stock";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/rugs
 *
 * Creates a catalogue piece. EUR/USD prices are derived from the live rates
 * when the operator leaves them empty. Photos accept any absolute URL (the
 * storefront uses Cloudinary / Unsplash in production).
 */
export async function POST(request: Request) {
  try {
    requireAdmin(request, { write: true });

    const input = adminRugCreateSchema.parse(await readJson(request));

    const artisan = await prisma.artisan.findUnique({
      where: { id: input.artisanId },
      select: { id: true },
    });

    if (!artisan) {
      throw new ApiError(
        422,
        `Artisan "${input.artisanId}" does not exist.`,
        "INVALID_ARTISAN",
      );
    }

    const rates = await getCurrencyRates();
    const priceEur =
      input.priceEur ?? roundMoney(convertFromMad(input.priceMad, "EUR", rates));
    const priceUsd =
      input.priceUsd ?? roundMoney(convertFromMad(input.priceMad, "USD", rates));

    const status = input.status;
    const stock = status === RugStatus.SOLD ? 0 : input.stock;
    const reservedUntil =
      status === RugStatus.RESERVED ? reservationExpiry() : null;

    const created = await prisma.rug.create({
      data: {
        slug:
          input.slug ??
          (slugify(input.nameFr) || `rug-${Date.now().toString(36)}`),
        sku: input.sku ?? generateRugSku(input.type),
        nameFr: input.nameFr,
        nameEn: input.nameEn,
        type: input.type,
        widthCm: input.widthCm,
        lengthCm: input.lengthCm,
        weightKg: input.weightKg,
        materialFr: input.materialFr,
        materialEn: input.materialEn,
        originVillage: input.originVillage,
        originRegion: input.originRegion,
        craftingDays: input.craftingDays,
        storyFr: input.storyFr,
        storyEn: input.storyEn,
        priceMad: input.priceMad,
        priceEur,
        priceUsd,
        stock,
        status,
        isMadeToOrder: input.isMadeToOrder,
        photos: input.photos,
        videoUrl: input.videoUrl ?? null,
        certificateId: input.certificateId ?? null,
        artisanId: artisan.id,
        reservedUntil,
        reservedByOrderId: null,
      },
      include: { artisan: true },
    });

    return NextResponse.json({ rug: serializeRug(created) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
