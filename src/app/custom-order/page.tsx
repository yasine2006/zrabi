import type { Metadata } from "next";
import { CustomOrderView } from "@/components/pages/CustomOrderView";
import { getServerLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const CUSTOM_META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "Tapis sur mesure — dessiné pour votre pièce",
    description:
      "Composez un tapis marocain sur mesure : tradition, dimensions, laines teintes à la main. Prix au m² en direct et acompte de 30 %.",
  },
  en: {
    title: "Bespoke rugs — designed for your room",
    description:
      "Compose a bespoke Moroccan rug: tradition, dimensions, hand-dyed wools. Live price per square metre and 30% deposit.",
  },
  ar: {
    title: "زربية حسب الطلب — مصممة لغرفتك",
    description:
      "صمّم زربية مغربية حسب الطلب: التقاليد، الأبعاد، أصواف مصبوغة يدوياً. سعر المتر المربع فورياً وتسبيق 30%.",
  },
};

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const meta = CUSTOM_META[locale] ?? CUSTOM_META.fr;
  return { title: meta.title, description: meta.description };
}

export default function CustomOrderPage() {
  return <CustomOrderView />;
}
