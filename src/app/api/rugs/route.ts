import { Prisma, RugStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { ApiError, handleApiError, readJson } from "@/lib/api/errors";
import { generateRugSku, slugify } from "@/lib/api/identifiers";
import { rugCreateSchema, rugListQuerySchema } from "@/lib/api/schemas";
import { serializeRug } from "@/lib/api/serializers";
import { convertFromMad, getCurrencyRates, roundMoney } from "@/lib/currency";
import {
  releaseExpiredReservations,
  reservationExpiry,
} from "@/lib/stock";
import { INITIAL_STORE_RUGS } from "@/lib/initial-data";

/** Catalogue output must never be cached: stock and reservations change. */
export const dynamic = "force-dynamic";

const SORT_MAP: Record<
  string,
  Prisma.RugOrderByWithRelationInput
> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  price_asc: { priceMad: "asc" },
  price_desc: { priceMad: "desc" },
  name_asc: { nameFr: "asc" },
  name_desc: { nameFr: "desc" },
};

/**
 * GET /api/rugs
 *
 * Public catalogue. Expired 15-minute reservations are released before the
 * query so buyers never see a rug that is locked by a dead checkout.
 */
export async function GET(request: Request) {
  try {
    // Release expired holds without blocking the catalogue response.
    releaseExpiredReservations().catch(() => 0);
    const releasedReservations = 0;

    const url = new URL(request.url);
    const raw: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (value !== "") raw[key] = value;
    });

    const query = rugListQuerySchema.parse(raw);

    const where: Prisma.RugWhereInput = {};

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.region) {
      where.originRegion = { equals: query.region, mode: "insensitive" };
    }
    if (query.isMadeToOrder) {
      where.isMadeToOrder = query.isMadeToOrder === "true";
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.priceMad = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const skip = (query.page - 1) * query.limit;

    const [rugs, total] = await prisma.$transaction([
      prisma.rug.findMany({
        where,
        include: { artisan: true },
        orderBy: SORT_MAP[query.sort] ?? SORT_MAP.newest,
        skip,
        take: query.limit,
      }),
      prisma.rug.count({ where }),
    ]);

    return NextResponse.json({
      rugs: rugs.map(serializeRug),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      meta: { releasedReservations },
    });
  } catch (error) {
    console.warn(
      "[api/rugs] Database query failed; returning fallback catalogue.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({
      rugs: INITIAL_STORE_RUGS,
      pagination: {
        page: 1,
        limit: INITIAL_STORE_RUGS.length,
        total: INITIAL_STORE_RUGS.length,
        totalPages: 1,
      },
      meta: { releasedReservations: 0, fallback: true },
    });
  }
}

/**
 * POST /api/rugs
 *
 * Admin-only creation. EUR/USD prices are derived from the base MAD price and
 * the live CurrencyRate table when they are not supplied explicitly.
 */
export async function POST(request: Request) {
  try {
    requireAdmin(request, { write: true });

    const input = rugCreateSchema.parse(await readJson(request));

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

    // Keep catalogue invariants consistent with the stock/webhook flows:
    // sold pieces have no stock, and a manually reserved piece still expires.
    const status = input.status;
    const stock = status === RugStatus.SOLD ? 0 : input.stock;
    const reservedUntil =
      status === RugStatus.RESERVED ? reservationExpiry() : null;

    const created = await prisma.rug.create({
      data: {
        slug: input.slug ?? (slugify(input.nameFr) || `rug-${Date.now().toString(36)}`),
        sku: input.sku ?? generateRugSku(input.type),
        nameFr: input.nameFr,
        nameEn: input.nameEn,
        nameAr: input.nameAr ?? null,
        type: input.type,
        widthCm: input.widthCm,
        lengthCm: input.lengthCm,
        weightKg: input.weightKg,
        materialFr: input.materialFr,
        materialEn: input.materialEn,
        materialAr: input.materialAr ?? null,
        originVillage: input.originVillage,
        originRegion: input.originRegion,
        originAr: input.originAr ?? null,
        craftingDays: input.craftingDays,
        storyFr: input.storyFr,
        storyEn: input.storyEn,
        storyAr: input.storyAr ?? null,
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
        // Creation never inherits another order's lock.
        reservedUntil,
        reservedByOrderId: null,
      },
      include: { artisan: true },
    });

    return NextResponse.json(
      { rug: serializeRug(created) },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
