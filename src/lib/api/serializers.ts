import type { Artisan, Rug } from "@prisma/client";

/**
 * JSON-safe representations. Prisma returns Decimal instances (serialized as
 * strings by JSON.stringify) and Date objects; the API exposes numbers and ISO
 * strings instead so clients always get predictable types.
 */

type RugWithArtisan = Rug & { artisan?: Artisan | null };

export function serializeRug(rug: RugWithArtisan) {
  const { artisan, reservedByOrderId: _reservedByOrderId, ...rest } = rug;

  return {
    ...rest,
    weightKg: Number(rest.weightKg),
    priceMad: Number(rest.priceMad),
    priceEur: Number(rest.priceEur),
    priceUsd: Number(rest.priceUsd),
    reservedUntil: rest.reservedUntil?.toISOString() ?? null,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    artisan: artisan
      ? {
          id: artisan.id,
          slug: artisan.slug,
          nameFr: artisan.nameFr,
          nameEn: artisan.nameEn,
          bioFr: artisan.bioFr,
          bioEn: artisan.bioEn,
          village: artisan.village,
          region: artisan.region,
          photoUrl: artisan.photoUrl,
          craftSince: artisan.craftSince,
        }
      : null,
  };
}

export type SerializedRug = ReturnType<typeof serializeRug>;
