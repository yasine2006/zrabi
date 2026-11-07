import type { Metadata } from "next";
import { OurStoryView } from "@/components/pages/OurStoryView";
import { getStorefrontArtisans } from "@/lib/storefront";
import { getServerLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const STORY_META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Notre histoire — des tapis, des noms, des villages",
    description:
      "Zarbia Atlas travaille directement avec les artisanes du Moyen Atlas. Découvrez nos ateliers, notre méthode de sourcing et les femmes qui nouent chaque pièce.",
  },
  en: {
    title: "Our story — rugs, names, villages",
    description:
      "Zarbia Atlas works directly with the artisans of the Middle Atlas. Discover our workshops, sourcing method and the women who knot each piece.",
  },
  ar: {
    title: "قصتنا — زرابي، أسماء، قرى",
    description:
      "تعمل زربية أطلس مباشرة مع حرفيات الأطلس المتوسط. اكتشف ورشنا وطريقة التوريد والنساء اللواتي يعقدن كل قطعة.",
  },
};

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const meta = STORY_META[locale] ?? STORY_META.fr;
  return { title: meta.title, description: meta.description };
}

export default async function OurStoryPage() {
  const artisans = await getStorefrontArtisans();

  return <OurStoryView artisans={artisans} />;
}
