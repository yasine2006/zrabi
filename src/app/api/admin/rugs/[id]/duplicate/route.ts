import { RugStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api/admin";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { generateRugSku } from "@/lib/api/identifiers";
import { serializeRug } from "@/lib/api/serializers";

export const dynamic = "force-dynamic";

async function uniqueSlug(base: string): Promise<string> {
  let candidate = `${base}-copie`;
  let counter = 2;

  while (
    await prisma.rug.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${base}-copie-${counter}`;
    counter += 1;
  }

  return candidate;
}

/**
 * POST /api/admin/rugs/[id]/duplicate
 *
 * Creates an editable copy of a piece. Unique catalogue fields (slug, SKU,
 * certificate, reservation, views) are reset so the original remains
 * untouched and the copy can be published as a separate listing.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireAdmin(request, { write: true });

    const source = await prisma.rug.findUnique({
      where: { id: params.id },
    });

    if (!source) {
      throw new ApiError(404, "Rug not found.", "NOT_FOUND");
    }

    const slug = await uniqueSlug(source.slug);

    let sku = generateRugSku(source.type);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const clash = await prisma.rug.findUnique({
        where: { sku },
        select: { id: true },
      });
      if (!clash) break;
      sku = generateRugSku(source.type);
    }

    const created = await prisma.rug.create({
      data: {
        slug,
        sku,
        nameFr: `${source.nameFr} (copie)`,
        nameEn: `${source.nameEn} (copy)`,
        type: source.type,
        widthCm: source.widthCm,
        lengthCm: source.lengthCm,
        weightKg: source.weightKg,
        materialFr: source.materialFr,
        materialEn: source.materialEn,
        originVillage: source.originVillage,
        originRegion: source.originRegion,
        craftingDays: source.craftingDays,
        storyFr: source.storyFr,
        storyEn: source.storyEn,
        priceMad: source.priceMad,
        priceEur: source.priceEur,
        priceUsd: source.priceUsd,
        stock: 1,
        status: RugStatus.AVAILABLE,
        isMadeToOrder: source.isMadeToOrder,
        photos: source.photos,
        videoUrl: source.videoUrl,
        certificateId: null,
        artisanId: source.artisanId,
        reservedUntil: null,
        reservedByOrderId: null,
        viewCount: 0,
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
