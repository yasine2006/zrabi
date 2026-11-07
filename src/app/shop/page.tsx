import type { Metadata } from "next";
import { ShopView } from "@/components/pages/ShopView";
import { RUG_TYPES, type RugTypeValue } from "@/lib/i18n";
import { getStorefrontRugs } from "@/lib/storefront";
import { getServerLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const SHOP_META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Boutique — tapis marocains faits main",
    description:
      "Découvrez les tapis Beni Ourain, Azilal, Boucherouite, Kilim et Hanbel disponibles. Chaque pièce est unique, certifiée et expédiée dans le monde entier.",
  },
  en: {
    title: "Shop — handmade Moroccan rugs",
    description:
      "Discover available Beni Ourain, Azilal, Boucherouite, Kilim and Hanbel rugs. Each piece is unique, certified and shipped worldwide.",
  },
  ar: {
    title: "المتجر — زرابي مغربية منسوجة يدوياً",
    description:
      "اكتشف الزرابي المتاحة: بني وراين، أزيلال، بوشورويت، كليم وهنبل. كل قطعة فريدة، معتمدة، وتُشحن إلى جميع أنحاء العالم.",
  },
};

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const meta = SHOP_META[locale] ?? SHOP_META.fr;
  return { title: meta.title, description: meta.description };
}

interface ShopPageProps {
  searchParams: { type?: string };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const rugs = await getStorefrontRugs();

  const requestedType = searchParams.type;
  const initialType =
    requestedType &&
    RUG_TYPES.some((option) => option.value === requestedType)
      ? (requestedType as RugTypeValue)
      : null;

  return <ShopView rugs={rugs} initialType={initialType} />;
}
