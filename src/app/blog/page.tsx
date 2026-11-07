import type { Metadata } from "next";
import { BlogIndexView } from "@/components/pages/BlogIndexView";
import { getServerLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const BLOG_META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Journal — guides tapis marocains",
    description:
      "Guides sur les traditions, l’entretien et les dimensions des tapis marocains. Beni Ourain ou Azilal, nettoyage de la laine, guide des tailles.",
  },
  en: {
    title: "Journal — Moroccan rug guides",
    description:
      "Guides on traditions, care and sizing of Moroccan rugs. Beni Ourain or Azilal, wool cleaning, size guide.",
  },
  ar: {
    title: "المدونة — أدلة الزرابي المغربية",
    description:
      "أدلة حول التقاليد والعناية وأحجام الزرابي المغربية. بني وراين أو أزيلال، تنظيف الصوف، دليل المقاسات.",
  },
};

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const meta = BLOG_META[locale] ?? BLOG_META.fr;
  return { title: meta.title, description: meta.description };
}

export default function BlogPage() {
  return <BlogIndexView />;
}
