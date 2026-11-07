import { HomeView } from "@/components/pages/HomeView";
import {
  getStorefrontArtisans,
  getStorefrontRugs,
} from "@/lib/storefront";

/**
 * The storefront must reflect live stock and 15-minute reservations, so the
 * home page is rendered on demand instead of being frozen at build time.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rugs, artisans] = await Promise.all([
    getStorefrontRugs(),
    getStorefrontArtisans(),
  ]);

  return <HomeView rugs={rugs} artisan={artisans[0] ?? null} />;
}
