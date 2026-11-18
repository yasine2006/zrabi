"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Globe2,
  Hand,
  Mail,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RugCard } from "@/components/RugCard";
import { useStore } from "@/context/StoreContext";
import type { SerializedRug } from "@/lib/api/serializers";
import { RUG_TYPES, rugTypeLabel } from "@/lib/i18n";
import type { StorefrontArtisan } from "@/lib/storefront";
import { cn } from "@/lib/utils";

interface HomeViewProps {
  rugs: SerializedRug[];
  artisan: StorefrontArtisan | null;
}

/** Fixed hero background image. Replace this URL to change the hero photo. */
const HERO_IMAGE =
  "https://tse1.mm.bing.net/th/id/OIP.IP8GU4v2gSfr8zP7R9JCuQHaE6?r=0&rs=1&pid=ImgDetMain&o=7&rm=3";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function HomeView({ rugs, artisan }: HomeViewProps) {
  const { t, locale } = useStore();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || newsletterBusy) return;

    setNewsletterBusy(true);
    setNewsletterError(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale, source: "home" }),
      });

      if (!response.ok) {
        throw new Error("subscribe-failed");
      }

      setSubscribed(true);
      setEmail("");
    } catch {
      setNewsletterError(
        t(
          "Inscription momentanément indisponible. Réessayez dans un instant.",
          "Sign-up is temporarily unavailable. Please try again in a moment.",
          "الاشتراك غير متاح مؤقتاً. حاول مرة أخرى بعد قليل.",
        ),
      );
    } finally {
      setNewsletterBusy(false);
    }
  }

  const featured = rugs.filter((rug) => rug.status !== "SOLD").slice(0, 4);
  const heroRug = rugs[0];
  const heroSecondary = rugs.find((rug) => rug.photos[1] && rug.id !== heroRug?.id);

  const collectionImages = useMemo(() => {
    return RUG_TYPES.reduce<Record<string, string | undefined>>((map, type) => {
      const rug = rugs.find((item) => item.type === type.value);
      map[type.value] = rug?.photos[0];
      return map;
    }, {});
  }, [rugs]);

  const pillars = [
    {
      icon: Hand,
      title: t("100 % fait main", "100% Handmade", "100% منسوج يدوياً"),
      detail: t(
        "Noué ou tissé à la main, jamais en série.",
        "Knotted or woven by hand, never mass-produced.",
        "منسوج عقدة بعقدة، أبداً على نطاق صناعي.",
      ),
    },
    {
      icon: Globe2,
      title: t("Livraison mondiale", "Worldwide Shipping", "شحن دولي مؤمن"),
      detail: t(
        "DHL & Aramex vers 60+ destinations.",
        "DHL & Aramex to 60+ destinations.",
        "DHL و Aramex إلى 60+ وجهة.",
      ),
    },
    {
      icon: ShieldCheck,
      title: t("Paiement sécurisé", "Secure Payment", "دفع آمن 100%"),
      detail: t(
        "CMI, Stripe ou à la livraison au Maroc.",
        "CMI, Stripe or cash on delivery in Morocco.",
        "CMI، Stripe أو الدفع عند الاستلام بالمغرب.",
      ),
    },
    {
      icon: BadgeCheck,
      title: t("Certificat d’authenticité", "Certificate of Authenticity", "شهادة الأصالة"),
      detail: t(
        "Signé, numéroté, transmis avec chaque pièce.",
        "Signed, numbered and sent with every piece.",
        "موقّعة، مرقّمة، تُرسل مع كل قطعة.",
      ),
    },
  ];

  const marquee = useMemo(() => {
    const pillars = [
      t("Laine vierge de l’Atlas", "Virgin Atlas wool", "صوف الأطلس حر"),
      t("Teintures végétales", "Plant-based dyes", "أصباغ نباتية"),
      t("Pièces uniques", "One-of-a-kind pieces", "قطع فريدة"),
      t("Commerce direct", "Direct trade", "تجارة مباشرة"),
      t("Savoir-faire berbère", "Berber craftsmanship", "حرفة أمازيغية"),
    ];
    const materials = Array.from(
      new Set(
        rugs
          .map((r) =>
            locale === "ar"
              ? r.materialAr ?? r.materialFr
              : locale === "en"
                ? r.materialEn
                : r.materialFr,
          )
          .filter(Boolean),
      ),
    );
    const origins = Array.from(
      new Set(rugs.map((r) => r.originRegion).filter(Boolean)),
    );
    return [...pillars, ...materials, ...origins];
  }, [rugs, locale, t]);

  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    if (marquee.length === 0) return;
    const id = setInterval(() => {
      setRotatingIndex((i) => (i + 1) % marquee.length);
    }, 2400);
    return () => clearInterval(id);
  }, [marquee.length]);

  return (
    <div className="overflow-hidden">
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt={t("Tapis marocain artisanal dans un intérieur de luxe", "Artisanal Moroccan rug in a luxury interior", "زربية مغربية تقليدية في ديكور أصيل وفاخر")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Cinematic rich overlays for ultra-sharp text contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
        <div className="pointer-events-none absolute inset-0 bg-zellige opacity-20 mix-blend-overlay" />

        <div className="container-page relative z-10 py-20 sm:py-28 lg:py-32">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center gap-3"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-black/50 px-4 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.24em] text-gold shadow-lg backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
                {t(
                  "Pièces Uniques & Certifiées · Atlas Maroc",
                  "Unique & Certified Pieces · Atlas Morocco",
                  "قطع فريدة ومعتمدة · أطلس المغرب",
                )}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-serif text-[3.4rem] font-semibold leading-[0.95] tracking-[-0.035em] text-white drop-shadow-md sm:text-[4.8rem] lg:text-[5.8rem]"
            >
              {locale === "ar" ? (
                <>
                  أصالة الأطلس،
                  <span className="block font-serif italic text-gold">
                    منسوجة بأنامل ذهبية.
                  </span>
                </>
              ) : locale === "en" ? (
                <>
                  The soul of the Atlas,
                  <span className="block font-serif italic text-gold">
                    knotted by hand.
                  </span>
                </>
              ) : (
                <>
                  L’âme de l’Atlas,
                  <span className="block font-serif italic text-gold">
                    nouée à la main.
                  </span>
                </>
              )}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 flex items-center justify-center gap-3"
            >
              <span className="h-px w-10 bg-gold/70" />
              <motion.span
                key={rotatingIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-xl italic text-gold drop-shadow-sm"
              >
                {marquee[rotatingIndex]}
              </motion.span>
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-2xl text-pretty text-base font-normal leading-[1.8] text-white/90 drop-shadow-sm sm:text-lg"
            >
              {t(
                "Des tapis berbères d'exception choisis un à un dans les villages du Moyen et du Haut Atlas. Laine vierge naturelle, teintures végétales et savoir-faire ancestral transmis de mère en fille — expédiés avec certificat d'origine chez vous, partout dans le monde.",
                "Exceptional Berber rugs selected one by one in the villages of the Middle and High Atlas. Natural virgin wool, plant-based dyes and ancestral craft passed down through generations — shipped with certificate of origin to your door worldwide.",
                "زرابي أمازيغية استثنائية منتقاة بعناية فائقة من قرى الأطلس المتوسط والكبير. صوف طبيعي حر، أصباغ نباتية، وحرفة متوارثة عبر الأجيال — تُشحن مع شهادة الأصالة إلى باب منزلك في جميع أنحاء العالم.",
              )}
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center sm:items-center"
            >
              <Link
                href="/shop"
                className="btn bg-terracotta px-8 py-4 text-sm font-bold text-white shadow-lift transition hover:bg-terracottaDark hover:scale-[1.02] group"
              >
                {t("Découvrir la collection", "Explore the collection", "تصفح المجموعة الفريدة")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl-flip" />
              </Link>
              <Link
                href="/custom-order"
                className="btn border border-white/40 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-md shadow-soft transition hover:bg-white hover:text-ink hover:scale-[1.02] group"
              >
                {t("Composer mon tapis", "Design my rug", "صمم زربيتك الخاصة")}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl-flip" />
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 border-t border-white/20 pt-7"
            >
              {[
                [String(rugs.length), t("pièces uniques", "unique pieces", "قطع فريدة")],
                ["3", t("villages partenaires", "partner villages", "قرى شريكة")],
                ["5", t("traditions tissées", "woven traditions", "تقاليد منسوجة")],
                ["100%", t("fait main au Maroc", "handmade in Morocco", "منسوج يدوياً بالمغرب")],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-serif text-3xl font-bold leading-none text-gold drop-shadow-sm">
                    {value}
                  </p>
                  <p className="mt-1.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white/80">
                    {label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* -------------------------------------------------------------- pillars */}
      <section className="border-y border-line/70 bg-surface/35">
        <div className="container-page grid grid-cols-2 gap-x-4 gap-y-8 py-10 sm:py-12 lg:grid-cols-4">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.07 }}
              className={cn(
                "flex items-start gap-3 px-1 lg:px-5",
                index > 0 && "lg:border-l lg:border-line/80",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background text-terracotta shadow-sm">
                <pillar.icon className="h-[1.15rem] w-[1.15rem]" />
              </span>
              <div>
                <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink/85">
                  {pillar.title}
                </h2>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                  {pillar.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- collections */}
      <section className="container-page py-24 sm:py-32">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow-line">{t("Cinq traditions", "Five traditions", "خمس تقاليد")}</p>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-[3.4rem] sm:leading-[1.02]">
              {t(
                "Une collection, cinq écritures.",
                "One collection, five dialects.",
                "مجموعة واحدة، خمس لهجات.",
              )}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t(
              "Chaque tribu possède son vocabulaire de motifs, de couleurs et de gestes. Explorez-les un par un.",
              "Each tribe has its own vocabulary of motifs, colours and gestures. Explore them one by one.",
              "كل قبيلة تملك مفردات خاصة من النقوش والألوان والحركات. استكشفها واحدة تلو الأخرى.",
            )}
          </p>
        </div>

        <div className="mt-12 grid auto-rows-[13rem] grid-cols-2 gap-3 sm:auto-rows-[15rem] lg:grid-cols-4 lg:gap-4">
          {RUG_TYPES.map((type, index) => {
            const image = collectionImages[type.value];
            const count = rugs.filter((rug) => rug.type === type.value).length;

            return (
              <motion.div
                key={type.value}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className={cn(
                  index === 0 && "col-span-2 row-span-2",
                  index === 3 && "lg:col-span-1",
                )}
              >
                <Link
                  href={`/shop?type=${type.value}`}
                  className="group relative block h-full overflow-hidden rounded-[1.6rem] bg-wool ring-1 ring-transparent transition duration-500 hover:ring-gold/50"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={rugTypeLabel(type.value, locale)}
                      fill
                      sizes={index === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                      className="object-cover transition duration-700 ease-out group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                    <div>
                      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-background/65">
                        {String(index + 1).padStart(2, "0")} · {count}{" "}
                        {t("pièces", "pieces")}
                      </p>
                      <h3
                        className={cn(
                          "mt-1 font-serif font-semibold leading-none text-background",
                          index === 0 ? "text-4xl sm:text-5xl" : "text-2xl",
                        )}
                      >
                        {rugTypeLabel(type.value, locale)}
                      </h3>
                      {index === 0 ? (
                        <p className="mt-3 max-w-sm text-xs leading-relaxed text-background/75">
                          {t(
                            "Le classique ivoire et charbon des plateaux, à la laine haute et dense.",
                            "The ivory-and-charcoal classic of the plateau, with a deep, dense pile.",
                            "الكلاسيكي العاجي والفحمي للهضبة، بوبرة عالية وكثيفة.",
                          )}
                        </p>
                      ) : null}
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/10 text-background backdrop-blur transition group-hover:bg-background group-hover:text-ink">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------ marquee */}
      <section className="border-y border-line/70 bg-ink py-4 text-background">
        <div className="flex overflow-hidden">
          <div className="marquee-track flex w-max">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className="flex shrink-0 items-center gap-10 pr-10"
              >
                {marquee.map((item) => (
                  <span
                    key={`${item}-${copy}`}
                    className="flex items-center gap-10 whitespace-nowrap text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-background/75"
                  >
                    {item}
                    <span className="h-1 w-1 rotate-45 bg-gold/80" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- featured */}
      <section className="container-page py-24 sm:py-32">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow-line">{t("Sélection du moment", "Current selection", "اختيار اللحظة")}</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-[3.4rem] sm:leading-[1.02]">
              {t("Pièces uniques, jamais rééditées.", "Unique pieces, never repeated.", "قطع فريدة، لا تُعاد أبداً.")}
            </h2>
          </div>
          <Link
            href="/shop"
            className="link-underline group inline-flex items-center gap-2 text-sm font-semibold text-terracotta"
          >
            {t("Voir toute la collection", "See the full collection", "عرض كامل المجموعة")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((rug, index) => (
            <RugCard key={rug.id} rug={rug} index={index} />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------- artisan */}
      {artisan ? (
        <section className="relative overflow-hidden bg-surface/40 py-24 sm:py-32">
          <div className="pointer-events-none absolute inset-0 bg-zellige opacity-40" />
          <div className="container-page relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-wool shadow-card outline outline-1 outline-offset-[6px] outline-gold/20 sm:rounded-[2.5rem]">
                {artisan.photoUrl ? (
                  <Image
                    src={artisan.photoUrl}
                    alt={locale === "ar" ? artisan.nameFr : locale === "en" ? artisan.nameEn : artisan.nameFr}
                    fill
                    sizes="(min-width: 1024px) 42vw, 90vw"
                    className="object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-background/90 p-4 backdrop-blur">
                  <p className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-terracotta">
                    <MapPin className="h-3.5 w-3.5" />
                    {artisan.village}
                  </p>
                  <p className="mt-1 font-serif text-xl font-semibold">
                    {locale === "ar" ? artisan.nameFr : locale === "en" ? artisan.nameEn : artisan.nameFr}
                  </p>
                </div>
              </div>
              <div className="absolute -right-3 -top-4 hidden rounded-2xl border border-line bg-background px-4 py-3 shadow-soft sm:block">
                <p className="font-serif text-2xl font-semibold text-terracotta">
                  {artisan.craftSince
                    ? new Date().getFullYear() - artisan.craftSince
                    : 30}+
                </p>
                <p className="text-[0.56rem] uppercase tracking-[0.18em] text-muted">
                  {t("ans de métier", "years of craft", "سنوات من الحرفة")}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
            >
              <p className="eyebrow-line">{t("Derrière chaque nœud", "Behind every knot", "خلف كل عقدة")}</p>
              <Quote className="mt-6 h-8 w-8 text-gold/70" />
              <blockquote className="mt-4 max-w-2xl font-serif text-[2rem] font-medium leading-[1.24] tracking-[-0.02em] sm:text-[2.7rem]">
                {locale === "ar"
                  ? `« ${artisan.bioFr} »`
                  : locale === "en"
                    ? `“${artisan.bioEn}”`
                    : `« ${artisan.bioFr} »`}
              </blockquote>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-ink/70">
                {locale === "en" ? artisan.nameEn : artisan.nameFr}
              </p>
              <p className="mt-1 text-xs text-muted">{artisan.region}</p>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-line/80 pt-6">
                {[
                  [t("Direct", "Direct"), t("sans intermédiaire", "no middlemen")],
                  [t("Unique", "Unique"), t("une seule pièce", "only one piece")],
                  [t("Juste", "Fair"), t("prix rémunérateur", "fair pay")],
                ].map(([title, detail]) => (
                  <div key={title}>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta">
                      {title}
                    </p>
                    <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>

              <Link href="/our-story" className="btn-ghost mt-8">
                {t("Lire notre histoire", "Read our story", "اقرأ قصتنا")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* --------------------------------------------------------------- journal */}
      <section className="container-page py-24 sm:py-32">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="eyebrow-line">{t("Le journal", "The journal", "المدونة")}</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.03em] sm:text-[3.4rem] sm:leading-[1.02]">
              {t("Comprendre le tapis.", "Understanding the rug.", "فهم الزربية.")}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {t(
                "Des guides précis pour choisir, comparer et prendre soin d’une pièce qui traversera les années.",
                "Clear guides to choose, compare and care for a piece that will last for years.",
                "أدلة دقيقة للاختيار والمقارنة والعناية بقطعة سترافقك عبر السنين.",
              )}
            </p>
            <Link
              href="/blog"
              className="link-underline group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-terracotta"
            >
              {t("Tous les articles", "All articles", "جميع المقالات")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                href: "/blog/beni-ourain-vs-azilal",
                title: "Beni Ourain vs Azilal",
                detail: t("Deux familles, deux caractères.", "Two families, two characters.", "عائلتان، شخصيتان."),
              },
              {
                href: "/blog/clean-a-moroccan-rug",
                title: t("Nettoyer un tapis marocain", "How to clean a Moroccan rug", "كيف تنظف زربية مغربية"),
                detail: t("Le geste juste, sans abîmer la laine.", "The right care, without harming the wool.", "اللمسة الصحيحة، دون إتلاف الصوف."),
              },
              {
                href: "/blog/moroccan-rug-sizes-guide",
                title: t("Guide des dimensions", "Moroccan rug sizes guide", "دليل المقاسات"),
                detail: t("Trouver le format qui habite la pièce.", "Find the size that anchors the room.", "اعثر على المقاس الذي يُكمل الغرفة."),
              },
            ].map((article, index) => (
              <Link
                key={article.href}
                href={article.href}
                className="group flex min-h-[14rem] flex-col justify-between rounded-2xl border border-line/80 bg-surface/45 p-5 transition duration-500 hover:-translate-y-1.5 hover:border-gold/40 hover:bg-surface hover:shadow-card"
              >
                <span className="stat-num font-serif text-2xl font-semibold text-terracotta/35 transition group-hover:text-gold">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-serif text-[1.35rem] font-semibold leading-tight">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-[0.72rem] leading-relaxed text-muted">
                    {article.detail}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-[0.65rem] font-semibold text-ink/60 transition group-hover:text-terracotta">
                    {t("Lire", "Read", "اقرأ")} <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ newsletter */}
      <section className="container-page pb-10">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-line bg-gradient-to-br from-surface via-background to-surface px-6 py-14 shadow-soft sm:px-10 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0 bg-zellige opacity-15" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-terracotta/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="flex items-center gap-3 text-[0.62rem] font-bold uppercase tracking-[0.3em] text-terracotta">
                <span className="h-px w-10 bg-terracotta/70" />
                {t("Lettre de l’Atlas", "Letters from the Atlas", "رسائل من الأطلس")}
              </p>
              <h2 className="mt-5 max-w-xl font-serif text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.03em] text-ink sm:text-[3.2rem]">
                {t(
                  "Les nouvelles pièces, avant tout le monde.",
                  "New pieces, before anyone else.",
                  "القطع الجديدة، قبل الجميع.",
                )}
              </h2>
              <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted">
                {t(
                  "Une lettre par mois : arrivées à l’atelier, histoires de tissage et conseils de soin. Pas de bruit inutile.",
                  "One letter a month: atelier arrivals, weaving stories and care advice. Nothing noisy.",
                  "رسالة واحدة شهرياً: وصول قطع الورشة، حكايات النسج ونصائح العناية. بلا ضجيج.",
                )}
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.78rem] text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                  {t("Désinscription en un clic.", "Unsubscribe in one click.", "إلغاء الاشتراك بنقرة واحدة.")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                  {t("Aucune revente de données.", "No data reselling.", "لا بيع للبيانات.")}
                </li>
              </ul>
            </div>

            <form
              onSubmit={subscribe}
              className="relative"
            >
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t("Bienvenue dans la famille.", "Welcome to the family.", "مرحباً بك في العائلة.")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {t(
                        "Votre inscription est bien notée. La prochaine lettre partira avec une nouvelle pièce.",
                        "You are on the list. The next letter will leave with a new piece.",
                        "تم تسجيل اشتراكك. ستصلك الرسالة القادمة مع قطعة جديدة.",
                      )}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <>
                  <label htmlFor="newsletter-email" className="sr-only">
                    {t("Adresse e-mail", "Email address", "البريد الإلكتروني")}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted rtl:left-auto rtl:right-4" />
                      <input
                        id="newsletter-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t("vous@exemple.com", "you@example.com", "you@example.com")}
                        className="h-12 w-full rounded-full border border-line bg-background pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-terracotta rtl:pl-4 rtl:pr-11"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={newsletterBusy}
                      className={cn(
                        "flex h-12 items-center justify-center gap-2 rounded-full bg-terracotta px-6 text-sm font-semibold text-background transition hover:bg-terracottaDark hover:shadow-soft",
                        newsletterBusy && "cursor-wait opacity-70",
                      )}
                    >
                      {newsletterBusy
                        ? t("Envoi…", "Sending…", "جارٍ الإرسال…")
                        : t("Recevoir", "Subscribe", "اشترك")}
                      <ArrowRight className="h-4 w-4 rtl-flip" />
                    </button>
                  </div>
                  {newsletterError ? (
                    <p className="mt-3 text-[0.68rem] leading-relaxed text-red-700">
                      {newsletterError}
                    </p>
                  ) : null}
                  <p className="mt-3 text-[0.63rem] leading-relaxed text-muted">
                    {t(
                      "En vous inscrivant, vous acceptez de recevoir nos e-mails. Désinscription en un clic.",
                      "By subscribing you agree to receive our emails. Unsubscribe in one click.",
                      "بالاشتراك توافق على تلقّي رسائلنا. يمكنك إلغاء الاشتراك بنقرة واحدة.",
                    )}
                  </p>
                </>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
