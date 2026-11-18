import { prisma } from "./db";
import { serializeRug } from "./api/serializers";
import { releaseExpiredReservations } from "./stock";
import { INITIAL_STORE_RUGS, INITIAL_ARTISANS } from "./initial-data";

/**
 * Server-only storefront reads.
 *
 * Stock and reservation state change while shoppers browse, so every helper
 * first releases expired 15-minute holds and pages opt out of static caching.
 *
 * A robust fallback to `initial-data.ts` is implemented so if PostgreSQL or Prisma
 * is offline or unreachable, storefront pages (`/`, `/shop`, `/rugs/[slug]`)
 * gracefully serve the authentic artisanal fallback catalogue without crashing.
 */

const rugInclude = { artisan: true } as const;

export async function getStorefrontRugs() {
  try {
    releaseExpiredReservations().catch(() => 0);

    const rugs = await prisma.rug.findMany({
      include: rugInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    if (rugs && rugs.length > 0) {
      return rugs.map(serializeRug);
    }
  } catch (error) {
    console.warn(
      "[storefront] Database query failed; using fallback static catalogue.",
      error instanceof Error ? error.message : error,
    );
  }

  return INITIAL_STORE_RUGS;
}

export async function getRugBySlug(slug: string) {
  try {
    releaseExpiredReservations().catch(() => 0);

    const rug = await prisma.rug.findUnique({
      where: { slug },
      include: rugInclude,
    });

    if (rug) return serializeRug(rug);
  } catch (error) {
    console.warn(
      `[storefront] Failed to load rug "${slug}" from DB; checking fallback.`,
      error instanceof Error ? error.message : error,
    );
  }

  const fallback = INITIAL_STORE_RUGS.find((r) => r.slug === slug);
  return fallback ?? null;
}

export async function getFeaturedRugs(limit = 4) {
  try {
    const rugs = await prisma.rug.findMany({
      where: { status: { not: "SOLD" } },
      include: rugInclude,
      orderBy: [{ isMadeToOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    if (rugs && rugs.length > 0) {
      return rugs.map(serializeRug);
    }
  } catch (error) {
    console.warn(
      "[storefront] Failed to load featured rugs; using fallback.",
      error instanceof Error ? error.message : error,
    );
  }

  return INITIAL_STORE_RUGS.filter((r) => r.status !== "SOLD").slice(0, limit);
}

export async function getStorefrontArtisans() {
  try {
    const artisans = await prisma.artisan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (artisans && artisans.length > 0) {
      return artisans.map((artisan) => ({
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
      }));
    }
  } catch (error) {
    console.warn(
      "[storefront] Failed to load artisans from DB; using fallback artisans.",
      error instanceof Error ? error.message : error,
    );
  }

  return INITIAL_ARTISANS;
}

export type StorefrontArtisan = Awaited<
  ReturnType<typeof getStorefrontArtisans>
>[number];
