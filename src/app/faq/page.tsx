import type { Metadata } from "next";
import { FaqView } from "@/components/pages/FaqView";
import { getServerLocale } from "@/lib/i18n-server";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const FAQ_META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "FAQ — livraison, authenticité, paiement",
    description:
      "Réponses sur la livraison internationale, les retours, l’authenticité des tapis, l’entretien de la laine, le paiement à la livraison et le sur-mesure.",
  },
  en: {
    title: "FAQ — shipping, authenticity, payment",
    description:
      "Answers on international shipping, returns, rug authenticity, wool care, cash on delivery and bespoke commissions.",
  },
  ar: {
    title: "الأسئلة الشائعة — التوصيل، الأصالة، الدفع",
    description:
      "إجابات حول التوصيل الدولي، الإرجاع، أصالة الزرابي، العناية بالصوف، الدفع عند الاستلام والطلبات حسب الطلب.",
  },
};

export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const meta = FAQ_META[locale] ?? FAQ_META.fr;
  return { title: meta.title, description: meta.description };
}

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Combien de temps prend la livraison ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Maroc 1 à 3 jours ouvrés, Europe 4 à 7 jours, Amérique du Nord 6 à 10 jours, Moyen-Orient 5 à 9 jours.",
      },
    },
    {
      "@type": "Question",
      name: "Les tapis sont-ils vraiment faits main ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Chaque pièce est tissée à la main par des artisanes de l'Atlas, avec certificat d'origine et numéro de série.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je payer à la livraison ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui au Maroc (paiement à la livraison). À l'international, le paiement par carte est requis.",
      },
    },
    {
      "@type": "Question",
      name: "Quelle est la politique de retour ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Retour sous 14 jours, pièce inutilisée et dans son emballage d'origine. Remboursement sous 14 jours.",
      },
    },
  ],
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={FAQ_JSONLD} />
      <FaqView />
    </>
  );
}
