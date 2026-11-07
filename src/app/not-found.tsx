import { ArrowLeft, ArrowRight, Compass, MapPin } from "lucide-react";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n-server";

const COPY = {
  fr: {
    eyebrow: "Erreur 404",
    title: "Cette piste ne mène à aucun tapis.",
    body: "La page a peut-être changé d’adresse, ou la pièce que vous cherchez a trouvé son salon. Reprenez depuis la collection.",
    cta: "Voir la collection",
    back: "Retour à l’accueil",
  },
  en: {
    eyebrow: "Error 404",
    title: "This trail leads to no rug.",
    body: "The page may have moved, or the piece you are looking for has found its home. Start again from the collection.",
    cta: "View the collection",
    back: "Back to home",
  },
  ar: {
    eyebrow: "خطأ 404",
    title: "هذا المسار لا يقود إلى أي زربية.",
    body: "ربما تغيّر عنوان الصفحة، أو أن القطعة التي تبحث عنها وجدت مكانها. ابدأ من جديد من المجموعة.",
    cta: "عرض المجموعة",
    back: "العودة إلى الرئيسية",
  },
} as const;

export default function NotFound() {
  const locale = getServerLocale();
  const copy = COPY[locale];

  return (
    <div className="min-h-[70vh]">
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-line bg-surface text-terracotta">
          <Compass className="h-7 w-7" />
        </span>
        <p className="eyebrow mt-6">{copy.eyebrow}</p>
        <h1 className="mt-2 max-w-xl text-balance font-serif text-4xl font-semibold leading-[1.02] sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          {copy.body}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary">
            {copy.cta}
            <ArrowRight className="h-4 w-4 rtl-flip" />
          </Link>
          <Link href="/" className="btn-ghost">
            <ArrowLeft className="h-4 w-4 rtl-flip" />
            {copy.back}
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.64rem] uppercase tracking-[0.14em] text-muted">
          <Link href="/custom-order" className="transition hover:text-terracotta">
            {locale === "ar" ? "حسب الطلب" : locale === "en" ? "Bespoke" : "Sur mesure"}
          </Link>
          <Link href="/our-story" className="transition hover:text-terracotta">
            {locale === "ar" ? "قصتنا" : locale === "en" ? "Our story" : "Notre histoire"}
          </Link>
          <Link href="/blog" className="transition hover:text-terracotta">
            {locale === "ar" ? "المدونة" : locale === "en" ? "Journal" : "Journal"}
          </Link>
          <Link href="/faq" className="transition hover:text-terracotta">
            FAQ
          </Link>
        </div>

        <p className="mt-8 flex items-center gap-1.5 text-[0.62rem] text-muted/70">
          <MapPin className="h-3 w-3" />
          Aït Bouguemez · Moyen Atlas · Maroc
        </p>
      </div>
    </div>
  );
}
